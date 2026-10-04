import type { CSSProperties } from 'react'
import type { EditorialPalette } from '../lib/palette'

export const MONO = "'Geist Mono', ui-monospace, Menlo, monospace"

export function rowStyle(E: EditorialPalette, on: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: '14px minmax(0,1fr) auto',
    gap: 12,
    alignItems: 'start',
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 16px',
    border: 'none',
    borderTop: `1px solid ${E.hair}`,
    background: on ? E.hov : 'transparent',
    color: E.ink,
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 160ms',
    font: 'inherit',
  }
}

export function tagStyle(E: EditorialPalette, kind: 'o' | 'e' | 'u'): CSSProperties {
  return {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '1px 5px',
    borderRadius: 2,
    whiteSpace: 'nowrap',
    color: kind === 'o' ? E.ink : E.mute,
    border: kind === 'o' ? `1px solid ${E.ink}` : `1px dashed ${E.mute}`,
  }
}

export function seg(E: EditorialPalette, on: boolean): CSSProperties {
  return {
    height: 28,
    padding: '0 10px',
    border: 'none',
    borderRadius: 2,
    cursor: 'pointer',
    background: on ? E.hov : 'transparent',
    color: on ? E.ink : E.mute,
    fontSize: 12.5,
    fontWeight: on ? 600 : 400,
    font: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }
}

export function sq(E: EditorialPalette, on: boolean): CSSProperties {
  return {
    width: 30,
    height: 30,
    border: `1px solid ${E.hair}`,
    borderRadius: 3,
    background: on ? E.hov : E.bg,
    color: on ? E.ink : E.mute,
    fontSize: 13,
    fontWeight: on ? 600 : 400,
    cursor: 'pointer',
    font: 'inherit',
  }
}

export function sm(E: EditorialPalette, on: boolean): CSSProperties {
  return {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12.5,
    padding: 0,
    color: on ? E.ink : E.mute,
    fontWeight: on ? 600 : 400,
    textDecorationLine: on ? 'underline' : 'none',
    textUnderlineOffset: 5,
    textDecorationColor: E.acc,
  }
}

export function fmt(x: number): string {
  return x.toLocaleString('en-US')
}
