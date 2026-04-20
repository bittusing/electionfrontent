/**
 * Build Tailwind-compatible "R G B" triplets for CSS rgb(var(--x) / <alpha>).
 */

function parseHex(hex) {
  if (!hex || typeof hex !== 'string') return [37, 99, 235]
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  if (h.length !== 6) return [37, 99, 235]
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return [37, 99, 235]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function toSpace([r, g, b]) {
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`
}

function lighten(rgb, t) {
  return rgb.map((c) => c + (255 - c) * t)
}

function darken(rgb, t) {
  return rgb.map((c) => c * (1 - t))
}

/** Full primary scale from one brand hex */
export function buildPrimaryScale(hex) {
  const base = parseHex(hex)
  return {
    50: toSpace(lighten(base, 0.94)),
    100: toSpace(lighten(base, 0.88)),
    200: toSpace(lighten(base, 0.75)),
    300: toSpace(lighten(base, 0.58)),
    400: toSpace(lighten(base, 0.38)),
    500: toSpace(lighten(base, 0.18)),
    600: toSpace(base),
    700: toSpace(darken(base, 0.1)),
    800: toSpace(darken(base, 0.2)),
    900: toSpace(darken(base, 0.3)),
  }
}

export function buildAccentScale(hex) {
  const base = parseHex(hex)
  return {
    400: toSpace(lighten(base, 0.35)),
    500: toSpace(base),
    600: toSpace(darken(base, 0.12)),
  }
}

export function applyThemeCssVars(primaryHex, accentHex) {
  const root = document.documentElement
  const primary = buildPrimaryScale(primaryHex)
  const accent = buildAccentScale(accentHex)
  Object.entries(primary).forEach(([k, v]) => {
    root.style.setProperty(`--color-primary-${k}`, v)
  })
  Object.entries(accent).forEach(([k, v]) => {
    root.style.setProperty(`--color-accent-${k}`, v)
  })
}

export const THEME_PRESETS = [
  {
    id: 'default',
    name: 'Classic Blue',
    description: 'Neutral professional',
    primary: '#2563eb',
    accent: '#f59e0b',
  },
  {
    id: 'saffron',
    name: 'Saffron & Green',
    description: 'Popular Indian campaign palette',
    primary: '#ea580c',
    accent: '#15803d',
  },
  {
    id: 'lotus',
    name: 'Lotus Deep',
    description: 'Deep saffron with gold accent',
    primary: '#c2410c',
    accent: '#ca8a04',
  },
  {
    id: 'grassroots',
    name: 'Grassroots Green',
    description: 'Field & environment tone',
    primary: '#15803d',
    accent: '#0d9488',
  },
  {
    id: 'tricolor',
    name: 'Tricolor',
    description: 'Saffron primary, navy accent',
    primary: '#f97316',
    accent: '#1e3a8a',
  },
  {
    id: 'midnight',
    name: 'Midnight Slate',
    description: 'Modern dark-blue corporate',
    primary: '#4f46e5',
    accent: '#06b6d4',
  },
]

export const DEFAULT_THEME = {
  primaryHex: '#2563eb',
  accentHex: '#f59e0b',
  presetId: 'default',
}
