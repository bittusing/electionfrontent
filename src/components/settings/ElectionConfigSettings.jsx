import { useState, useEffect } from 'react'
import { FiSave, FiMapPin } from 'react-icons/fi'
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
    electionDate: '',
    totalRegisteredVoters: 0,
    totalBooths: 0,
    totalWards: 0,
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
          electionDate: config.electionDate ? config.electionDate.split('T')[0] : '',
          totalRegisteredVoters: config.totalRegisteredVoters || 0,
          totalBooths: config.totalBooths || 0,
          totalWards: config.totalWards || 0,
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
      const { data } = await api.put('/election-config', formData)
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
                Party Symbol
              </label>
              <input
                type="text"
                value={formData.partySymbol}
                onChange={e => handleChange('partySymbol', e.target.value)}
                className="input-field"
                placeholder="e.g., Lotus, Hand"
                disabled={!canEdit}
              />
            </div>
          </div>
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
