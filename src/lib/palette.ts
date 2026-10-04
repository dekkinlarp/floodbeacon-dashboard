// Color tokens and status shapes, ported from the FloodBeacon Editorial design.

export type Theme = 'dark' | 'light'
export type StatusKey = 'cut' | 'inund' | 'risk' | 'clear'

export const SHAPES: Record<StatusKey, string> = {
  cut: 'M2 2 H12 V12 H2 Z',
  inund: 'M7 0.8 L13.2 7 L7 13.2 L0.8 7 Z',
  risk: 'M7 1.2 L13 12.4 H1 Z',
  clear: 'M7 1.5 A5.5 5.5 0 1 0 7.001 1.5 Z',
}

interface ThemePalette {
  vars: Record<string, string>
  ink: string
  inkOn: string
  mute: string
  mute2: string
  dash: string
  pill: string
  segOn: string
  sel: string
  selLine: string
  ring: string
  fc: [string, string, string]
  hw: string
  hwLine: string
  rd: string
  SC: Record<StatusKey, string>
  CHIP: Record<StatusKey, [string, string]>
  TINT: Record<StatusKey, [string, string, string]>
  FULL: Record<Exclude<StatusKey, 'clear'>, [string, string, string]>
}

export const PAL: Record<Theme, ThemePalette> = {
  light: {
    vars: {
      ink: '#1C1C1E', inkOn: '#FFFFFF', panel: 'rgba(255,255,255,0.72)', card: 'rgba(255,255,255,0.6)',
      mute: '#48484D', dash: '#6B6B70', land: '#ECE9E0', district: '#F2F0EA', hill: '#EAE6DB',
      river: '#86B6DA', obsFill: 'rgba(56,189,220,0.40)', obsStroke: 'rgba(20,120,160,0.55)',
      deepFill: 'rgba(25,80,170,0.40)',
    },
    ink: '#1C1C1E', inkOn: '#FFFFFF', mute: '#48484D', mute2: '#3A3A3F', dash: '#6B6B70',
    pill: 'rgba(255,255,255,0.96)', segOn: '#FFFFFF', sel: 'rgba(28,28,30,0.07)',
    selLine: 'rgba(28,28,30,0.10)', ring: 'rgba(255,255,255,0.9)',
    fc: ['#E1E6D3', '#E8E5D6', '#DCE3CF'], hw: '#FBF8F1', hwLine: '#D9D2C2', rd: '#FFFFFF',
    SC: { cut: '#C2410C', inund: '#1E4FA3', risk: '#B97300', clear: '#2F8A4F' },
    CHIP: { cut: ['#C2410C', '#FFFFFF'], inund: ['#DCE6F7', '#1A458F'], risk: ['#FBEBCB', '#75480A'], clear: ['#DDF0E2', '#24683C'] },
    TINT: { clear: ['#EAF3EC', '#CFE0D3', '#BDD1C1'], risk: ['#F8E7C6', '#E7CFA0', '#D7BC88'], inund: ['#D3DDF1', '#B3C3E1', '#9DB0D3'], cut: ['#F7D3C4', '#E9B39D', '#DB9F86'] },
    FULL: { cut: ['#E2571E', '#C2410C', '#A5370A'], risk: ['#F2AA3A', '#D99020', '#C27E16'], inund: ['#3363B8', '#2A529C', '#214585'] },
  },
  dark: {
    vars: {
      ink: '#F2F2F4', inkOn: '#121214', panel: 'rgba(8,8,8,0.8)', card: 'rgba(255,255,255,0.05)',
      mute: '#B8B8C0', dash: '#9A9AA4', land: '#14181D', district: '#1B2026', hill: '#242B33',
      river: '#1E4A66', obsFill: 'rgba(60,215,245,0.42)', obsStroke: 'rgba(130,235,255,0.85)',
      deepFill: 'rgba(30,110,200,0.45)',
    },
    ink: '#F2F2F4', inkOn: '#121214', mute: '#B8B8C0', mute2: '#C8C8D0', dash: '#9A9AA4',
    pill: 'rgba(30,33,38,0.96)', segOn: 'rgba(255,255,255,0.16)', sel: 'rgba(255,255,255,0.09)',
    selLine: 'rgba(255,255,255,0.14)', ring: 'rgba(0,0,0,0.6)',
    fc: ['#1A2119', '#1D2420', '#171D17'], hw: '#2E353E', hwLine: '#3C454F', rd: '#272D35',
    SC: { cut: '#FF7A45', inund: '#6EA2FF', risk: '#F5B84A', clear: '#5CCB82' },
    CHIP: { cut: ['#FF7A45', '#1A0E08'], inund: ['#1D2D52', '#A9C6FF'], risk: ['#3D2E12', '#F5C873'], clear: ['#16392A', '#8FE0AA'] },
    TINT: { clear: ['#3A4A44', '#2B3833', '#222D29'], risk: ['#6B5424', '#52411D', '#403216'], inund: ['#2F4C86', '#243B69', '#1B2E54'], cut: ['#8A3F20', '#6B3019', '#52250F'] },
    FULL: { cut: ['#FF7A45', '#D9602F', '#B24D24'], risk: ['#F5B84A', '#D49A32', '#B0802A'], inund: ['#4F7FDB', '#3D66B5', '#304F8F'] },
  },
}

// Editorial chrome tokens (nav, sidebar, buttons) — distinct from the map's PAL above.
export interface EditorialPalette {
  bg: string
  ink: string
  mute: string
  hair: string
  acc: string
  hov: string
}

export const ED: Record<Theme, EditorialPalette> = {
  light: { bg: '#FAFAFA', ink: '#0A0A0A', mute: '#737373', hair: '#E5E5E5', acc: '#1F5FD6', hov: 'rgba(0,0,0,0.05)' },
  dark: { bg: '#000000', ink: '#EDEDED', mute: '#8A8A8A', hair: '#262626', acc: '#5B8DEF', hov: 'rgba(255,255,255,0.07)' },
}

export function styleUrl(theme: Theme): string {
  return `https://basemaps.cartocdn.com/gl/${theme === 'dark' ? 'dark-matter' : 'positron'}-gl-style/style.json`
}
