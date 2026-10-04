import * as maplibregl from 'maplibre-gl'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useThemeLang } from '../i18n/ThemeLangContext'
import { PLACES, STRINGS } from '../i18n/strings'
import { AOI, LL, XY, aoiFc, fc, inAOI, pip, polys, waterData } from '../lib/geometry'
import { SHAPES, styleUrl, type StatusKey } from '../lib/palette'
import { STATUS_TO_KEY, type IncidentProperties } from '../types/domain'

export interface IncidentFeature {
  properties: IncidentProperties
  lngLat: [number, number]
}

export interface MapCanvasHandle {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

export interface MapCanvasProps {
  view: '3D' | '2D'
  layer: 'depth' | 'risk' | 'off'
  showEstimate: boolean
  lonRoads: boolean
  lonBuildings: boolean
  f: number
  incidents: IncidentFeature[]
  selectedId: string | null
  onSelectIncident: (id: string) => void
  sidebarOpen: boolean
}

// Vector source-layer field names below (class, brunnel, render_height, render_min_height)
// follow the OpenMapTiles schema, which CARTO's free vector tiles use.
const ROAD_CLASSES_FOR_SNAP = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']
const ROAD_CLASSES_FOR_CLASSIFY = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service']

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(props, handleRef) {
  const { theme, pal, lang } = useThemeLang()
  const langRef = useRef(lang)
  langRef.current = lang
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const vecSourceRef = useRef<string | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const rafRef = useRef<number | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const classifyKeyRef = useRef<string | null>(null)
  const snapDoneRef = useRef(false)
  const snapTryRef = useRef(0)
  const currentThemeRef = useRef(theme)
  const currentViewTRef = useRef(props.view === '3D' ? 1 : 0)
  // Each incident's current local pixel position. Seeded from its real lng/lat, then
  // overridden for 'hosp'/'bridge' once snap() finds a matching real building/bridge.
  const incPosRef = useRef<Record<string, [number, number]>>({})
  const propsRef = useRef(props)
  propsRef.current = props
  const palRef = useRef(pal)
  palRef.current = pal

  // Keep incPosRef seeded with every incident's base position, without clobbering a
  // snap()-found override for hosp/bridge.
  for (const inc of props.incidents) {
    if (!incPosRef.current[inc.properties.id]) {
      incPosRef.current[inc.properties.id] = XY(inc.lngLat[0], inc.lngLat[1])
    }
  }

  useImperativeHandle(handleRef, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    resetView: () => mapRef.current?.easeTo({ center: LL(1100, 780), zoom: 14.3, duration: 700 }),
  }))

  function hospitalXY(): [number, number] {
    return incPosRef.current['hosp'] ?? [1250, 540]
  }

  function initMap() {
    const theme0 = currentThemeRef.current
    const view0 = propsRef.current.view
    const m = new maplibregl.Map({
      container: containerRef.current!,
      style: styleUrl(theme0),
      center: LL(1100, 780),
      zoom: 14.3,
      pitch: view0 === '3D' ? 58 : 0,
      bearing: view0 === '3D' ? -18 : 0,
      attributionControl: false,
      maxPitch: 80,
    })
    mapRef.current = m
    try {
      m.setPadding({ left: propsRef.current.sidebarOpen ? 380 : 0, right: 0, top: 48, bottom: 56 })
    } catch {
      // padding can fail before the first render; harmless
    }
    m.on('style.load', () => setupLayers())
    m.on('load', () => m.resize())
    roRef.current = new ResizeObserver(() => m.resize())
    roRef.current.observe(containerRef.current!)
    setTimeout(() => m.resize(), 300)
    m.on('idle', () => classify())
  }

  function setupLayers() {
    const m = mapRef.current
    if (!m) return
    const style = m.getStyle()
    const vec = Object.keys(style.sources).find((k) => style.sources[k].type === 'vector')
    vecSourceRef.current = vec ?? null

    m.addSource('dem', {
      type: 'raster-dem',
      tiles: ['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
    })
    m.setTerrain({ source: 'dem', exaggeration: 2.2 })

    const cv = document.createElement('canvas')
    cv.width = 16
    cv.height = 16
    const g = cv.getContext('2d')!
    g.strokeStyle = currentThemeRef.current === 'dark' ? 'rgba(150,240,255,0.75)' : 'rgba(25,110,160,0.6)'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(-2, 18)
    g.lineTo(18, -2)
    g.moveTo(-2, 2)
    g.lineTo(2, -2)
    g.moveTo(14, 18)
    g.lineTo(18, 14)
    g.stroke()
    m.addImage('hatch', g.getImageData(0, 0, 16, 16))

    const anchor = hospitalXY()
    const d = waterData(propsRef.current.f, anchor[0], anchor[1])
    ;(['obs', 'deep', 'est'] as const).forEach((k) => m.addSource(k, { type: 'geojson', data: d[k] }))
    ;(['clsObs', 'clsEst', 'bInund', 'bRisk', 'special'] as const).forEach((k) => m.addSource(k, { type: 'geojson', data: fc([]) }))
    ;(['depth', 'risk'] as const).forEach((k) => m.addSource(k, { type: 'geojson', data: d[k] }))
    m.addSource('aoi', { type: 'geojson', data: aoiFc() })

    const v = palRef.current.vars
    const extLayer = (id: string, src: string, col: unknown, base: unknown) =>
      m.addLayer({
        id,
        type: 'fill-extrusion',
        source: src,
        paint: {
          'fill-extrusion-color': col as string,
          'fill-extrusion-height': ['get', 'h'],
          'fill-extrusion-base': base as number,
          'fill-extrusion-opacity': 0.97,
        },
      })

    m.addLayer({ id: 'w-obs', type: 'fill', source: 'obs', paint: { 'fill-color': v.obsFill } })
    m.addLayer({ id: 'w-deep', type: 'fill', source: 'deep', paint: { 'fill-color': v.deepFill } })
    m.addLayer({ id: 'w-obs-line', type: 'line', source: 'obs', paint: { 'line-color': v.obsStroke, 'line-width': 1.5 } })
    m.addLayer({ id: 'w-est', type: 'fill', source: 'est', paint: { 'fill-pattern': 'hatch', 'fill-opacity': 0.9 } })
    m.addLayer({ id: 'w-est-line', type: 'line', source: 'est', paint: { 'line-color': v.obsStroke, 'line-width': 1.5, 'line-dasharray': [3, 2] } })
    m.addLayer({ id: 'w-depth', type: 'fill', source: 'depth', paint: { 'fill-color': ['get', 'c'], 'fill-opacity': 0.75, 'fill-antialias': false } })
    m.addLayer({ id: 'w-depth-line', type: 'line', source: 'depth', paint: { 'line-color': ['get', 's'], 'line-width': 0.5 } })
    m.addLayer({ id: 'r-risk', type: 'fill-extrusion', source: 'risk', paint: { 'fill-extrusion-color': ['get', 'c'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.75 } })
    m.addLayer({ id: 'r-risk-line', type: 'line', source: 'risk', paint: { 'line-color': ['get', 's'], 'line-width': 0.5 } })
    m.addLayer({ id: 'aoi-line', type: 'line', source: 'aoi', paint: { 'line-color': palRef.current.ink, 'line-width': 1.25, 'line-dasharray': [4, 3], 'line-opacity': 0.75 } })
    m.addLayer({ id: 'cls-obs', type: 'line', source: 'clsObs', layout: { 'line-cap': 'round' }, paint: { 'line-color': palRef.current.SC.cut, 'line-width': 4.5 } })
    m.addLayer({ id: 'cls-est', type: 'line', source: 'clsEst', paint: { 'line-color': palRef.current.SC.cut, 'line-width': 3.5, 'line-dasharray': [1.6, 1.2] } })
    if (vec) {
      m.addLayer({
        id: 'bld-base',
        type: 'fill-extrusion',
        source: vec,
        'source-layer': 'building',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': palRef.current.TINT.clear[0],
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.92,
        },
      })
    }
    extLayer('b-inund', 'bInund', palRef.current.TINT.inund[0], ['get', 'b'])
    extLayer('b-risk', 'bRisk', palRef.current.TINT.risk[0], ['get', 'b'])
    extLayer('special', 'special', ['get', 'c'], 0)

    applyHeights()
    applyLayer()
    markers()
  }

  function applyHeights() {
    const m = mapRef.current
    if (!m || !m.getLayer('special')) return
    const t = currentViewTRef.current
    const scale = (e: unknown) => ['*', e, t]
    const h = ['coalesce', ['get', 'render_height'], 8]
    const b0 = ['coalesce', ['get', 'render_min_height'], 0]
    m.setPaintProperty('r-risk', 'fill-extrusion-height', scale(['get', 'h']) as unknown as number)
    if (m.getLayer('bld-base')) {
      m.setPaintProperty('bld-base', 'fill-extrusion-height', scale(h) as unknown as number)
      m.setPaintProperty('bld-base', 'fill-extrusion-base', scale(b0) as unknown as number)
    }
    ;['b-inund', 'b-risk'].forEach((id) => {
      m.setPaintProperty(id, 'fill-extrusion-height', scale(['get', 'h']) as unknown as number)
      m.setPaintProperty(id, 'fill-extrusion-base', scale(['get', 'b']) as unknown as number)
    })
    m.setPaintProperty('special', 'fill-extrusion-height', scale(['get', 'h']) as unknown as number)
  }

  function animateView(to: number) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const m = mapRef.current
    if (!m) return
    const from = currentViewTRef.current
    const t0 = performance.now()
    const dur = 900
    const step = (now: number) => {
      const u = Math.min(1, (now - t0) / dur)
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2
      currentViewTRef.current = from + (to - from) * e
      m.jumpTo({ pitch: 58 * currentViewTRef.current, bearing: -18 * currentViewTRef.current })
      applyHeights()
      if (u < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  function applyData() {
    const m = mapRef.current
    if (!m || !m.getSource('special')) return
    const anchor = hospitalXY()
    const d = waterData(propsRef.current.f, anchor[0], anchor[1])
    ;(['obs', 'deep', 'est', 'depth', 'risk'] as const).forEach((k) => (m.getSource(k) as maplibregl.GeoJSONSource).setData(d[k]))
    applyLayer()
    classifyKeyRef.current = null
    classify()
  }

  function applyLayer() {
    const m = mapRef.current
    if (!m || !m.getLayer('r-risk-line')) return
    const L = propsRef.current.layer
    const est = propsRef.current.showEstimate
    const sv = (id: string, on: boolean) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    }
    sv('w-obs', L === 'off')
    sv('w-deep', L === 'off')
    sv('w-obs-line', true)
    sv('w-depth', L === 'depth')
    sv('w-depth-line', L === 'depth')
    sv('r-risk', L === 'risk')
    sv('r-risk-line', L === 'risk')
    sv('w-est', est && L !== 'risk')
    sv('w-est-line', est)
    sv('cls-est', est && propsRef.current.lonRoads)
    sv('cls-obs', propsRef.current.lonRoads)
    ;['bld-base', 'b-inund', 'b-risk'].forEach((id) => sv(id, propsRef.current.lonBuildings))
    m.setPaintProperty('w-obs-line', 'line-opacity', L === 'risk' ? 0.55 : 1)
    m.setPaintProperty('w-obs-line', 'line-width', L === 'risk' ? 1 : 1.5)
    if (m.getLayer('bld-base')) m.setPaintProperty('bld-base', 'fill-extrusion-opacity', L === 'off' ? 0.92 : 0.5)
    m.setPaintProperty('b-inund', 'fill-extrusion-opacity', L === 'off' ? 0.97 : 0.5)
    m.setPaintProperty('b-risk', 'fill-extrusion-opacity', L === 'off' ? 0.97 : 0.5)
  }

  function snap(): boolean {
    const m = mapRef.current
    const vec = vecSourceRef.current
    if (snapDoneRef.current || !m || !vec) return false
    snapTryRef.current += 1
    const pick = (
      feats: maplibregl.GeoJSONFeature[],
      pt: (f: maplibregl.GeoJSONFeature) => GeoJSON.Position | null,
    ): [number, number] | null => {
      let best: [number, number] | null = null
      let bd = Infinity
      for (const f of feats) {
        const c = pt(f)
        if (!c) continue
        const [x, y] = XY(c[0] as number, c[1] as number)
        if (!inAOI(x, y)) continue
        const d = Math.hypot(x - AOI.cx, y - AOI.cy)
        if (d < bd) {
          bd = d
          best = [x, y]
        }
      }
      return best
    }
    const h = pick(
      m.querySourceFeatures(vec, { sourceLayer: 'poi', filter: ['==', 'class', 'hospital'] }),
      (f) => (f.geometry.type === 'Point' ? f.geometry.coordinates : null),
    )
    const b = pick(
      m
        .querySourceFeatures(vec, { sourceLayer: 'transportation', filter: ['==', 'brunnel', 'bridge'] })
        .filter((f) => ROAD_CLASSES_FOR_SNAP.includes((f.properties as { class?: string }).class ?? '')),
      (f) => {
        const geo = f.geometry
        const ln = geo.type === 'LineString' ? geo.coordinates : geo.type === 'MultiLineString' ? geo.coordinates[0] : null
        return ln ? ln[Math.floor(ln.length / 2)] : null
      },
    )
    if (h) incPosRef.current['hosp'] = h
    if (b) incPosRef.current['bridge'] = b
    if ((h && b) || snapTryRef.current > 5) {
      snapDoneRef.current = true
      markers()
      return Boolean(h || b)
    }
    return false
  }

  function classify() {
    const m = mapRef.current
    const vec = vecSourceRef.current
    if (!m || !vec || !m.getSource('bInund') || m.getZoom() < 12.5) return
    if (snap()) {
      applyData()
      return
    }
    const P = polys(propsRef.current.f)
    const bl = m.querySourceFeatures(vec, { sourceLayer: 'building' })
    const key = `${propsRef.current.f}|${snapTryRef.current}|${propsRef.current.showEstimate}|${bl.length}|${theme}`
    if (key === classifyKeyRef.current) return
    classifyKeyRef.current = key

    const seen = new Set<string>()
    const inu: GeoJSON.Feature[] = []
    const rk: GeoJSON.Feature[] = []
    for (const f of bl) {
      const g = f.geometry
      const rg = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0][0] : null
      if (!rg) continue
      const k = `${rg[0][0].toFixed(6)},${rg[0][1].toFixed(6)}`
      if (seen.has(k)) continue
      seen.add(k)
      let sx = 0
      let sy = 0
      for (const p of rg) {
        sx += p[0]
        sy += p[1]
      }
      const [x, y] = XY(sx / rg.length, sy / rg.length)
      if (!inAOI(x, y)) continue
      const ins = pip(x, y, P.obs)
      const est = !ins && pip(x, y, P.est)
      if (!ins && !est) continue
      const fprops = f.properties as { render_height?: number; render_min_height?: number }
      ;(ins ? inu : rk).push({
        type: 'Feature',
        properties: { h: (Number(fprops.render_height) || 8) + 0.5, b: Number(fprops.render_min_height) || 0 },
        geometry: g,
      })
    }
    ;(m.getSource('bInund') as maplibregl.GeoJSONSource).setData(fc(inu))
    ;(m.getSource('bRisk') as maplibregl.GeoJSONSource).setData(fc(rk))

    const spc: GeoJSON.Feature[] = []
    for (const inc of propsRef.current.incidents) {
      if (inc.properties.type === 'report') continue
      const pos = incPosRef.current[inc.properties.id]
      if (!pos) continue
      let best: maplibregl.GeoJSONFeature | null = null
      let bd = 45
      for (const f of bl) {
        const g = f.geometry
        const rg = g.type === 'Polygon' ? g.coordinates[0] : g.type === 'MultiPolygon' ? g.coordinates[0][0] : null
        if (!rg) continue
        let sx = 0
        let sy = 0
        for (const p of rg) {
          sx += p[0]
          sy += p[1]
        }
        const [x, y] = XY(sx / rg.length, sy / rg.length)
        const d = Math.hypot(x - pos[0], y - pos[1])
        if (d < bd) {
          bd = d
          best = f
        }
      }
      if (best) {
        const fprops = best.properties as { render_height?: number }
        const statusKey = STATUS_TO_KEY[inc.properties.status]
        const color = statusKey === 'clear' ? palRef.current.SC.clear : palRef.current.FULL[statusKey as Exclude<StatusKey, 'clear'>][0]
        spc.push({ type: 'Feature', properties: { c: color, h: (Number(fprops.render_height) || 8) + 1.5 }, geometry: best.geometry })
      }
    }
    ;(m.getSource('special') as maplibregl.GeoJSONSource).setData(fc(spc))

    const out: Record<number, GeoJSON.Position[][]> = { 1: [], 2: [] }
    for (const f of m.querySourceFeatures(vec, { sourceLayer: 'transportation' })) {
      const cls = (f.properties as { class?: string }).class ?? ''
      if (!ROAD_CLASSES_FOR_CLASSIFY.includes(cls)) continue
      const g = f.geometry
      const lines: GeoJSON.Position[][] = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
      for (const ln of lines) {
        let run: GeoJSON.Position[] | null = null
        let st = 0
        for (let i = 0; i < ln.length - 1; i++) {
          const [x, y] = XY((ln[i][0] + ln[i + 1][0]) / 2, (ln[i][1] + ln[i + 1][1]) / 2)
          const s = !inAOI(x, y) ? 0 : pip(x, y, P.obs) ? 1 : pip(x, y, P.est) ? 2 : 0
          if (s !== st) {
            if (st && run && run.length > 1) out[st].push(run)
            run = s ? [ln[i]] : null
            st = s
          }
          if (s) run?.push(ln[i + 1])
        }
        if (st && run && run.length > 1) out[st].push(run)
      }
    }
    const ml = (coords: GeoJSON.Position[][]) => fc([{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: coords } }])
    ;(m.getSource('clsObs') as maplibregl.GeoJSONSource).setData(ml(out[1]))
    ;(m.getSource('clsEst') as maplibregl.GeoJSONSource).setData(ml(out[2]))
  }

  function markers() {
    const m = mapRef.current
    if (!m) return
    markersRef.current.forEach((x) => x.remove())
    markersRef.current = []
    const curPal = palRef.current
    const curLang = langRef.current
    for (const inc of propsRef.current.incidents) {
      if (inc.properties.type === 'report') continue
      const pos = incPosRef.current[inc.properties.id]
      if (!pos) continue
      const key = STATUS_TO_KEY[inc.properties.status]
      const isCut = key === 'cut'
      const isSel = propsRef.current.selectedId === inc.properties.id
      const show = isCut || isSel
      const bg = isCut ? curPal.CHIP.cut[0] : curPal.pill
      const fgColor = isCut ? curPal.CHIP.cut[1] : curPal.ink
      const fill = isCut ? curPal.CHIP.cut[1] : curPal.SC[key]
      const shortName = curLang === 'th' ? inc.properties.short_name_th ?? inc.properties.short_name : inc.properties.short_name
      const el = document.createElement('div')
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;font-family:Geist,'Noto Sans Thai',sans-serif;"
      el.innerHTML = `<div style="display:flex;align-items:center;gap:6px;height:${isCut ? 34 : 30}px;padding:${show ? '0 12px 0 9px' : '0 8px'};border-radius:3px;background:${bg};color:${fgColor};border:${inc.properties.unverified ? '1.5px dashed ' + curPal.dash : 'none'};box-shadow:${isSel ? '0 0 0 2.5px ' + curPal.ink + ',0 6px 16px rgba(0,0,0,.3)' : '0 4px 12px rgba(0,0,0,.25)'};"><svg width="14" height="14" viewBox="0 0 14 14"><path d="${SHAPES[key]}" fill="${fill}"></path></svg>${show ? `<span style="font-size:13px;font-weight:600;white-space:nowrap;">${shortName}</span>` : ''}</div><div style="width:2px;height:18px;background:${curPal.ink};opacity:.6;"></div><div style="width:8px;height:8px;border-radius:50%;background:${curPal.ink};box-shadow:0 0 0 2px ${curPal.inkOn};"></div>`
      el.onclick = () => propsRef.current.onSelectIncident(inc.properties.id)
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(LL(pos[0], pos[1])).addTo(m))
    }

    const halo = `0 0 3px ${curPal.vars.land},0 0 3px ${curPal.vars.land},0 0 6px ${curPal.vars.land},0 0 6px ${curPal.vars.land},0 0 10px ${curPal.vars.land}`
    for (const k of Object.keys(PLACES) as (keyof typeof PLACES)[]) {
      const [px, py] = PLACES[k]
      if (!inAOI(px, py)) continue
      const el = document.createElement('div')
      el.style.cssText = `pointer-events:none;font:600 12.5px Geist,'Noto Sans Thai',sans-serif;letter-spacing:.02em;color:${curPal.ink};text-shadow:${halo};white-space:nowrap;`
      el.textContent = STRINGS[curLang].places[k]
      markersRef.current.push(new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(LL(px, py)).addTo(m))
    }
  }

  // --- lifecycle ---

  useEffect(() => {
    currentThemeRef.current = theme
    currentViewTRef.current = props.view === '3D' ? 1 : 0
    const t = setInterval(() => {
      if (!containerRef.current) return
      clearInterval(t)
      initMap()
    }, 50)
    return () => {
      clearInterval(t)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      roRef.current?.disconnect()
      markersRef.current.forEach((x) => x.remove())
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    if (currentThemeRef.current !== theme) {
      currentThemeRef.current = theme
      m.setStyle(styleUrl(theme))
    }
  }, [theme])

  useEffect(() => {
    applyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.f])

  useEffect(() => {
    applyLayer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.layer, props.showEstimate, props.lonRoads, props.lonBuildings])

  useEffect(() => {
    if (currentViewTRef.current !== (props.view === '3D' ? 1 : 0)) {
      animateView(props.view === '3D' ? 1 : 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.view])

  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    m.setPadding({ left: props.sidebarOpen ? 380 : 0, right: 0, top: 48, bottom: 56 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.sidebarOpen])

  useEffect(() => {
    markers()
    const pos = props.selectedId ? incPosRef.current[props.selectedId] : null
    if (pos && mapRef.current) mapRef.current.easeTo({ center: LL(pos[0], pos[1]), duration: 800 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedId])

  useEffect(() => {
    markers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  return <div ref={containerRef} className="h-full w-full" />
})
