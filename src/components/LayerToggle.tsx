import { useThemeLang } from '../i18n/ThemeLangContext'
import { MONO, seg } from './styleHelpers'

export function LayerToggle({
  layer,
  onChange,
  left,
}: {
  layer: 'depth' | 'risk' | 'off'
  onChange: (l: 'depth' | 'risk' | 'off') => void
  left: number
}) {
  const { ed: E, n } = useThemeLang()
  const kbd = (k: string) => (
    <kbd className="font-mono text-[10px] rounded px-1" style={{ color: E.mute, border: `1px solid ${E.hair}`, fontFamily: MONO }}>
      {k}
    </kbd>
  )
  return (
    <div
      className="absolute top-[60px] z-10 flex gap-0.5 rounded p-[3px] transition-[left] duration-200"
      style={{ left, background: E.bg, border: `1px solid ${E.hair}` }}
    >
      <button onClick={() => onChange('depth')} style={seg(E, layer === 'depth')} className="flex items-center gap-1.5">
        {n.lDepth}
        {kbd('D')}
      </button>
      <button onClick={() => onChange('risk')} style={seg(E, layer === 'risk')} className="flex items-center gap-1.5">
        {n.lRisk}
        {kbd('R')}
      </button>
      <button onClick={() => onChange('off')} style={seg(E, layer === 'off')} className="flex items-center gap-1.5">
        {n.lOff}
        {kbd('O')}
      </button>
    </div>
  )
}
