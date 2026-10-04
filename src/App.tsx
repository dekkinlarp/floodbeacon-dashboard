import { useEffect, useMemo, useRef, useState } from 'react'
import { CommandPalette } from './components/CommandPalette'
import { LayerToggle } from './components/LayerToggle'
import { MapLegend } from './components/MapLegend'
import { PhoneLayerToggle, PhoneSheet, PhoneTopBar } from './components/PhoneScreen'
import { SatelliteBar } from './components/SatelliteBar'
import { Sidebar } from './components/Sidebar'
import { TopNav, type NavKey } from './components/TopNav'
import { ViewControls } from './components/ViewControls'
import { ThemeLangProvider, useThemeLang } from './i18n/ThemeLangContext'
import { useIsPhone } from './lib/useIsPhone'
import { useJson } from './lib/useJson'
import { MapCanvas, type IncidentFeature, type MapCanvasHandle } from './map/MapCanvas'
import { BriefingPage } from './pages/BriefingPage'
import { LayersScenariosPage, type LonFlags, type ScenarioKey } from './pages/LayersScenariosPage'
import type { FloodEventMeta, IncidentProperties, Report, RouteProperties, TimeseriesFile } from './types/domain'

const SCN_DELTA: Record<ScenarioKey, number> = { cur: 0, p05: 0.15, p10: 0.3, m05: -0.15 }

