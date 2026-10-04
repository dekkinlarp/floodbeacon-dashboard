import { useState } from 'react'
import { useThemeLang } from '../i18n/ThemeLangContext'
import { SHAPES } from '../lib/palette'
import { STATUS_TO_KEY, type IncidentProperties, type RouteProperties } from '../types/domain'
import type { NavKey } from '../components/TopNav'
import { rowStyle } from '../components/styleHelpers'
import { PageFooter } from './LayersScenariosPage'

export function BriefingPage({
  district,
  stamp,
  incidents,
  routes,
  peopleExposed,
  roadsImpassable,
  sheltersAtRisk,
  onNavChange,
}: {
  district: string
  stamp: string
  incidents: IncidentProperties[]
  routes: RouteProperties[]
  peopleExposed: number
  roadsImpassable: number
  sheltersAtRisk: number
  onNavChange: (k: NavKey) => void
}) {
  const { ed: E, pal, n, t, lang } = useThemeLang()
  const [shared, setShared] = useState(false)
  const sorted = [...incidents].sort((a, b) => b.severity - a.severity)

  const share = () => {
    setShared(true)
    navigator.clipboard?.writeText(window.location.href).catch(() => {})
    setTimeout(() => setShared(false), 1800)
  }

  return (
    <div className="absolute inset-x-0 bottom-0 top-12 z-20 overflow-auto" style={{ background: E.bg }}>
      <div className="mx-auto max-w-[880px] pt-10">
        <div className="px-4 pb-2">
          <div
            className="mb-2.5 flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-wide"
            style={{ color: E.mute }}
          >
            <span>{n.briefKick}</span>
            <span>·</span>
            <span
              className="font-mono text-[10px] uppercase tracking-wide rounded px-1.5 py-px"
              style={{ border: `1px solid ${E.ink}`, color: E.ink }}
            >
              {n.observed}
            </span>
            <span>{stamp}</span>
          </div>
          <h1 className="m-0 text-[26px] font-semibold" style={{ letterSpacing: '-0.015em' }}>
            {district}
          </h1>
          <p className="mt-2 max-w-[560px] text-sm leading-[1.55]" style={{ color: E.mute }}>
            Flood response summary for the Sept 2026 central plain event.
          </p>
          <div className="flex gap-4">
            <button onClick={share} className="border-none bg-transparent p-0 text-[13px] hover:underline" style={{ color: E.acc, font: 'inherit', cursor: 'pointer' }}>
              {shared ? n.copied : n.share}
            </button>
            <button
              onClick={() => window.print?.()}
              className="border-none bg-transparent p-0 text-[13px] hover:underline"
              style={{ color: E.acc, font: 'inherit', cursor: 'pointer' }}
            >
              {n.print}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-8">
          <span className="font-mono text-[11px]" style={{ color: E.mute }}>
            01
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
              {n.sSituation}
            </div>
            <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
              {n.dSituation}
            </div>
          </div>
        </div>
        <div className="px-4">
          <p className="mb-3.5 max-w-[640px] text-sm leading-[1.65]" style={{ textWrap: 'pretty' }}>
            {t.s1} {t.s2}
          </p>
          <Stat label={n.people} value={peopleExposed.toLocaleString('en-US')} E={E} n={n} estimate />
          <Stat label={n.roads} value={roadsImpassable.toLocaleString('en-US')} E={E} />
          <Stat label={n.shelters} value={sheltersAtRisk.toLocaleString('en-US')} E={E} />
          <div style={{ borderTop: `1px solid ${E.hair}` }} />
        </div>

        <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-9">
          <span className="font-mono text-[11px]" style={{ color: E.mute }}>
            02
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
              {n.sIncidents}
            </div>
          </div>
        </div>
        {sorted.map((inc) => {
          const key = STATUS_TO_KEY[inc.status]
          return (
            <div key={inc.id} style={rowStyle(E, false)}>
              <svg width="12" height="12" viewBox="0 0 14 14" style={{ marginTop: 3 }}>
                <path d={SHAPES[key]} fill={pal.SC[key]} />
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{lang === 'th' ? inc.name_th ?? inc.name : inc.name}</div>
                <div style={{ fontSize: 12.5, color: E.mute, marginTop: 2 }}>{lang === 'th' ? inc.desc_th ?? inc.desc : inc.desc}</div>
              </div>
              <div className="flex flex-col items-end gap-[3px]">
                <span className="font-mono text-[10.5px] uppercase tracking-wide">{n.st[key]}</span>
                <span className="whitespace-nowrap font-mono text-[11px]" style={{ color: E.mute }}>
                  {lang === 'th' ? inc.meta_th ?? inc.meta : inc.meta}
                </span>
              </div>
            </div>
          )
        })}

        <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-9">
          <span className="font-mono text-[11px]" style={{ color: E.mute }}>
            03
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
              {n.sRoutes}
            </div>
          </div>
        </div>
        {routes.map((r, i) => {
          const key = STATUS_TO_KEY[r.status]
          return (
            <div key={i} style={rowStyle(E, false)}>
              <svg width="12" height="12" viewBox="0 0 14 14" style={{ marginTop: 3 }}>
                <path d={SHAPES[key]} fill={pal.SC[key]} />
              </svg>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{lang === 'th' ? r.name_th ?? r.name : r.name}</div>
                <div style={{ fontSize: 12.5, color: E.mute, marginTop: 2 }}>{lang === 'th' ? r.desc_th ?? r.desc : r.desc}</div>
              </div>
              <span className="whitespace-nowrap self-start font-mono text-[11px]" style={{ color: E.mute }}>
                {r.eta}
              </span>
            </div>
          )
        })}

        <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-9">
          <span className="font-mono text-[11px]" style={{ color: E.mute }}>
            04
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
              {n.sLim}
            </div>
            <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
              {n.dLim}
            </div>
          </div>
        </div>
        {n.limits.map((l, i) => (
          <div key={i} className="grid grid-cols-[28px_1fr] px-4 py-3" style={{ borderTop: `1px solid ${E.hair}` }}>
            <span />
            <div>
              <div className="text-[13.5px] font-medium">{l.name}</div>
              <div className="mt-0.5 text-[12.5px] leading-[1.5]" style={{ color: E.mute }}>
                {l.desc}
              </div>
            </div>
          </div>
        ))}

        <PageFooter onNavChange={onNavChange} />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  E,
  n,
  estimate,
}: {
  label: string
  value: string
  E: ReturnType<typeof useThemeLang>['ed']
  n?: ReturnType<typeof useThemeLang>['n']
  estimate?: boolean
}) {
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
