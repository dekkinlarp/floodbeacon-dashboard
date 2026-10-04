import { useThemeLang } from '../i18n/ThemeLangContext'
import { sq } from './styleHelpers'

export function ViewControls({
  view,
  onViewChange,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  view: '3D' | '2D'
  onViewChange: (v: '3D' | '2D') => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  const { ed: E } = useThemeLang()
  return (
    <div className="absolute right-3 top-[60px] z-10 flex gap-1.5">
      <div className="flex">
        <button onClick={() => onViewChange('3D')} style={sq(E, view === '3D')}>
          3D
        </button>
        <button onClick={() => onViewChange('2D')} style={sq(E, view === '2D')}>
          2D
        </button>
      </div>
      <div className="flex">
        <button onClick={onZoomOut} aria-label="Zoom out" style={sq(E, false)}>
          −
        </button>
        <button onClick={onZoomIn} aria-label="Zoom in" style={sq(E, false)}>
          +
        </button>
      </div>
      <button onClick={onReset} aria-label="Reset view" style={sq(E, false)}>
        N
      </button>
    </div>
  )
}
