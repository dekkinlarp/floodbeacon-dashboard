import { useThemeLang } from '../i18n/ThemeLangContext'
import { sm } from './styleHelpers'

export type NavKey = 'incidents' | 'routes' | 'reports' | 'layers' | 'scenarios' | 'briefings' | 'response'

export function TopNav({
  nav,
  onNavChange,
  onOpenSearch,
  onOpenExplore,
  eventName,
}: {
  nav: NavKey
  onNavChange: (k: NavKey) => void
  onOpenSearch: () => void
  onOpenExplore: () => void
  eventName: string
}) {
  const { ed: E, n, lang, theme, setLang, setTheme } = useThemeLang()
  const navKeys = Object.keys(n.nav) as NavKey[]

  return (
    <div
      className="absolute inset-x-0 top-0 z-30 flex h-12 items-center gap-3 px-3"
      style={{ background: E.bg, borderBottom: `1px solid ${E.hair}` }}
    >
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
        <span className="h-[9px] w-[9px] rounded-full" style={{ border: `1.5px solid ${E.ink}` }} />
        <span className="text-sm font-semibold" style={{ color: E.ink }}>
          FloodBeacon
        </span>
        <span className="text-base font-light" style={{ color: E.mute }}>
          /
        </span>
        <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[12px]" style={{ color: E.mute }} title={eventName}>
          {eventName}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 items-stretch gap-3 overflow-x-auto access-nav-scroll">
        {navKeys.map((key, i) => {
          const on = nav === key
          return (
            <button
              key={key}
              onClick={() => onNavChange(key)}
              className="flex h-12 shrink-0 items-center gap-1.5 whitespace-nowrap pt-0.5"
              style={{
                border: 'none',
                borderBottom: `2px solid ${on ? E.acc : 'transparent'}`,
                background: 'transparent',
                color: on ? E.ink : E.mute,
                fontWeight: on ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'color 160ms, border-color 160ms',
                fontFamily: 'inherit',
              }}
            >
              {n.nav[key]}
              <span
                className="font-mono text-[10.5px] leading-4 h-4 rounded-full px-1.5"
                style={{ border: `1px solid ${E.hair}`, color: E.mute, fontWeight: 400 }}
              >
                {key === 'response' ? 3 : key === 'routes' ? 1 : n.navCounts[i]}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={onOpenSearch}
        className="flex shrink-0 items-center gap-1 border-none bg-transparent text-[12px] whitespace-nowrap"
        style={{ color: E.mute, cursor: 'pointer', padding: 0, font: 'inherit' }}
      >
        {n.search}
        <kbd className="font-mono text-[10.5px] rounded px-1 py-px" style={{ border: `1px solid ${E.hair}`, color: E.mute }}>
          Ctrl K
        </kbd>
      </button>
      <button
        onClick={onOpenExplore}
        className="flex shrink-0 items-center gap-1 border-none bg-transparent text-[12px] whitespace-nowrap"
        style={{ color: E.mute, cursor: 'pointer', padding: 0, font: 'inherit' }}
      >
        {n.explore}
        <kbd className="font-mono text-[10.5px] rounded px-1 py-px" style={{ border: `1px solid ${E.hair}`, color: E.mute }}>
          Ctrl E
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <button onClick={() => setLang('en')} style={sm(E, lang === 'en')}>
          EN
        </button>
        <button onClick={() => setLang('th')} style={sm(E, lang === 'th')}>
          ไทย
        </button>
        <span className="h-3.5 w-px" style={{ background: E.hair }} />
        <button onClick={() => setTheme('dark')} style={sm(E, theme === 'dark')}>
          {lang === 'th' ? 'มืด' : 'Dark'}
        </button>
        <button onClick={() => setTheme('light')} style={sm(E, theme === 'light')}>
          {lang === 'th' ? 'สว่าง' : 'Light'}
        </button>
      </div>
    </div>
  )
}
