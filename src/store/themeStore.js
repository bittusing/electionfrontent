import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_THEME } from '../utils/themeColors'

export const FONT_SCALES = [
  { id: 'sm', label: 'Compact', size: '15px' },
  { id: 'md', label: 'Standard', size: '16px' },
  { id: 'lg', label: 'Comfortable', size: '17px' },
]

export const useThemeStore = create(
  persist(
    (set) => ({
      primaryHex: DEFAULT_THEME.primaryHex,
      accentHex: DEFAULT_THEME.accentHex,
      presetId: DEFAULT_THEME.presetId,
      fontScale: 'md',

      setPrimaryHex: (primaryHex) => set({ primaryHex, presetId: 'custom' }),

      setAccentHex: (accentHex) => set({ accentHex, presetId: 'custom' }),

      applyPreset: (preset) =>
        set({
          primaryHex: preset.primary,
          accentHex: preset.accent,
          presetId: preset.id,
        }),

      setFontScale: (fontScale) => set({ fontScale }),

      resetTheme: () =>
        set({
          primaryHex: DEFAULT_THEME.primaryHex,
          accentHex: DEFAULT_THEME.accentHex,
          presetId: DEFAULT_THEME.presetId,
          fontScale: 'md',
        }),
    }),
    {
      name: 'election-theme',
    }
  )
)
