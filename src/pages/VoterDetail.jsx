import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiTrash2, FiPhone, FiMail, FiSave, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

export default function VoterDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { permissions, role } = useAuthStore()
  const [voter, setVoter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === '1')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    relativeName: '',
    age: '',
    gender: '',
    phone: '',
    voterIdNumber: '',
  })

  const canEdit = permissions?.voters?.edit || role === 'SUPER_ADMIN'
  const canDelete = permissions?.voters?.delete || role === 'SUPER_ADMIN'

  const fetchVoter = useCallback(async () => {
    try {
      const { data } = await api.get(`/voters/${id}`)
      if (data.success) {
        setVoter(data.data)
        const v = data.data
        setForm({
          name: v.name || '',
          relativeName: v.relativeName || '',
          age: v.age != null ? String(v.age) : '',
          gender: v.gender || '',
          phone: v.phone || '',
          voterIdNumber: v.voterIdNumber || '',
        })
      }
    } catch {
      toast.error('Failed to fetch voter details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchVoter()
  }, [fetchVoter])

  useEffect(() => {
    if (!canEdit) {
      setIsEditing(false)
      return
    }
    if (searchParams.get('edit') === '1') setIsEditing(true)
  }, [searchParams, canEdit])

  const leaveEditMode = () => {
    setIsEditing(false)
    if (searchParams.get('edit')) {
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const handleSave = async () => {
    if (!form.name || String(form.name).trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    if (form.phone && !/^[0-9]{10}$/.test(String(form.phone).trim())) {
      toast.error('Phone must be 10 digits or leave empty')
      return
    }
    const payload = {
      name: String(form.name).trim(),
      relativeName: form.relativeName?.trim() || undefined,
      voterIdNumber: form.voterIdNumber?.trim() || undefined,
      gender: form.gender || undefined,
      age: form.age === '' || form.age == null ? undefined : Number(form.age),
      phone: form.phone?.trim() || undefined,
    }
    if (payload.age !== undefined && (Number.isNaN(payload.age) || payload.age < 0 || payload.age > 120)) {
      toast.error('Age must be between 0 and 120')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.put(`/voters/${id}`, payload)
      if (data.success) {
        toast.success('Voter updated')
        setVoter(data.data)
        leaveEditMode()
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this voter permanently?')) return
    try {
      const { data } = await api.delete(`/voters/${id}`)
      if (data.success) {
        toast.success('Voter deleted')
        navigate('/voters')
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
      </div>
    )
  }

  if (!voter) {
    return <div className="text-center py-12">Voter not found</div>
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/voters')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{voter.name || 'Voter'}</h1>
            <p className="text-gray-600 mt-1">Voter details</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !isEditing && (
            <button
              type="button"
              className="btn-secondary flex items-center"
              onClick={() => setIsEditing(true)}
            >
              <FiEdit2 className="mr-2" />
              Edit
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn-danger flex items-center" onClick={handleDelete}>
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      {canEdit && isEditing && (
        <div className="card mb-6 border border-primary-100 bg-primary-50/30">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit voter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Father / husband / relative</label>
              <input
                className="input-field"
                value={form.relativeName}
                onChange={(e) => setForm((f) => ({ ...f, relativeName: e.target.value }))}
                placeholder="पिता / पति का नाम"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                min={0}
                max={120}
                className="input-field"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                className="input-field"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (10 digits)</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voter ID (EPIC)</label>
              <input
                className="input-field"
                value={form.voterIdNumber}
                onChange={(e) => setForm((f) => ({ ...f, voterIdNumber: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" className="btn-primary flex items-center gap-2" disabled={saving} onClick={handleSave}>
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              disabled={saving}
              onClick={() => {
                leaveEditMode()
                fetchVoter()
              }}
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Phone" value={voter.phone} icon={<FiPhone />} />
              <InfoItem label="Email" value={voter.email} icon={<FiMail />} />
              <InfoItem label="Gender" value={voter.gender} />
              <InfoItem label="Age" value={voter.age} />
              <InfoItem label="Voter ID" value={voter.voterIdNumber} />
              <InfoItem label="Father / relative" value={voter.relativeName} />
              <InfoItem label="Occupation" value={voter.occupation} />
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Demographics</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Caste" value={voter.caste} />
              <InfoItem label="Sub-Caste" value={voter.subCaste} />
              <InfoItem label="Religion" value={voter.religion} />
              <InfoItem label="Education" value={voter.education} />
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Employment & economic</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Employment type" value={voter.employmentType} />
              <InfoItem label="Government employee" value={voter.isGovernmentEmployee ? 'Yes' : 'No'} />
              <InfoItem label="Department" value={voter.governmentDepartment} />
              <InfoItem label="Monthly income" value={voter.monthlyIncome} />
            </div>
          </div>

          {voter.isMigrant && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Migration details</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Migrant type" value={voter.migrantType} />
                <InfoItem label="Original state" value={voter.originalState} />
                <InfoItem label="Original district" value={voter.originalDistrict} />
                <InfoItem label="Migration reason" value={voter.migrationReason} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
            <div className="space-y-3">
              <StatusBadge label="Consent" value={voter.consentStatus} />
              <StatusBadge label="Engagement" value={voter.engagementLevel} />
              <StatusBadge label="Support" value={voter.supportLevel} />
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Government benefits</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ration card:</span>
                <span className="font-medium">{voter.rationCardType || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Schemes:</span>
                <span className="font-medium">{voter.governmentSchemes?.length || 0}</span>
              </div>
            </div>
          </div>

          {voter.isInfluencer && (
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Influencer</h3>
              <p className="text-sm text-yellow-700">Influence level: {voter.influenceLevel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, icon }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-center">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        <p className="font-medium text-gray-800">{value != null && value !== '' ? String(value) : '—'}</p>
      </div>
    </div>
  )
}

function StatusBadge({ label, value }) {
  const getColor = () => {
    if (value === 'HIGH' || value === 'GIVEN' || value === 'STRONG_SUPPORTER') return 'bg-green-100 text-green-700'
    if (value === 'MEDIUM' || value === 'SUPPORTER') return 'bg-blue-100 text-blue-700'
    if (value === 'LOW' || value === 'NEUTRAL') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`px-2 py-1 text-xs rounded-full ${getColor()}`}>{value || 'Unknown'}</span>
    </div>
  )
}
