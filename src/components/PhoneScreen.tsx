import { useThemeLang } from '../i18n/ThemeLangContext'
import { SHAPES } from '../lib/palette'
import { STATUS_TO_KEY, type IncidentProperties } from '../types/domain'
import type { NavKey } from './TopNav'
import { rowStyle, seg } from './styleHelpers'

export function PhoneTopBar({
  nav,
  onNavChange,
  onOpenSearch,
}: {
  nav: NavKey
  onNavChange: (k: NavKey) => void
  onOpenSearch: () => void
}) {
  const { ed: E, n } = useThemeLang()
  const navKeys = Object.keys(n.nav) as NavKey[]
  return (
    <div className="absolute inset-x-0 top-0 z-30" style={{ background: E.bg, borderBottom: `1px solid ${E.hair}` }}>
      <div className="flex h-11 items-center gap-2 px-3.5">
        <span className="h-[9px] w-[9px] rounded-full" style={{ border: `1.5px solid ${E.ink}` }} />
        <span className="flex-1 text-sm font-semibold">FloodBeacon</span>
        <button onClick={onOpenSearch} className="flex items-center gap-1.5 border-none bg-transparent text-[13px]" style={{ color: E.mute, font: 'inherit' }}>
          {n.search}
        </button>
      </div>
      <div className="flex h-10 gap-4.5 overflow-x-auto px-3.5">
        {navKeys.map((key) => {
          const on = nav === key
          return (
            <button
              key={key}
              onClick={() => onNavChange(key)}
              className="flex items-center gap-1.5 whitespace-nowrap"
              style={{ border: 'none', background: 'transparent', color: on ? E.ink : E.mute, fontWeight: on ? 600 : 400, fontSize: 13, cursor: 'pointer', font: 'inherit' }}
            >
              {n.nav[key]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PhoneLayerToggle({ layer, onChange }: { layer: 'depth' | 'risk' | 'off'; onChange: (l: 'depth' | 'risk' | 'off') => void }) {
  const { ed: E, n } = useThemeLang()
  return (
    <div className="absolute bottom-[340px] left-3 z-10 flex gap-0.5 rounded p-[3px]" style={{ background: E.bg, border: `1px solid ${E.hair}` }}>
      <button onClick={() => onChange('depth')} style={seg(E, layer === 'depth')}>
        {n.lDepth}
      </button>
      <button onClick={() => onChange('risk')} style={seg(E, layer === 'risk')}>
        {n.lRisk}
      </button>
      <button onClick={() => onChange('off')} style={seg(E, layer === 'off')}>
        {n.lOff}
      </button>
    </div>
  )
}

export function PhoneSheet({
  stamp,
  incidents,
  selectedId,
  onSelectIncident,
}: {
  stamp: string
  incidents: IncidentProperties[]
  selectedId: string | null
  onSelectIncident: (id: string) => void
}) {
  const { ed: E, pal, n, lang } = useThemeLang()
  const sorted = [...incidents].sort((a, b) => b.severity - a.severity)
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 h-[324px] overflow-auto" style={{ background: E.bg, borderTop: `1px solid ${E.hair}` }}>
      <div className="flex justify-center pt-2">
        <span className="h-[3px] w-8 rounded-full" style={{ background: E.hair }} />
      </div>
      <div className="flex items-center gap-2 px-4 pt-2.5 font-mono text-[11px]" style={{ color: E.mute }}>
        <span className="font-mono text-[10px] uppercase tracking-wide rounded px-1.5 py-px" style={{ border: `1px solid ${E.ink}`, color: E.ink }}>
          {n.observed}
        </span>
        <span>{stamp}</span>
      </div>
      <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2 pt-2.5">
        <span className="font-mono text-[11px]" style={{ color: E.mute }}>
          02
        </span>
        <div>
          <div className="text-[15px] font-semibold">{n.sIncidents}</div>
          <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
            {n.dIncidents}
          </div>
        </div>
      </div>
      {sorted.map((inc) => {
        const key = STATUS_TO_KEY[inc.status]
        const on = inc.id === selectedId
        return (
          <button key={inc.id} onClick={() => onSelectIncident(inc.id)} style={rowStyle(E, on)}>
            <svg width="12" height="12" viewBox="0 0 14 14" style={{ marginTop: 3 }}>
              <path d={SHAPES[key]} fill={pal.SC[key]} />
            </svg>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: on ? 600 : 500 }}>{lang === 'th' ? inc.name_th ?? inc.name : inc.name}</div>
              <div style={{ fontSize: 12.5, color: E.mute, marginTop: 2 }}>{lang === 'th' ? inc.desc_th ?? inc.desc : inc.desc}</div>
            </div>
            <div className="flex flex-col items-end gap-[3px]">
              <span className="font-mono text-[10.5px] uppercase tracking-wide">{n.st[key]}</span>
              <span className="whitespace-nowrap font-mono text-[11px]" style={{ color: E.mute }}>
                {lang === 'th' ? inc.meta_th ?? inc.meta : inc.meta}
              </span>
            </div>
          </button>
        )
      })}
      <div className="px-4 pb-6 pt-3 font-mono text-[11px]" style={{ borderTop: `1px solid ${E.hair}`, color: E.mute }}>
        {n.revisit}
      </div>
    </div>
  )
}
