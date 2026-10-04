import { useEffect, useRef, useState, type CSSProperties } from 'react'
import * as maplibregl from 'maplibre-gl'
import { useThemeLang } from '../i18n/ThemeLangContext'
import { API_ROOT, assetUrl, observationDate, type ImageryCatalog, type Observation } from './imagery'
import './routes.css'

const CASE_ID = 'ahr-2021'
const BRIDGE_ZOOM = 17.2

function SatelliteMap({ catalog, observation, onSelect, onError }: {
  catalog: ImageryCatalog
  observation: Observation
  onSelect: (id: string) => void
  onError: (message: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const onSelectRef = useRef(onSelect)
  const onErrorRef = useRef(onError)
  const [ready, setReady] = useState(false)
  const { theme, lang } = useThemeLang()
  useEffect(() => {
    onSelectRef.current = onSelect
    onErrorRef.current = onError
  }, [onSelect, onError])

  useEffect(() => {
    if (!container.current) return
    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: container.current,
        style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#252b2d' } }] },
        center: catalog.bridges[0]?.coordinate ?? [(catalog.bounds[0] + catalog.bounds[2]) / 2, (catalog.bounds[1] + catalog.bounds[3]) / 2],
        zoom: BRIDGE_ZOOM,
        minZoom: 16,
        maxZoom: 21,
        maxBounds: [[catalog.bounds[0] - 0.002, catalog.bounds[1] - 0.002], [catalog.bounds[2] + 0.002, catalog.bounds[3] + 0.002]],
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
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      map.addSource('bridges', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'bridge-fill', type: 'fill', source: 'bridges', paint: { 'fill-color': ['match', ['get', 'status'], 'missing_span', '#ff844e', 'visible_crossing', '#87dbb0', '#f4c66a'], 'fill-opacity': 0.08 } })
      map.addLayer({ id: 'bridge-outline', type: 'line', source: 'bridges', paint: { 'line-color': ['match', ['get', 'status'], 'missing_span', '#ff844e', 'visible_crossing', '#87dbb0', '#f4c66a'], 'line-width': 3 } })
      setReady(true)
    })
    map.on('error', () => onErrorRef.current('A satellite image could not load. Check the API connection, then retry.'))
    map.on('click', 'bridge-fill', (event) => {
      const properties = event.features?.[0]?.properties
      if (!properties) return
      onSelectRef.current(properties.bridge_id)
      popupRef.current?.remove()
      const content = document.createElement('div')
      content.className = 'routes-map-popup'
      const title = document.createElement('strong')
      title.textContent = properties.name
      const date = document.createElement('p')
      date.textContent = properties.observed_date
      const finding = document.createElement('p')
      finding.textContent = properties.finding
      content.append(title, date, finding)
      popupRef.current = new maplibregl.Popup({ maxWidth: '280px', closeButton: true })
        .setLngLat(event.lngLat).setDOMContent(content).addTo(map)
    })
    map.on('mouseenter', 'bridge-fill', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'bridge-fill', () => { map.getCanvas().style.cursor = '' })
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(container.current)
    return () => {
      observer.disconnect()
      popupRef.current?.remove()
      map.remove()
      mapRef.current = null
    }
  }, [catalog])

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
    for (const [index, image] of observation.images.entries()) {
      const id = `satellite-${index}`
      map.addSource(id, { type: 'image', url: assetUrl(image.url), coordinates: image.image_coordinates })
      map.addLayer({ id, type: 'raster', source: id, paint: { 'raster-fade-duration': 0, 'raster-resampling': 'nearest' } }, 'bridge-fill')
    }
    const source = map.getSource('bridges') as maplibregl.GeoJSONSource
    source.setData(observation.bridges)
    // Only sources change; the camera stays in the same place across dates.
  }, [ready, observation])

  useEffect(() => {
    if (ready) mapRef.current?.setPaintProperty('background', 'background-color', theme === 'dark' ? '#252b2d' : '#e6e7e4')
  }, [ready, theme])

  return <div className="routes-map-wrap">
    <div ref={container} className="routes-map" role="region" aria-label={lang === 'th' ? 'แผนที่ภาพดาวเทียม เมือง Rech' : 'Rech satellite map'} />
    <button className="routes-reset" onClick={() => {
      popupRef.current?.remove()
      const coordinate = catalog.bridges[0]?.coordinate
      if (coordinate) mapRef.current?.easeTo({ center: coordinate, zoom: BRIDGE_ZOOM, bearing: 0, pitch: 0, duration: 300 })
    }}>{lang === 'th' ? 'กลับไปที่สะพาน' : 'Back to bridge'}</button>
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
      <SatelliteMap key={attempt} catalog={catalog} observation={observation} onSelect={setSelectedId} onError={setMapError} />
      <aside className="routes-panel" aria-label={copy('Bridge findings', 'ผลการตรวจสอบสะพาน')}>
        <header>
          <span className="routes-eyebrow">GERMANY · JULY 2021</span>
          <h1>{copy('A crossing lost to the flood', 'สะพานที่เสียหายจากน้ำท่วม')}</h1>
          <p className="routes-muted">{copy('Rech, Ahr Valley. Compare the same location before and after the flood.', 'เมือง Rech หุบเขา Ahr เปรียบเทียบจุดเดียวกันก่อนและหลังน้ำท่วม')}</p>
        </header>
        <div className="routes-section">
          <span className="routes-eyebrow">{copy('01 / BRIDGE REVIEW', '01 / ตรวจสอบสะพาน')}</span>
          {catalog.bridges.map((item) => <button key={item.id} className={`routes-bridge-choice ${item.id === selectedId ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}><span className="routes-square" />{item.name}</button>)}
          {bridge && <>
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
        <details className="routes-section routes-limitations"><summary>{copy('Coverage & limitations', 'ขอบเขตและข้อจำกัด')}</summary><ul>{[...new Set([...(catalog.limitations ?? []), ...(bridge?.limitations ?? [])])].map((note) => <li key={note}>{note}</li>)}</ul></details>
      </aside>
      <div className="routes-map-caption"><span className="routes-square" />{copy('Bridge review square · click for findings', 'กรอบตรวจสอบสะพาน · กดเพื่อดูผล')}<small>{copy('Outside imagery: no observation', 'นอกภาพ: ไม่มีข้อมูลสังเกต')}</small></div>
      {mapError && <div className="routes-map-error" role="alert">{mapError}<button className="routes-action" onClick={retry}>{copy('Retry', 'ลองอีกครั้ง')}</button></div>}
      <footer className="routes-timeline">
        <div><span className="routes-eyebrow">{copy('SATELLITE OBSERVATION DATE', 'วันที่ถ่ายภาพดาวเทียม')}</span><p>{copy('Change date to inspect the same crossing.', 'เปลี่ยนวันที่เพื่อดูสะพานจุดเดียวกัน')}</p></div>
        <div className="routes-date-buttons">{catalog.observations.map((item, index) => <button key={item.id} aria-pressed={index === dateIndex} onClick={() => setDateIndex(index)}><span>{item.label}</span><strong>{observationDate(item.acquired_date, lang)}</strong></button>)}</div>
        <div className="routes-attribution">{observation.images.map((image) => <span key={image.id}>{image.attribution} <a href={image.license_url} target="_blank" rel="noreferrer">{image.license}</a></span>)}</div>
      </footer>
    </>}
  </section>
}
