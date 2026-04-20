import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { FiEye, FiRefreshCw, FiCheck } from 'react-icons/fi'
import { useThemeStore, FONT_SCALES } from '../../store/themeStore'
import { THEME_PRESETS, applyThemeCssVars } from '../../utils/themeColors'

export default function ThemeAppearanceSettings() {
  const {
    primaryHex,
    accentHex,
    presetId,
    fontScale,
    setPrimaryHex,
    setAccentHex,
    applyPreset,
    setFontScale,
    resetTheme,
  } = useThemeStore()

  const [previewPrimary, setPreviewPrimary] = useState(primaryHex)
  const [previewAccent, setPreviewAccent] = useState(accentHex)

  useEffect(() => {
    setPreviewPrimary(primaryHex)
    setPreviewAccent(accentHex)
  }, [primaryHex, accentHex])

  useEffect(() => {
    return () => {
      const s = useThemeStore.getState()
      applyThemeCssVars(s.primaryHex, s.accentHex)
    }
  }, [])

  const livePreview = () => {
    applyThemeCssVars(previewPrimary, previewAccent)
  }

  const commitColors = () => {
    setPrimaryHex(previewPrimary)
    setAccentHex(previewAccent)
    applyThemeCssVars(previewPrimary, previewAccent)
    toast.success('Brand colours saved')
  }

  const handleReset = () => {
    resetTheme()
    const s = useThemeStore.getState()
    setPreviewPrimary(s.primaryHex)
    setPreviewAccent(s.accentHex)
    applyThemeCssVars(s.primaryHex, s.accentHex)
    toast.success('Theme reset to default')
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Appearance & brand</h2>
        <p className="text-gray-600 text-sm mt-1">
          Match colours to the party or client. Use <strong>Test preview</strong> to try colours;
          leaving this tab restores the last saved theme if you did not save.
        </p>
      </div>

      <section className="card">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
          Quick presets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                applyPreset(p)
                setPreviewPrimary(p.primary)
                setPreviewAccent(p.accent)
                toast.success(`Applied “${p.name}”`)
              }}
              className={`text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                presetId === p.id
                  ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/40'
                  : 'border-gray-100 hover:border-primary-200 bg-white'
              }`}
            >
              <div className="flex gap-2 mb-2">
                <span
                  className="h-8 flex-1 rounded-lg shadow-inner"
                  style={{ background: p.primary }}
                />
                <span
                  className="h-8 w-10 rounded-lg shadow-inner"
                  style={{ background: p.accent }}
                />
              </div>
              <p className="font-semibold text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card space-y-5">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
            Custom colours
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary brand</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={previewPrimary}
                onChange={(e) => setPreviewPrimary(e.target.value)}
                className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer bg-white"
              />
              <input
                type="text"
                value={previewPrimary}
                onChange={(e) => setPreviewPrimary(e.target.value)}
                className="input-field flex-1 font-mono text-sm uppercase"
                maxLength={7}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent / secondary</label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={previewAccent}
                onChange={(e) => setPreviewAccent(e.target.value)}
                className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer bg-white"
              />
              <input
                type="text"
                value={previewAccent}
                onChange={(e) => setPreviewAccent(e.target.value)}
                className="input-field flex-1 font-mono text-sm uppercase"
                maxLength={7}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={livePreview} className="btn-secondary inline-flex items-center gap-2">
              <FiEye className="w-4 h-4" />
              Test preview
            </button>
            <button type="button" onClick={commitColors} className="btn-primary inline-flex items-center gap-2">
              <FiCheck className="w-4 h-4" />
              Save colours
            </button>
          </div>
        </section>

        <section className="card">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
            Live preview
          </h3>
          <div
            className="rounded-2xl p-5 text-white mb-4 shadow-inner"
            style={{
              background: `linear-gradient(135deg, ${previewPrimary} 0%, ${previewPrimary}dd 55%, ${previewAccent} 100%)`,
            }}
          >
            <p className="text-sm font-medium opacity-90">Campaign header</p>
            <p className="text-lg font-bold mt-1">Election CRM</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" className="btn-primary text-sm py-2 px-4">
              Primary button
            </button>
            <button type="button" className="btn-accent text-sm py-2 px-4">
              Accent button
            </button>
            <span className="badge-primary px-3 py-1">Badge</span>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/80">
            <p className="text-xs text-gray-500 mb-2">Sample card</p>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '72%', background: previewPrimary }}
              />
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
          Text size
        </h3>
        <p className="text-sm text-gray-600 mb-4">Saved on this device / browser.</p>
        <div className="flex flex-wrap gap-2">
          {FONT_SCALES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFontScale(f.id)
                toast.success(`Text size: ${f.label}`)
              }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                fontScale === f.id
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={handleReset} className="btn-secondary inline-flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" />
          Reset theme to default
        </button>
      </div>
    </div>
  )
}
