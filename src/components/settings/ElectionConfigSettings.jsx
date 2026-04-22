import { useState, useEffect } from 'react'
import { FiSave, FiMapPin, FiPlus, FiTrash2, FiBarChart2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep'
]

const CONSTITUENCY_TYPES = [
  { value: 'VIDHANSABHA', label: 'Vidhan Sabha (State Assembly)' },
  { value: 'LOKSABHA', label: 'Lok Sabha (Parliament)' },
  { value: 'MUNICIPAL', label: 'Municipal / Nagar Palika' },
  { value: 'PANCHAYAT', label: 'Panchayat' },
  { value: 'OTHER', label: 'Other' },
]

export default function ElectionConfigSettings() {
  const { role } = useAuthStore()
  const canEdit = role === 'SUPER_ADMIN' || role === 'STATE_ADMIN'

  const [formData, setFormData] = useState({
    constituencyName: '',
    constituencyNumber: '',
    constituencyType: 'VIDHANSABHA',
    state: '',
    district: '',
    candidateName: '',
    partyName: '',
    partySymbol: '',
    constituencyNameHi: '',
    dashboardBannerImageUrl: '',
    candidatePhotoUrl: '',
    partySymbolImageUrl: '',
    bannerGradientFrom: '',
    bannerGradientTo: '',
    dashboardSloganLine1: '',
    dashboardSloganLine2: '',
    electionDate: '',
    totalRegisteredVoters: 0,
    totalBooths: 0,
    totalWards: 0,
    pastElectionComparison: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/election-config')
      if (data.success && data.data) {
        const config = data.data
        setFormData({
          constituencyName: config.constituencyName || '',
          constituencyNumber: config.constituencyNumber || '',
          constituencyType: config.constituencyType || 'VIDHANSABHA',
          state: config.state || '',
          district: config.district || '',
          candidateName: config.candidateName || '',
          partyName: config.partyName || '',
          partySymbol: config.partySymbol || '',
          constituencyNameHi: config.constituencyNameHi || '',
          dashboardBannerImageUrl: config.dashboardBannerImageUrl || '',
          candidatePhotoUrl: config.candidatePhotoUrl || '',
          partySymbolImageUrl: config.partySymbolImageUrl || '',
          bannerGradientFrom: config.bannerGradientFrom || '',
          bannerGradientTo: config.bannerGradientTo || '',
          dashboardSloganLine1: config.dashboardSloganLine1 || '',
          dashboardSloganLine2: config.dashboardSloganLine2 || '',
          electionDate: config.electionDate ? config.electionDate.split('T')[0] : '',
          totalRegisteredVoters: config.totalRegisteredVoters || 0,
          totalBooths: config.totalBooths || 0,
          totalWards: config.totalWards || 0,
          pastElectionComparison: Array.isArray(config.pastElectionComparison)
            ? config.pastElectionComparison.map((r) => ({
                label: r.label || '',
                year: r.year || '',
                value: typeof r.value === 'number' ? r.value : Number(r.value) || 0,
                barColor: r.barColor || '',
              }))
            : [],
        })
      }
    } catch (error) {
      console.error('Failed to fetch election config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!canEdit) return

    setSaving(true)
    try {
      const payload = {
        ...formData,
        pastElectionComparison: (formData.pastElectionComparison || [])
          .filter((r) => r.label && String(r.label).trim())
          .map((r) => ({
            label: String(r.label).trim(),
            year: r.year ? String(r.year).trim() : '',
            value: Math.min(100, Math.max(0, Number(r.value) || 0)),
            barColor: r.barColor ? String(r.barColor).trim() : '',
          })),
      }
      const { data } = await api.put('/election-config', payload)
      if (data.success) {
        toast.success('Election configuration saved successfully')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addComparisonRow = () => {
    setFormData((prev) => ({
      ...prev,
      pastElectionComparison: [
        ...(prev.pastElectionComparison || []),
        { label: '', year: '', value: 40, barColor: '' },
      ],
    }))
  }

  const updateComparisonRow = (index, field, value) => {
    setFormData((prev) => {
      const rows = [...(prev.pastElectionComparison || [])]
      rows[index] = { ...rows[index], [field]: value }
      return { ...prev, pastElectionComparison: rows }
    })
  }

  const removeComparisonRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      pastElectionComparison: (prev.pastElectionComparison || []).filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave}>
      <div className="space-y-6">
        {/* Constituency Details */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Constituency Details</h2>
              <p className="text-sm text-gray-500">Configure which area this software is being used for</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Constituency Type *
              </label>
              <select
                value={formData.constituencyType}
                onChange={e => handleChange('constituencyType', e.target.value)}
                className="input-field"
                disabled={!canEdit}
                required
              >
                {CONSTITUENCY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Constituency Name *
              </label>
              <input
                type="text"
                value={formData.constituencyName}
                onChange={e => handleChange('constituencyName', e.target.value)}
                className="input-field"
                placeholder="e.g., Lucknow West"
                disabled={!canEdit}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Constituency Number
              </label>
              <input
                type="text"
                value={formData.constituencyNumber}
                onChange={e => handleChange('constituencyNumber', e.target.value)}
                className="input-field"
                placeholder="e.g., 175"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                State *
              </label>
              <select
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                className="input-field"
                disabled={!canEdit}
                required
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                District *
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={e => handleChange('district', e.target.value)}
                className="input-field"
                placeholder="e.g., Lucknow"
                disabled={!canEdit}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Election Date
              </label>
              <input
                type="date"
                value={formData.electionDate}
                onChange={e => handleChange('electionDate', e.target.value)}
                className="input-field"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Candidate & Party */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Candidate & Party</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Candidate Name
              </label>
              <input
                type="text"
                value={formData.candidateName}
                onChange={e => handleChange('candidateName', e.target.value)}
                className="input-field"
                placeholder="Full name"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Party Name
              </label>
              <input
                type="text"
                value={formData.partyName}
                onChange={e => handleChange('partyName', e.target.value)}
                className="input-field"
                placeholder="Party name"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Party Symbol (text)
              </label>
              <input
                type="text"
                value={formData.partySymbol}
                onChange={e => handleChange('partySymbol', e.target.value)}
                className="input-field"
                placeholder="e.g., कमल, Lotus"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Dashboard hero (home banner) */}
        <div className="card border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Dashboard banner</h2>
          <p className="text-sm text-gray-600 mb-4">
            Optional: candidate photo, symbol image, slogans, colours, or one full banner image (HTTPS link — e.g. from
            your CDN / Drive public link). Leave image URLs empty to use text + gradient only.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full banner background image URL (optional)
              </label>
              <input
                type="url"
                value={formData.dashboardBannerImageUrl}
                onChange={(e) => handleChange('dashboardBannerImageUrl', e.target.value)}
                className="input-field"
                placeholder="https://…/banner.jpg"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Candidate photo URL
              </label>
              <input
                type="url"
                value={formData.candidatePhotoUrl}
                onChange={(e) => handleChange('candidatePhotoUrl', e.target.value)}
                className="input-field"
                placeholder="https://…/candidate.png"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Party symbol image URL
              </label>
              <input
                type="url"
                value={formData.partySymbolImageUrl}
                onChange={(e) => handleChange('partySymbolImageUrl', e.target.value)}
                className="input-field"
                placeholder="https://…/symbol.png"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Banner title (Hindi / large line, optional)
              </label>
              <input
                type="text"
                value={formData.constituencyNameHi}
                onChange={(e) => handleChange('constituencyNameHi', e.target.value)}
                className="input-field"
                placeholder="e.g. मल्लावां-बिलग्राम — empty uses constituency name"
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Banner gradient — from (hex)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.bannerGradientFrom || '#ea580c'}
                  onChange={(e) => handleChange('bannerGradientFrom', e.target.value)}
                  className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer bg-white shrink-0"
                  disabled={!canEdit}
                />
                <input
                  type="text"
                  value={formData.bannerGradientFrom}
                  onChange={(e) => handleChange('bannerGradientFrom', e.target.value)}
                  className="input-field flex-1 font-mono text-sm"
                  placeholder="#ea580c (optional)"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Banner gradient — to (hex)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.bannerGradientTo || '#9a3412'}
                  onChange={(e) => handleChange('bannerGradientTo', e.target.value)}
                  className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer bg-white shrink-0"
                  disabled={!canEdit}
                />
                <input
                  type="text"
                  value={formData.bannerGradientTo}
                  onChange={(e) => handleChange('bannerGradientTo', e.target.value)}
                  className="input-field flex-1 font-mono text-sm"
                  placeholder="#9a3412 (optional)"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slogan line 1 (optional)</label>
              <input
                type="text"
                value={formData.dashboardSloganLine1}
                onChange={(e) => handleChange('dashboardSloganLine1', e.target.value)}
                className="input-field"
                placeholder="e.g. जनता का विश्वास, विकास का संकल्प"
                disabled={!canEdit}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slogan line 2 (optional)</label>
              <input
                type="text"
                value={formData.dashboardSloganLine2}
                onChange={(e) => handleChange('dashboardSloganLine2', e.target.value)}
                className="input-field"
                placeholder="e.g. हर घर तक सेवा, हर दिल में भरोसा"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Past election comparison (dashboard bar chart) */}
        <div className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <FiBarChart2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Past election comparison</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add bars for previous Vidhan Sabha / Lok Sabha / local body results (vote share % or any 0–100 score).
                These appear on the main dashboard chart next to your live supporter survey from voters.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {(formData.pastElectionComparison || []).map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50"
              >
                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => updateComparisonRow(index, 'label', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Vidhan Sabha 2022 (BJP)"
                    disabled={!canEdit}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input
                    type="text"
                    value={row.year}
                    onChange={(e) => updateComparisonRow(index, 'year', e.target.value)}
                    className="input-field"
                    placeholder="2022"
                    disabled={!canEdit}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Value (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.value}
                    onChange={(e) => updateComparisonRow(index, 'value', parseFloat(e.target.value) || 0)}
                    className="input-field"
                    disabled={!canEdit}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bar colour</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={row.barColor || '#2563eb'}
                      onChange={(e) => updateComparisonRow(index, 'barColor', e.target.value)}
                      className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer bg-white"
                      disabled={!canEdit}
                    />
                    <input
                      type="text"
                      value={row.barColor}
                      onChange={(e) => updateComparisonRow(index, 'barColor', e.target.value)}
                      className="input-field flex-1 font-mono text-xs"
                      placeholder="#2563eb"
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-end">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => removeComparisonRow(index)}
                      className="btn-danger w-full justify-center py-2.5"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {canEdit && (
            <button type="button" onClick={addComparisonRow} className="btn-secondary mt-4 inline-flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Add comparison row
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Constituency Stats (Official)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Enter official election commission data for this constituency
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Total Registered Voters
              </label>
              <input
                type="number"
                value={formData.totalRegisteredVoters}
                onChange={e => handleChange('totalRegisteredVoters', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Total Wards
              </label>
              <input
                type="number"
                value={formData.totalWards}
                onChange={e => handleChange('totalWards', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Total Booths
              </label>
              <input
                type="number"
                value={formData.totalBooths}
                onChange={e => handleChange('totalBooths', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8"
            >
              <FiSave className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        )}

        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              Only Super Admin or State Admin can edit the election configuration.
            </p>
          </div>
        )}
      </div>
    </form>
  )
}
