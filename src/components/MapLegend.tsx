import { useThemeLang } from '../i18n/ThemeLangContext'
import { DL, DR, DS, RR, RS } from '../lib/geometry'
import { MONO } from './styleHelpers'

export function MapLegend({ layer, left, stamp }: { layer: 'depth' | 'risk' | 'off'; left: number; stamp: string }) {
  const { ed: E, n } = useThemeLang()
  if (layer === 'off') return null
  const isDepth = layer === 'depth'
  const cells = isDepth ? DR : RR
  const strokes = isDepth ? DS : RS
  const labels = isDepth ? DL : n.riskCls
  const title = isDepth ? n.depthTitle : n.riskTitle
  const unit = isDepth ? n.depthUnit : n.riskUnit
  const source = (isDepth ? n.depthSrc : n.riskSrc).replace('{d}', stamp)

  return (
    <div
      className="absolute z-10 flex flex-col gap-2.5 rounded p-3 transition-[left] duration-200"
      style={{ left, bottom: 68, width: 480, background: E.bg, border: `1px solid ${E.hair}` }}
    >
      <div className="flex items-baseline gap-2.5">
        <span className="text-[13px] font-semibold" style={{ color: E.ink }}>
          {title}
        </span>
        <span className="flex-1 font-mono text-[11px]" style={{ color: E.mute, fontFamily: MONO }}>
          {unit}
        </span>
        <span
          className="font-mono text-[10px] uppercase tracking-wide whitespace-nowrap rounded px-1.5 py-px"
          style={{ color: E.mute, border: `1px dashed ${E.mute}`, fontFamily: MONO }}
        >
          {n.estimate}
        </span>
      </div>
      <div className="flex">
        {cells.map((c, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col gap-1">
            <div style={{ height: 10, background: c, boxShadow: `inset 0 0 0 0.5px ${strokes[i]}` }} />
            <div className="whitespace-nowrap font-mono text-[11px]" style={{ color: E.ink, fontFamily: MONO }}>
              {labels[i]}
            </div>
          </div>
        ))}
      </div>
      <div
        className="flex items-center gap-2 pt-2 font-mono text-[11px]"
        style={{ borderTop: `1px solid ${E.hair}`, color: E.mute, fontFamily: MONO }}
      >
        {isDepth && (
          <>
            <div
              className="h-2.5 w-5 flex-none rounded"
              style={{
                border: '1.5px dashed rgba(25,110,160,0.85)',
                background: 'repeating-linear-gradient(45deg, rgba(25,110,160,0.45) 0 3px, rgba(56,189,220,0.12) 3px 8px)',
              }}
            />
            <span className="whitespace-nowrap">{n.hatchNote}</span>
            <span>·</span>
          </>
        )}
        <span>{source}</span>
      </div>
    </div>
  )
}
