import { useThemeLang } from '../i18n/ThemeLangContext'
import { SHAPES, type StatusKey } from '../lib/palette'
import { STATUS_TO_KEY, type IncidentProperties, type Metric, type Report, type RouteProperties } from '../types/domain'
import type { NavKey } from './TopNav'
import { rowStyle } from './styleHelpers'

interface ListRow {
  key: string
  statusKey: StatusKey
  name: string
  desc: string
  meta: string
  onClick: () => void
  selected: boolean
}

function Row({ row }: { row: ListRow }) {
  const { ed: E, pal, n } = useThemeLang()
  return (
    <button onClick={row.onClick} style={rowStyle(E, row.selected)} className="hover:[background:var(--hov)]">
      <svg width="12" height="12" viewBox="0 0 14 14" style={{ marginTop: 3 }}>
        <path d={SHAPES[row.statusKey]} fill={pal.SC[row.statusKey]} />
      </svg>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: row.selected ? 600 : 500, lineHeight: 1.35 }}>{row.name}</div>
        <div style={{ fontSize: 12.5, color: E.mute, lineHeight: 1.45, marginTop: 2 }}>{row.desc}</div>
      </div>
      <div className="flex flex-col items-end gap-[3px]">
        <span className="font-mono text-[10.5px] uppercase tracking-wide">{n.st[row.statusKey]}</span>
        <span className="whitespace-nowrap font-mono text-[11px]" style={{ color: E.mute }}>
          {row.meta}
        </span>
      </div>
    </button>
  )
}

function SectionHeader({ num, title, desc }: { num: string; title: string; desc: string }) {
  const { ed: E } = useThemeLang()
  return (
    <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-5">
      <span className="font-mono text-[11px]" style={{ color: E.mute }}>
        {num}
      </span>
      <div>
        <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
          {title}
        </div>
        <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
          {desc}
        </div>
      </div>
    </div>
  )
}

function statRow(label: string, value: string, E: ReturnType<typeof useThemeLang>['ed'], estimate?: boolean, n?: ReturnType<typeof useThemeLang>['n']) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-2.5" style={{ borderTop: `1px solid ${E.hair}` }}>
      <span className="text-[13px]">{label}</span>
      <span className="flex items-center gap-2">
        {estimate && n && (
          <span
            className="font-mono text-[10px] uppercase tracking-wide whitespace-nowrap rounded px-1.5 py-px"
            style={{ color: E.mute, border: `1px dashed ${E.mute}` }}
          >
            {n.estimate}
          </span>
        )}
        <span className="font-mono text-[13px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
      </span>
    </div>
  )
}

