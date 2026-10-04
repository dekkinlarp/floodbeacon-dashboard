import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import * as maplibregl from 'maplibre-gl'
import { useThemeLang } from '../i18n/ThemeLangContext'
import { API_ROOT, assetUrl, observationDate, type ImageryCatalog, type Observation } from './imagery'
import './routes.css'

const CASE_ID = 'ahr-2021'
const BRIDGE_ZOOM = 17.2

function SatelliteMap({ catalog, observation, onSelect, onError, focusRequest, showFloodExtent }: {
  catalog: ImageryCatalog
  observation: Observation
  onSelect: (id: string) => void
  onError: (message: string) => void
  focusRequest: { id: string; sequence: number } | null
  showFloodExtent: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const observationRef = useRef(observation)
  const onSelectRef = useRef(onSelect)
  const onErrorRef = useRef(onError)
  const [ready, setReady] = useState(false)
  const { theme, lang } = useThemeLang()
  const area = useMemo(() => catalog.study_bounds ?? catalog.bounds, [catalog])
  useEffect(() => {
    onSelectRef.current = onSelect
    onErrorRef.current = onError
    observationRef.current = observation
  }, [onSelect, onError, observation])

  const fitArea = useCallback((map: maplibregl.Map, duration: number) => {
    map.fitBounds([[area[0], area[1]], [area[2], area[3]]], {
      padding: { top: 75, right: 65, bottom: window.innerWidth < 768 ? 25 : 180, left: 30 },
      bearing: 0, pitch: 0, duration,
    })
  }, [area])

  useEffect(() => {
    if (!container.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#252b2d' } }] },
        center: [(area[0] + area[2]) / 2, (area[1] + area[3]) / 2],
        zoom: 10,
        minZoom: 8,
        maxZoom: 21,
        // Leave room around the study area so maxBounds does not force the
        // overview to zoom in and crop it on a wide, short mobile map.
        maxBounds: [[area[0] - 0.3, area[1] - 0.25], [area[2] + 0.3, area[3] + 0.25]],
        attributionControl: false,
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        canvasContextAttributes: { preserveDrawingBuffer: true },
      })
    } catch {
      onErrorRef.current('The satellite map needs WebGL. Open this page in a browser with graphics acceleration enabled.')
      return
    }
    mapRef.current = map
    fitArea(map, 0)
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      if (catalog.flood_extent) {
        map.addSource('agency-flood', { type: 'geojson', data: catalog.flood_extent })
        map.addLayer({ id: 'agency-flood-fill', type: 'fill', source: 'agency-flood', paint: { 'fill-color': '#53cbea', 'fill-opacity': 0.16 } })
        map.addLayer({ id: 'agency-flood-outline', type: 'line', source: 'agency-flood', paint: { 'line-color': '#53cbea', 'line-width': 1.5 } })
      }
      map.addSource('bridges', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'bridge-fill', type: 'fill', source: 'bridges', paint: { 'fill-color': ['match', ['get', 'status'], 'missing_span', '#ff844e', 'visible_crossing', '#87dbb0', '#f4c66a'], 'fill-opacity': 0.08 } })
      map.addLayer({ id: 'bridge-outline', type: 'line', source: 'bridges', paint: { 'line-color': ['match', ['get', 'status'], 'missing_span', '#ff844e', 'visible_crossing', '#87dbb0', '#f4c66a'], 'line-width': 3 } })
      map.addSource('bridge-points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'bridge-markers', type: 'circle', source: 'bridge-points', maxzoom: 16.5, paint: { 'circle-radius': 8, 'circle-color': ['match', ['get', 'status'], 'missing_span', '#ff844e', 'visible_crossing', '#87dbb0', '#f4c66a'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } })
      setReady(true)
    })
    map.on('error', () => onErrorRef.current('A satellite image could not load. Check the API connection, then retry.'))
    const selectBridge = (event: maplibregl.MapLayerMouseEvent) => {
      const bridgeId = event.features?.[0]?.properties?.bridge_id
      const bridge = catalog.bridges.find((item) => item.id === bridgeId)
      if (!bridge) return
      const properties = observationRef.current.bridges.features.find((feature) => feature.properties.bridge_id === bridgeId)?.properties
      onSelectRef.current(bridge.id)
      map.flyTo({ center: bridge.coordinate, zoom: BRIDGE_ZOOM, duration: 700, essential: true })
      popupRef.current?.remove()
      const content = document.createElement('div')
      content.className = 'routes-map-popup'
      const title = document.createElement('strong')
      title.textContent = bridge.name
      const date = document.createElement('p')
      date.textContent = observationRef.current.acquired_date
      const finding = document.createElement('p')
      finding.textContent = properties?.finding ?? 'No finding for this observation.'
      content.append(title, date, finding)
      popupRef.current = new maplibregl.Popup({ maxWidth: '280px', closeButton: true })
        .setLngLat(bridge.coordinate).setDOMContent(content).addTo(map)
    }
    for (const id of ['bridge-fill', 'bridge-markers']) {
      map.on('click', id, selectBridge)
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = '' })
    }
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [catalog, area, fitArea])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    popupRef.current?.remove()
    for (const layer of map.getStyle().layers ?? []) {
      if (layer.id.startsWith('satellite-')) map.removeLayer(layer.id)
    }
    for (const id of Object.keys(map.getStyle().sources)) {
      if (id.startsWith('satellite-')) map.removeSource(id)
    }
    const beforeLayer = catalog.flood_extent ? 'agency-flood-fill' : 'bridge-fill'
    if (observation.regional_tiles) {
      const tiles = observation.regional_tiles
      map.addSource('satellite-region', {
        type: 'raster', tiles: [assetUrl(tiles.url).replaceAll('%7B', '{').replaceAll('%7D', '}')], tileSize: tiles.tile_size,
        bounds: tiles.bounds, minzoom: tiles.minzoom, maxzoom: tiles.maxzoom,
      })
      map.addLayer({ id: 'satellite-region', type: 'raster', source: 'satellite-region', paint: { 'raster-fade-duration': 0 } }, beforeLayer)
    }
    for (const [index, image] of observation.images.entries()) {
      const id = `satellite-detail-${index}`
      map.addSource(id, { type: 'image', url: assetUrl(image.url), coordinates: image.image_coordinates })
      map.addLayer({ id, type: 'raster', source: id, minzoom: observation.regional_tiles ? 15 : 0, paint: { 'raster-fade-duration': 0, 'raster-resampling': 'nearest' } }, beforeLayer)
    }
    const source = map.getSource('bridges') as maplibregl.GeoJSONSource
    source.setData(observation.bridges)
    ;(map.getSource('bridge-points') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection', features: catalog.bridges.map((bridge) => ({
        type: 'Feature', geometry: { type: 'Point', coordinates: bridge.coordinate },
        properties: { bridge_id: bridge.id, status: observation.bridges.features.find((feature) => feature.properties.bridge_id === bridge.id)?.properties.status ?? 'uncertain' },
      })),
    })
    // Only sources change; the camera stays in the same place across dates.
  }, [ready, observation, catalog])

  useEffect(() => {
    const bridge = catalog.bridges.find((item) => item.id === focusRequest?.id)
    if (ready && mapRef.current && bridge) {
      popupRef.current?.remove()
      mapRef.current.flyTo({ center: bridge.coordinate, zoom: BRIDGE_ZOOM, duration: 700, essential: true })
    }
  }, [ready, focusRequest, catalog])

  useEffect(() => {
    if (!ready) return
    for (const id of ['agency-flood-fill', 'agency-flood-outline']) {
      if (mapRef.current?.getLayer(id)) mapRef.current.setLayoutProperty(id, 'visibility', showFloodExtent && observation.acquired_date >= '2021-07-18' ? 'visible' : 'none')
    }
  }, [ready, showFloodExtent, observation.acquired_date])

  useEffect(() => {
    if (ready) mapRef.current?.setPaintProperty('background', 'background-color', theme === 'dark' ? '#252b2d' : '#e6e7e4')
  }, [ready, theme])

  return <div className="routes-map-wrap">
    <div ref={container} className="routes-map" role="region" aria-label={lang === 'th' ? 'แผนที่ภาพดาวเทียม หุบเขา Ahr' : 'Ahr Valley satellite map'} />
    <button className="routes-reset" onClick={() => {
      popupRef.current?.remove()
      if (mapRef.current) fitArea(mapRef.current, 450)
    }}>{lang === 'th' ? 'ดูพื้นที่ทั้งหมด' : 'View whole area'}</button>
  </div>
}

