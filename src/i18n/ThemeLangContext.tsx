import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ED, PAL, type Theme } from '../lib/palette'
import { SITUATION, STRINGS, type Lang, type SituationCopy, type Strings } from './strings'

interface ThemeLangValue {
  theme: Theme
  lang: Lang
  setTheme: (t: Theme) => void
  setLang: (l: Lang) => void
  pal: (typeof PAL)[Theme]
  ed: (typeof ED)[Theme]
  n: Strings
  t: SituationCopy
}

const ThemeLangContext = createContext<ThemeLangValue | null>(null)

export function ThemeLangProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [lang, setLang] = useState<Lang>('en')

  const value = useMemo<ThemeLangValue>(
    () => ({ theme, lang, setTheme, setLang, pal: PAL[theme], ed: ED[theme], n: STRINGS[lang], t: SITUATION[lang] }),
    [theme, lang],
  )

  return <ThemeLangContext.Provider value={value}>{children}</ThemeLangContext.Provider>
}

export function useThemeLang(): ThemeLangValue {
  const ctx = useContext(ThemeLangContext)
  if (!ctx) throw new Error('useThemeLang must be used inside ThemeLangProvider')
  return ctx
}
