import { useThemeLang } from '../i18n/ThemeLangContext'
import type { NavKey } from '../components/TopNav'
import { rowStyle, tagStyle } from '../components/styleHelpers'

export type LonFlags = { ext: boolean; poss: boolean; roads: boolean; fac: boolean; pump: boolean; rep: boolean; bld: boolean }
export type ScenarioKey = 'cur' | 'p05' | 'p10' | 'm05'

export function LayersScenariosPage({
  layer,
  onLayerChange,
  lon,
  onToggleLon,
  scenario,
  onScenarioChange,
  onNavChange,
}: {
  layer: 'depth' | 'risk' | 'off'
  onLayerChange: (l: 'depth' | 'risk' | 'off') => void
  lon: LonFlags
  onToggleLon: (key: keyof LonFlags) => void
  scenario: ScenarioKey
  onScenarioChange: (s: ScenarioKey) => void
  onNavChange: (k: NavKey) => void
}) {
  const { ed: E, n } = useThemeLang()

  return (
    <div className="absolute inset-x-0 bottom-0 top-12 z-20 overflow-auto" style={{ background: E.bg }}>
      <div className="mx-auto max-w-[880px] pt-10">
        <div className="px-4 pb-2">
          <h1 className="m-0 text-[26px] font-semibold" style={{ letterSpacing: '-0.015em' }}>
            {n.pageLayers}
          </h1>
          <p className="mt-2 max-w-[560px] text-sm leading-[1.55]" style={{ color: E.mute }}>
            {n.pageLayersP}
          </p>
        </div>

        <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-7">
          <span className="font-mono text-[11px]" style={{ color: E.mute }}>
            01
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
              {n.sLayers}
            </div>
            <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
              {n.dLayers}
            </div>
          </div>
        </div>
        {n.layers.map((l) => {
          const isRamp = l.key === 'depth' || l.key === 'risk'
          const on = isRamp ? layer === l.key : lon[l.key as keyof LonFlags]
          return (
            <button
              key={l.key}
              onClick={() => (isRamp ? onLayerChange(l.key as 'depth' | 'risk') : onToggleLon(l.key as keyof LonFlags))}
              style={rowStyle(E, false)}
            >
              <span />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium">{l.name}</span>
                  <span style={tagStyle(E, l.tagKind)}>{l.tagKind === 'o' ? n.observed : l.tagKind === 'e' ? n.estimate : n.unverified}</span>
                </div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
                  {l.desc}
                </div>
              </div>
              <span className="font-mono text-[11px] tracking-wide" style={{ color: on ? E.acc : E.mute, fontWeight: on ? 600 : 400 }}>
                {on ? n.on : n.off}
              </span>
            </button>
          )
        })}

        <div className="grid grid-cols-[28px_1fr] items-baseline gap-x-1.5 px-4 pb-2.5 pt-9">
          <span className="font-mono text-[11px]" style={{ color: E.mute }}>
            02
          </span>
          <div>
            <div className="text-[15px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
              {n.sScn}
            </div>
            <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
              {n.dScn}
            </div>
          </div>
        </div>
        {n.scns.map((s) => {
          const on = scenario === s.key
          return (
            <button key={s.key} onClick={() => onScenarioChange(s.key)} style={rowStyle(E, on)}>
              <span style={{ color: on ? E.acc : E.mute, fontSize: 12, lineHeight: '18px' }}>{on ? '●' : '○'}</span>
              <div>
                <div className="text-[13.5px] font-medium">{s.name}</div>
                <div className="mt-0.5 text-[12.5px]" style={{ color: E.mute }}>
                  {s.desc}
                </div>
              </div>
              <span className="font-mono text-[11px] tracking-wide" style={{ color: E.acc }}>
                {on ? n.chosen : ''}
              </span>
            </button>
          )
        })}

        <PageFooter onNavChange={onNavChange} />
      </div>
    </div>
  )
}

export function PageFooter({ onNavChange }: { onNavChange: (k: NavKey) => void }) {
  const { ed: E, n } = useThemeLang()
  const navKeys = Object.keys(n.nav) as NavKey[]
  return (
    <div className="mt-14 flex flex-col gap-7 px-4 pb-10 pt-7" style={{ borderTop: `1px solid ${E.hair}` }}>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: E.mute }}>
            {n.navigate}
          </div>
          {navKeys.map((k) => (
            <button
              key={k}
              onClick={() => onNavChange(k)}
              className="self-start border-none bg-transparent p-0 text-[13px] hover:underline"
              style={{ color: E.ink, font: 'inherit', cursor: 'pointer' }}
            >
              {n.nav[k]}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: E.mute }}>
            {n.contact}
          </div>
          <a href="#" className="text-[13px] no-underline hover:underline" style={{ color: E.ink }}>
            {n.team}
          </a>
          <a href="#" className="text-[13px] no-underline hover:underline" style={{ color: E.ink }}>
            {n.repo}
          </a>
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-4 text-xs" style={{ color: E.mute }}>
        <div className="flex gap-4">
          <a href="#" style={{ color: E.mute }}>
            {n.meth}
          </a>
          <a href="#" style={{ color: E.mute }}>
            {n.data}
          </a>
          <a href="#" style={{ color: E.mute }}>
            {n.lim}
          </a>
        </div>
        <div>{n.credit}</div>
      </div>
    </div>
  )
}