function AppShell() {
  const { lang, ed } = useThemeLang()
  const isPhone = useIsPhone()

  const { data: incidentsFc } = useJson<GeoJSON.FeatureCollection>('/mock/incidents.geojson')
  const { data: routesFc } = useJson<GeoJSON.FeatureCollection>('/mock/routes.geojson')
  const { data: reports } = useJson<Report[]>('/mock/reports.json')
  const { data: timeseries } = useJson<TimeseriesFile>('/mock/timeseries.json')
  const { data: floodEvent } = useJson<FloodEventMeta>('/mock/flood-event.json')

  const incidentFeatures = useMemo<IncidentFeature[]>(
    () =>
      (incidentsFc?.features ?? []).map((f) => ({
        properties: f.properties as IncidentProperties,
        lngLat: (f.geometry as GeoJSON.Point).coordinates as [number, number],
      })),
    [incidentsFc],
  )
  const incidents = useMemo(() => incidentFeatures.map((f) => f.properties), [incidentFeatures])
  const routes = useMemo<RouteProperties[]>(() => (routesFc?.features ?? []).map((f) => f.properties as RouteProperties), [routesFc])

  const [side, setSide] = useState(true)
  const [nav, setNav] = useState<NavKey>('incidents')
  const [scn, setScn] = useState<ScenarioKey>('cur')
  const [paletteMode, setPaletteMode] = useState<'search' | 'explore' | null>(null)
  const [query, setQuery] = useState('')
  const [lon, setLon] = useState<LonFlags>({ ext: true, poss: true, roads: true, fac: true, pump: true, rep: true, bld: true })
  const [dateIndex, setDateIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>('hosp')
  const [layer, setLayer] = useState<'depth' | 'risk' | 'off'>('depth')
  const [view, setView] = useState<'3D' | '2D'>('3D')

  const mapHandleRef = useRef<MapCanvasHandle>(null)

  useEffect(() => {
    if (timeseries) setDateIndex(timeseries.series.length - 1)
  }, [timeseries])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const typing = /INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName ?? '')
      if (k === '[' && !typing) {
        setSide((s) => !s)
        return
      }
      if ((e.ctrlKey || e.metaKey) && (k === 'k' || k === 'e')) {
        e.preventDefault()
        const mode = k === 'k' ? 'search' : 'explore'
        setPaletteMode((m) => (m === mode ? null : mode))
        setQuery('')
        return
      }
      if (k === 'escape') {
        setPaletteMode(null)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || typing) return
      if (k === 'd') setLayer('depth')
      if (k === 'r') setLayer('risk')
      if (k === 'o') setLayer('off')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const series = timeseries?.series ?? []
  const current = series[dateIndex]
  const f = current ? current.flood_factor + SCN_DELTA[scn] : 1

  const dateLabels = useMemo(
    () =>
      series.map((p) =>
        new Date(p.acquired_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' }),
      ),
    [series, lang],
  )
  const stamp = current
    ? `${new Date(current.acquired_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}, ${new Date(
        current.acquired_at,
      ).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
    : ''
  const notLatest = series.length > 0 && dateIndex !== series.length - 1

  const handleSelectIncident = (id: string) => {
    setSelectedId(id)
    setNav('incidents')
  }

  const toggleLon = (key: keyof LonFlags) => setLon((s) => ({ ...s, [key]: !s[key] }))

  const district = lang === 'th' ? floodEvent?.district_th : floodEvent?.district
  const eventName = lang === 'th' ? floodEvent?.event_th : floodEvent?.event

  const sideW = side ? 380 : 0
  const sideL = side ? 392 : 12
  const isLayersPg = !isPhone && (nav === 'layers' || nav === 'scenarios')
  const isBrief = !isPhone && nav === 'briefings'
  const isMap = isPhone || nav === 'incidents' || nav === 'routes' || nav === 'reports'

  if (!incidentsFc || !routesFc || !reports || !timeseries || !floodEvent || !current) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <span className="font-mono text-sm text-neutral-400">Loading FloodBeacon…</span>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden" style={{ color: ed.ink, fontSize: 13 }}>
      <MapCanvas
        ref={mapHandleRef}
        view={view}
        layer={layer}
        showEstimate={true}
        lonRoads={lon.roads}
        lonBuildings={lon.bld}
        f={f}
        incidents={incidentFeatures}
        selectedId={selectedId}
        onSelectIncident={handleSelectIncident}
        sidebarOpen={!isPhone && side}
      />

      {!isPhone && (
        <TopNav
          nav={nav}
          onNavChange={setNav}
          onOpenSearch={() => {
            setPaletteMode('search')
            setQuery('')
          }}
          onOpenExplore={() => {
            setPaletteMode('explore')
            setQuery('')
          }}
          eventName={eventName ?? ''}
        />
      )}

      {isPhone && (
        <PhoneTopBar
          nav={nav}
          onNavChange={setNav}
          onOpenSearch={() => {
            setPaletteMode('search')
            setQuery('')
          }}
        />
      )}

      {isMap && !isPhone && (
        <>
          <Sidebar
            open={side}
            onToggle={() => setSide((s) => !s)}
            nav={nav}
            onNavChange={setNav}
            incidents={incidents}
            selectedId={selectedId}
            onSelectIncident={handleSelectIncident}
            routes={routes}
            reports={reports}
            stamp={stamp}
            notLatest={notLatest}
            peopleExposed={current.people_exposed}
            roadsImpassable={current.roads_impassable}
            sheltersAtRisk={current.shelters_at_risk}
          />
          <LayerToggle layer={layer} onChange={setLayer} left={sideL} />
          <ViewControls
            view={view}
            onViewChange={setView}
            onZoomIn={() => mapHandleRef.current?.zoomIn()}
            onZoomOut={() => mapHandleRef.current?.zoomOut()}
            onReset={() => {
              setView('3D')
              mapHandleRef.current?.resetView()
            }}
          />
          <MapLegend layer={layer} left={sideL} stamp={stamp} />
          <SatelliteBar left={sideW} series={series} dateIndex={dateIndex} onDateChange={setDateIndex} dateLabels={dateLabels} />
        </>
      )}

      {isPhone && (
        <>
          <PhoneLayerToggle layer={layer} onChange={setLayer} />
          <PhoneSheet stamp={stamp} incidents={incidents} selectedId={selectedId} onSelectIncident={handleSelectIncident} />
        </>
      )}

      {isLayersPg && (
        <LayersScenariosPage layer={layer} onLayerChange={setLayer} lon={lon} onToggleLon={toggleLon} scenario={scn} onScenarioChange={setScn} onNavChange={setNav} />
      )}

      {isBrief && (
        <BriefingPage
          district={district ?? ''}
          stamp={stamp}
          incidents={incidents}
          routes={routes}
          peopleExposed={current.people_exposed}
          roadsImpassable={current.roads_impassable}
          sheltersAtRisk={current.shelters_at_risk}
          onNavChange={setNav}
        />
      )}

      <CommandPalette
        mode={paletteMode}
        query={query}
        onQueryChange={setQuery}
        onClose={() => setPaletteMode(null)}
        incidents={incidents}
        onSelectIncident={handleSelectIncident}
        onNavChange={setNav}
        onSelectLayer={setLayer}
      />
    </div>
  )
}

export default function App() {
  return (
    <ThemeLangProvider>
      <AppShell />
    </ThemeLangProvider>
  )
}
