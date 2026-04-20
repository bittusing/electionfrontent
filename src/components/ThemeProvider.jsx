import { useEffect } from 'react'
import { useThemeStore, FONT_SCALES } from '../store/themeStore'
import { applyThemeCssVars } from '../utils/themeColors'

export default function ThemeProvider({ children }) {
  const primaryHex = useThemeStore((s) => s.primaryHex)
  const accentHex = useThemeStore((s) => s.accentHex)
  const fontScale = useThemeStore((s) => s.fontScale)

  useEffect(() => {
    applyThemeCssVars(primaryHex, accentHex)
    const entry = FONT_SCALES.find((f) => f.id === fontScale)
    document.documentElement.style.fontSize = entry?.size || '16px'
  }, [primaryHex, accentHex, fontScale])

  return children
}
