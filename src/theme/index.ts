/**
 * Visual language: industrial load-center. Dark enclosure, high-contrast
 * handles, monospace numerals on breaker tags — legible in a dark basement.
 */
import type { CircuitKind, ItemKind } from '../domain/types'

export const colors = {
  bg: '#0f1115',
  surface: '#171a21',
  surfaceAlt: '#1e222b',
  enclosure: '#14161c',
  busbar: '#23272f',
  rail: '#2a2f3a',
  edge: '#3a4150',
  hairline: '#2d323c',

  text: '#e6e9ef',
  textDim: '#9aa3b2',
  textFaint: '#646c7a',

  accent: '#f6b73c', // amber — primary CTA / highlight
  accentDim: '#9a7320',

  on: '#3fbf6f', // breaker energized (green)
  off: '#e0533d', // breaker off (red)
  warn: '#f6b73c',
  info: '#5aa9e6',

  danger: '#e0533d',
} as const

/**
 * "Classic Steel" panel skin — modeled on a real residential load center:
 * gray steel enclosure, black breaker bodies, paper circuit-label tags.
 * Future skins (Smart Panel, Aluminum) will live alongside this one.
 */
export const steel = {
  outer: '#8f969e', // enclosure steel
  outerEdge: '#565c63',
  trim: '#a8aeb6', // inner dead-front panel
  trimEdge: '#787e86',
  channel: '#7d838b', // center channel between bus columns
  channelEdge: '#62686f',
  channelNum: '#3f444a',
  knockout: '#9aa0a8', // unused-slot blank
  knockoutEdge: '#878d95',
  screw: '#c6cbd1',
  screwSlot: '#4d5258',
  breakerBody: '#1a1b1d',
  breakerEdge: '#000000',
  handle: '#34373c',
  handleOff: '#46494e',
  handleEdge: '#0c0d0e',
  handleText: '#e6e6e6',
  labelPaper: '#f4f2ec',
  labelPaperEdge: '#b9b4a4',
  labelText: '#23272d',
  labelSub: '#7a766a',
  offText: '#c0392b',
  stamp: '#5a6068', // embossed lettering on the steel
} as const

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const

export const fonts = {
  mono: 'monospace',
} as const

/** Accent color for a circuit kind (used on the breaker tag stripe). */
export function circuitKindColor(kind: CircuitKind): string {
  switch (kind) {
    case 'gfci':
      return '#5aa9e6'
    case 'afci':
      return '#b98cff'
    case 'gfci_afci':
      return '#5ad6c8'
    case 'main':
      return '#f6b73c'
    case 'subfeed':
      return '#f0883e'
    case 'spare':
      return '#646c7a'
    default:
      return '#8893a5'
  }
}

export function circuitKindLabel(kind: CircuitKind): string {
  switch (kind) {
    case 'gfci':
      return 'GFCI'
    case 'afci':
      return 'AFCI'
    case 'gfci_afci':
      return 'GFCI+AFCI'
    case 'main':
      return 'MAIN'
    case 'subfeed':
      return 'SUBFEED'
    case 'spare':
      return 'SPARE'
    default:
      return 'STD'
  }
}

/** SF Symbol-ish emoji glyph for an item kind (kept dependency-free for v1). */
export function itemKindGlyph(kind: ItemKind): string {
  switch (kind) {
    case 'outlet':
      return '🔌'
    case 'light':
      return '💡'
    case 'switch':
      return '🎚️'
    case 'appliance':
      return '🔻'
    case 'hardwired':
      return '🧷'
    case 'hvac':
      return '❄️'
    default:
      return '⚙️'
  }
}

export function itemKindLabel(kind: ItemKind): string {
  switch (kind) {
    case 'hvac':
      return 'HVAC'
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1)
  }
}
