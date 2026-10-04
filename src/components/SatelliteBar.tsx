import { useThemeLang } from '../i18n/ThemeLangContext'
import type { TimeseriesPoint } from '../types/domain'
import { MONO } from './styleHelpers'

export function SatelliteBar({
  left,
  series,
  dateIndex,
  onDateChange,
  dateLabels,
}: {
  left: number
  series: TimeseriesPoint[]
  dateIndex: number
  onDateChange: (i: number) => void
  dateLabels: string[]
}) {
  const { ed: E, n } = useThemeLang()
  const current = series[dateIndex]
  const prev = dateIndex > 0 ? series[dateIndex - 1] : null
  const delta = prev ? current.flooded_area_km2 - prev.flooded_area_km2 : 0

  return (
    <div
      className="absolute bottom-0 right-0 z-10 flex h-14 items-center gap-4 px-4 font-mono text-[11.5px] transition-[left] duration-200"
      style={{ left, background: E.bg, borderTop: `1px solid ${E.hair}`, fontFamily: MONO }}
    >
      <span
        className="font-mono text-[10px] uppercase tracking-wide rounded px-1.5 py-px"
        style={{ border: `1px solid ${E.ink}`, color: E.ink, fontFamily: MONO }}
      >
        {n.observed}
      </span>
      <div className="flex gap-0.5">
        {dateLabels.map((label, i) => {
          const on = i === dateIndex
          return (
            <button
              key={label}
              onClick={() => onDateChange(i)}
              className="h-[26px] whitespace-nowrap rounded px-2"
              style={{
                border: 'none',
                background: on ? E.hov : 'transparent',
                color: on ? E.ink : E.mute,
                fontFamily: MONO,
                fontSize: 11.5,
                fontWeight: on ? 600 : 400,
                cursor: 'pointer',
                textDecorationLine: on ? 'underline' : 'none',
                textUnderlineOffset: 5,
                textDecorationColor: E.acc,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{current.flooded_area_km2.toFixed(1)} km²</span>
      <span style={{ color: E.mute }}>
        {prev
          ? `${delta < 0 ? '−' : '+'}${Math.abs(delta).toFixed(1)} km² since ${dateLabels[dateIndex - 1]}`
          : 'First pass of this event'}
      </span>
      <div className="flex-1" />
      <span style={{ color: E.mute }}>{n.revisit}</span>
    </div>
  )
}
