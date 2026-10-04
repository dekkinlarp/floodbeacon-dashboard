import { useThemeLang } from '../i18n/ThemeLangContext'
import type { IncidentProperties } from '../types/domain'
import type { NavKey } from './TopNav'

export interface PaletteItem {
  kind: string
  name: string
  onClick: () => void
}

export function CommandPalette({
  mode,
  query,
  onQueryChange,
  onClose,
  incidents,
  onSelectIncident,
  onNavChange,
  onSelectLayer,
}: {
  mode: 'search' | 'explore' | null
  query: string
  onQueryChange: (q: string) => void
  onClose: () => void
  incidents: IncidentProperties[]
  onSelectIncident: (id: string) => void
  onNavChange: (k: NavKey) => void
  onSelectLayer: (l: 'depth' | 'risk') => void
}) {
  const { ed: E, n, lang } = useThemeLang()
  if (!mode) return null

  let items: PaletteItem[] = []
  if (mode === 'search') {
    items = incidents.map((inc) => ({
      kind: n.kinds.inc,
      name: lang === 'th' ? inc.name_th ?? inc.name : inc.name,
      onClick: () => {
        onSelectIncident(inc.id)
        onNavChange('incidents')
        onClose()
      },
    }))
    items = items.concat(
      n.layers.map((l) => ({
        kind: n.kinds.lay,
        name: l.name,
        onClick: () => {
          onNavChange('layers')
          onClose()
        },
      })),
    )
  } else {
    items = n.layers.map((l) => ({
      kind: n.kinds.lay,
      name: l.name,
      onClick: () => {
        if (l.key === 'depth' || l.key === 'risk') {
          onSelectLayer(l.key)
          onNavChange('incidents')
        } else {
          onNavChange('layers')
        }
        onClose()
      },
    }))
    items = items.concat(
      n.scns.map((s) => ({
        kind: n.kinds.scn,
        name: s.name,
        onClick: () => {
          onNavChange('incidents')
          onClose()
        },
      })),
    )
  }
  const q = query.trim().toLowerCase()
  if (q) items = items.filter((i) => i.name.toLowerCase().includes(q))
  items = items.slice(0, 9)

  return (
    <div onClick={onClose} className="absolute inset-0 z-40" style={{ background: 'rgba(0,0,0,0.32)' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-1/2 top-24 w-[min(520px,92%)] -translate-x-1/2 overflow-hidden rounded"
        style={{ background: E.bg, border: `1px solid ${E.hair}` }}
      >
        <div className="flex h-12 items-center gap-2.5 px-4" style={{ borderBottom: `1px solid ${E.hair}` }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={n.ph}
            className="h-full flex-1 border-none bg-transparent text-sm outline-none"
            style={{ color: E.ink, font: 'inherit' }}
          />
          <kbd className="font-mono text-[10.5px] rounded px-1 py-px" style={{ border: `1px solid ${E.hair}`, color: E.mute }}>
            Esc
          </kbd>
        </div>
        <div className="max-h-[340px] overflow-auto">
          {items.map((i, idx) => (
            <button
              key={idx}
              onClick={i.onClick}
              className="grid w-full grid-cols-[84px_1fr] gap-2 px-4 py-2.5 text-left text-[13.5px]"
              style={{ border: 'none', background: 'transparent', color: E.ink, font: 'inherit', cursor: 'pointer' }}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-wide pt-px" style={{ color: E.mute }}>
                {i.kind}
              </span>
              <span>{i.name}</span>
            </button>
          ))}
          {items.length === 0 && (
            <div className="p-4" style={{ color: E.mute }}>
              {n.noResult}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