export function RoutesImageryView() {
  const { ed, lang, theme } = useThemeLang()
  const [catalog, setCatalog] = useState<ImageryCatalog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [dateIndex, setDateIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<{ id: string; sequence: number } | null>(null)
  const [showFloodExtent, setShowFloodExtent] = useState(true)
  const focusBridge = (id: string) => {
    setSelectedId(id)
    setFocusRequest((previous) => ({ id, sequence: (previous?.sequence ?? 0) + 1 }))
  }
  const th = lang === 'th'
  const copy = (en: string, thai: string) => th ? thai : en
  const retry = () => {
    setCatalog(null)
    setError(null)
    setMapError(null)
    setAttempt((value) => value + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_ROOT}/cases/${CASE_ID}/imagery`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`)
        const data: ImageryCatalog = await response.json()
        if (!data.observations?.length || !data.observations.every((observation) => observation.images.length)) {
          throw new Error('No published satellite observations are available')
        }
        data.observations.sort((a, b) => a.acquired_date.localeCompare(b.acquired_date))
        setCatalog(data)
        setDateIndex(data.observations.length - 1)
        setSelectedId(data.bridges[0]?.id ?? null)
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Unable to load imagery')
      })
    return () => controller.abort()
  }, [attempt])

  const observation = catalog?.observations[dateIndex]
  const bridge = catalog?.bridges.find((item) => item.id === selectedId)
  const finding = observation?.bridges.features.find((feature) => feature.properties.bridge_id === selectedId)?.properties
  const status = finding?.status === 'missing_span' ? copy('Missing span', 'ช่วงสะพานขาด')
    : finding?.status === 'visible_crossing' ? copy('Crossing visible', 'เห็นสะพานเชื่อมต่อ') : copy('Unknown', 'ไม่ทราบ')
  const style = { '--routes-bg': ed.bg, '--routes-ink': ed.ink, '--routes-muted': theme === 'dark' ? '#b7b7b7' : '#555', '--routes-hair': ed.hair, '--routes-accent': ed.acc } as CSSProperties

  return <section className="routes-view" style={style} data-theme={theme} aria-label={copy('Bridge satellite evidence', 'หลักฐานภาพดาวเทียมของสะพาน')}>
    {!catalog || !observation ? <div className="routes-state" role={error ? 'alert' : 'status'}>
      <span className="routes-eyebrow">GERMANY · AHR VALLEY</span>
      <h1>{copy('Bridge satellite evidence', 'หลักฐานภาพดาวเทียมของสะพาน')}</h1>
      <p>{error ? copy('The imagery API is unavailable.', 'ไม่สามารถเชื่อมต่อ API ภาพดาวเทียมได้') : copy('Loading published satellite observations…', 'กำลังโหลดภาพดาวเทียม…')}</p>
      {error && <><p className="routes-muted">{error}. {copy('Start the FloodBeacon API with the shared DATABASE_URL.', 'เปิด FloodBeacon API โดยใช้ DATABASE_URL ที่ใช้ร่วมกัน')}</p><button className="routes-action" onClick={retry}>{copy('Retry connection', 'ลองเชื่อมต่ออีกครั้ง')}</button></>}
    </div> : <>
      <SatelliteMap key={attempt} catalog={catalog} observation={observation} onSelect={setSelectedId} onError={setMapError} focusRequest={focusRequest} showFloodExtent={showFloodExtent} />
      <aside className="routes-panel" aria-label={copy('Bridge findings', 'ผลการตรวจสอบสะพาน')}>
        <header>
          <span className="routes-eyebrow">GERMANY · JULY 2021</span>
          <h1>{copy('Explore the Ahr flood area', 'สำรวจพื้นที่น้ำท่วม Ahr')}</h1>
          <p className="routes-muted">{copy('Pan across the Ahr Valley study area, then zoom into Rech to inspect the bridge before and after the flood.', 'เลื่อนดูพื้นที่ศึกษาในหุบเขา Ahr แล้วซูมเข้าเมือง Rech เพื่อตรวจสอบสะพานก่อนและหลังน้ำท่วม')}</p>
        </header>
        <div className="routes-section">
          <span className="routes-eyebrow">{copy('01 / BRIDGE REVIEW', '01 / ตรวจสอบสะพาน')}</span>
          {catalog.bridges.map((item) => <button key={item.id} className={`routes-bridge-choice ${item.id === selectedId ? 'selected' : ''}`} onClick={() => focusBridge(item.id)}><span className="routes-square" />{item.name}</button>)}
          {bridge && <>
            <button className="routes-action routes-focus" onClick={() => focusBridge(bridge.id)}>{copy('Zoom to bridge ↗', 'ซูมไปที่สะพาน ↗')}</button>
            <div className="routes-status" data-status={finding?.status}><span className="routes-square" />{status}</div>
            <p className="routes-finding" aria-live="polite">{finding?.finding ?? copy('No finding for this date.', 'ไม่มีผลการตรวจสอบสำหรับวันนี้')}</p>
            <dl className="routes-facts">
              <div><dt>{copy('Observed', 'วันที่สังเกต')}</dt><dd>{observationDate(observation.acquired_date, lang)}</dd></div>
              <div><dt>{copy('Assessment', 'วิธีตรวจสอบ')}</dt><dd>{copy('Manual image review', 'ตรวจสอบภาพด้วยคน')}</dd></div>
              <div><dt>{copy('Failure time', 'เวลาที่เสียหาย')}</dt><dd>{bridge.failure_time ?? copy('Unknown', 'ไม่ทราบ')}</dd></div>
            </dl>
            <p className="routes-note">{copy('The square marks a review area. A visible deck does not establish that the road is safe to use.', 'กรอบสี่เหลี่ยมคือพื้นที่ตรวจสอบ การเห็นสะพานไม่ได้ยืนยันว่าถนนปลอดภัย')}</p>
          </>}
        </div>
        {bridge && <div className="routes-section">
          <span className="routes-eyebrow">{copy('02 / COMPARE OBSERVATIONS', '02 / เปรียบเทียบภาพ')}</span>
          <div className="routes-thumbnails">
            {catalog.observations.map((item, index) => <button key={item.id} onClick={() => setDateIndex(index)} aria-label={`${copy('Show', 'แสดง')} ${item.acquired_date}`}>
              <img src={assetUrl(item.images[0].url)} alt={`${bridge.name}, ${item.acquired_date}`} loading="lazy" />
              <span>{observationDate(item.acquired_date, lang)}</span>
            </button>)}
          </div>
          {bridge.comparison_url && <a className="routes-link" href={assetUrl(bridge.comparison_url)} target="_blank" rel="noreferrer">{copy('Open detailed before / after ↗', 'เปิดภาพเปรียบเทียบก่อน / หลัง ↗')}</a>}
        </div>}
        {bridge?.agency_evidence && <div className="routes-section">
          <span className="routes-eyebrow">{copy('03 / AGENCY EVIDENCE', '03 / หลักฐานจากหน่วยงาน')}</span>
          <p><strong>{bridge.agency_evidence.grade}</strong> · {bridge.agency_evidence.source}</p>
          {bridge.agency_evidence.observed_at && <p className="routes-note">{copy('Agency observation', 'วันที่สังเกตของหน่วยงาน')}: {observationDate(bridge.agency_evidence.observed_at.slice(0, 10), lang)}</p>}
          <p className="routes-note">{copy('Separate retrospective agency assessment. This is not output from a FloodBeacon detector.', 'ผลประเมินย้อนหลังจากหน่วยงาน ไม่ใช่ผลจากโมเดล FloodBeacon')}</p>
          {bridge.agency_evidence.source_url && <a className="routes-link" href={bridge.agency_evidence.source_url} target="_blank" rel="noreferrer">{copy('View agency source ↗', 'ดูแหล่งข้อมูลของหน่วยงาน ↗')}</a>}
        </div>}
        {catalog.flood_extent && <div className="routes-section">
          <label className="routes-layer-toggle"><input type="checkbox" checked={showFloodExtent} onChange={(event) => setShowFloodExtent(event.target.checked)} /><span>{copy('Agency flood extent', 'ขอบเขตน้ำท่วมจากหน่วยงาน')}</span></label>
          <p className="routes-note">{copy('Copernicus EMSR517 flooded areas and flood traces, assessed 18 July 2021. Retrospective agency evidence, displayed only on the post-flood date; not a FloodBeacon classification.', 'พื้นที่น้ำท่วมและร่องรอยน้ำท่วมจาก Copernicus EMSR517 วันที่ 18 กรกฎาคม 2021 เป็นหลักฐานย้อนหลังจากหน่วยงาน แสดงเฉพาะวันหลังน้ำท่วม ไม่ใช่ผลจำแนกจาก FloodBeacon')}</p>
        </div>}
        <details className="routes-section routes-limitations"><summary>{copy('Coverage & limitations', 'ขอบเขตและข้อจำกัด')}</summary><ul>{[...new Set([...(catalog.limitations ?? []), ...(bridge?.limitations ?? [])])].map((note) => <li key={note}>{note}</li>)}</ul></details>
      </aside>
      <div className="routes-map-caption"><span className="routes-square" />{copy('Ahr Valley · pan and zoom to explore', 'หุบเขา Ahr · เลื่อนและซูมเพื่อสำรวจ')}<small>{copy('Bridge marker: click to inspect · gaps: no observation', 'กดจุดสะพานเพื่อตรวจสอบ · ช่องว่างคือพื้นที่ไม่มีข้อมูล')}</small></div>
      {mapError && <div className="routes-map-error" role="alert">{mapError}<button className="routes-action" onClick={retry}>{copy('Retry', 'ลองอีกครั้ง')}</button></div>}
      <footer className="routes-timeline">
        <div><span className="routes-eyebrow">{copy('SATELLITE OBSERVATION DATE', 'วันที่ถ่ายภาพดาวเทียม')}</span><p>{copy('Change date while keeping your place on the map.', 'เปลี่ยนวันที่โดยคงตำแหน่งแผนที่เดิม')}</p></div>
        <div className="routes-date-buttons">{catalog.observations.map((item, index) => <button key={item.id} aria-pressed={index === dateIndex} onClick={() => setDateIndex(index)}><span>{item.label}</span><strong>{observationDate(item.acquired_date, lang)}</strong></button>)}</div>
        <div className="routes-attribution">{observation.regional_tiles && <span>{observation.regional_tiles.attribution} <a href={observation.regional_tiles.license_url} target="_blank" rel="noreferrer">{observation.regional_tiles.license}</a></span>}{catalog.flood_extent && <span>Flood extent © European Union, Copernicus Emergency Management Service, EMSR517 AOI15 · retrospective assessment</span>}{observation.images.map((image) => <span key={image.id}>{image.attribution} <a href={image.license_url} target="_blank" rel="noreferrer">{image.license}</a></span>)}</div>
      </footer>
    </>}
  </section>
}