export function Sidebar({
  open,
  onToggle,
  nav,
  onNavChange,
  incidents,
  selectedId,
  onSelectIncident,
  routes,
  reports,
  stamp,
  notLatest,
  peopleExposed,
  roadsImpassable,
  sheltersAtRisk,
}: {
  open: boolean
  onToggle: () => void
  nav: NavKey
  onNavChange: (k: NavKey) => void
  incidents: IncidentProperties[]
  selectedId: string | null
  onSelectIncident: (id: string) => void
  routes: RouteProperties[]
  reports: Report[]
  stamp: string
  notLatest: boolean
  peopleExposed: number
  roadsImpassable: number
  sheltersAtRisk: number
}) {
  const { ed: E, n, t, lang } = useThemeLang()
  const width = open ? 380 : 0
  const sideOnlyNav = nav === 'incidents' || nav === 'routes' || nav === 'reports'
  if (!sideOnlyNav) return null

  const sortedIncidents = [...incidents].sort((a, b) => b.severity - a.severity)
  const selected = incidents.find((i) => i.id === selectedId) ?? null

  const incRow = (inc: IncidentProperties): ListRow => ({
    key: inc.id,
    statusKey: STATUS_TO_KEY[inc.status],
    name: lang === 'th' ? inc.name_th ?? inc.name : inc.name,
    desc: lang === 'th' ? inc.desc_th ?? inc.desc : inc.desc,
    meta: lang === 'th' ? inc.meta_th ?? inc.meta : inc.meta,
    onClick: () => onSelectIncident(inc.id),
    selected: inc.id === selectedId,
  })

  const routeRow = (r: RouteProperties, i: number): ListRow => ({
    key: String(i),
    statusKey: STATUS_TO_KEY[r.status],
    name: lang === 'th' ? r.name_th ?? r.name : r.name,
    desc: lang === 'th' ? r.desc_th ?? r.desc : r.desc,
    meta: `${r.eta} · EST`,
    onClick: () => onNavChange('routes'),
    selected: false,
  })

  const reportRow = (r: Report, i: number): ListRow => ({
    key: String(i),
    statusKey: STATUS_TO_KEY[r.status],
    name: lang === 'th' ? r.title_th ?? r.title : r.title,
    desc: lang === 'th' ? r.summary_th ?? r.summary : r.summary,
    meta: `${r.time} ICT`,
    onClick: () => onNavChange('reports'),
    selected: false,
  })

  const metrics: Metric[] = selected ? (lang === 'th' ? selected.metrics_th ?? selected.metrics : selected.metrics) : []

  return (
    <>
      <div
        className="absolute bottom-0 left-0 top-12 z-10 overflow-auto transition-transform duration-200"
        style={{ width: 380, background: E.bg, borderRight: `1px solid ${E.hair}`, transform: `translateX(${open ? 0 : -381}px)` }}
      >
        {nav === 'incidents' && (
          <>
            <SectionHeader num="01" title={n.sSituation} desc={n.dSituation} />
            <div className="px-4 pb-2">
              <div className="mb-2.5 flex items-center gap-2 font-mono text-[11px]" style={{ color: E.mute }}>
                <span
                  className="font-mono text-[10px] uppercase tracking-wide rounded px-1.5 py-px"
                  style={{ border: `1px solid ${E.ink}`, color: E.ink }}
                >
                  {n.observed}
                </span>
                <span>{stamp}</span>
              </div>
              <p className="mb-3 text-[13.5px] leading-[1.6]" style={{ textWrap: 'pretty' }}>
                {t.s1} {t.s2}
              </p>
              {notLatest && (
                <p className="mb-3 text-[12.5px]" style={{ color: E.mute }}>
                  {t.olderNote}
                </p>
              )}
              {statRow(n.people, fmtNum(peopleExposed), E, true, n)}
              {statRow(n.roads, fmtNum(roadsImpassable), E)}
              {statRow(n.shelters, fmtNum(sheltersAtRisk), E)}
              <div style={{ borderTop: `1px solid ${E.hair}` }} />
            </div>

            <SectionHeader num="02" title={n.sIncidents} desc={n.dIncidents} />
            <div className="px-4 pb-1.5 font-mono text-[11px]" style={{ color: E.mute }}>
              {n.showing}
            </div>
            {sortedIncidents.map((inc) => (
              <Row key={inc.id} row={incRow(inc)} />
            ))}

            {selected && (
              <div className="p-4" style={{ borderTop: `1px solid ${E.hair}`, background: E.hov }}>
                <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide" style={{ color: E.mute }}>
                  {n.selected}
                </div>
                <div className="text-[15px] font-semibold">{lang === 'th' ? selected.name_th ?? selected.name : selected.name}</div>
                <p className="mb-2.5 mt-1.5 text-[13px] leading-[1.55]" style={{ color: E.mute, textWrap: 'pretty' }}>
                  {lang === 'th' ? selected.long_th ?? selected.long : selected.long}
                </p>
                {metrics.map((m, i) => (
                  <div key={i} className="flex justify-between gap-3 py-[7px] text-[12.5px]" style={{ borderTop: `1px solid ${E.hair}` }}>
                    <span>{m.k}</span>
                    <span className="font-mono text-xs">{m.v}</span>
                  </div>
                ))}
              </div>
            )}

            <SectionHeader num="03" title={n.sRoutes} desc={n.dRoutes} />
            {routes.slice(0, 2).map((r, i) => (
              <Row key={i} row={routeRow(r, i)} />
            ))}
            <div className="px-4 pb-8 pt-3" style={{ borderTop: `1px solid ${E.hair}` }}>
              <button
                onClick={() => onNavChange('routes')}
                className="border-none bg-transparent p-0 text-[13px] hover:underline"
                style={{ color: E.acc, font: 'inherit', cursor: 'pointer' }}
              >
                {n.allRoutes}
              </button>
            </div>
          </>
        )}

        {nav === 'routes' && (
          <>
            <SectionHeader num="03" title={n.sRoutes} desc={n.dRoutes} />
            <div className="px-4 pb-1.5 font-mono text-[11px]" style={{ color: E.mute }}>
              <span
                className="font-mono text-[10px] uppercase tracking-wide whitespace-nowrap rounded px-1.5 py-px"
                style={{ color: E.mute, border: `1px dashed ${E.mute}` }}
              >
                {n.estimate}
              </span>
            </div>
            {routes.map((r, i) => (
              <Row key={i} row={routeRow(r, i)} />
            ))}
            <div className="h-8" />
          </>
        )}

        {nav === 'reports' && (
          <>
            <SectionHeader num="04" title={n.sReports} desc={n.dReports} />
            {reports.map((r, i) => (
              <Row key={i} row={reportRow(r, i)} />
            ))}
            <div className="h-8" />
          </>
        )}
      </div>

      <button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="absolute top-[110px] z-[11] h-11 w-5 rounded-r transition-[left] duration-200"
        style={{ left: width, border: `1px solid ${E.hair}`, borderLeft: 'none', background: E.bg, color: E.mute, fontSize: 14, cursor: 'pointer' }}
      >
        {open ? '‹' : '›'}
      </button>
    </>
  )
}

function fmtNum(x: number): string {
  return x.toLocaleString('en-US')
}
