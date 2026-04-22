import { useState, useEffect } from 'react'
import { FiPlus, FiMap, FiEdit2, FiTrash2, FiX, FiFlag } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

function FieldCampaignSignage({ area, onSaved }) {
  const [status, setStatus] = useState(area.fieldCampaign?.signageStatus || 'NONE')
  const [notes, setNotes] = useState(area.fieldCampaign?.signageNotes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(area.fieldCampaign?.signageStatus || 'NONE')
    setNotes(area.fieldCampaign?.signageNotes || '')
  }, [area._id, area.fieldCampaign?.signageStatus, area.fieldCampaign?.signageNotes])

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch(`/areas/${area._id}/field-campaign`, {
        signageStatus: status,
        signageNotes: notes,
      })
      if (data.success) {
        toast.success('Signage status saved')
        onSaved()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update signage')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-primary-100/60 bg-primary-50/20 rounded-lg px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 mb-2">
        <FiFlag className="text-primary-600" />
        Field: posters / village signage
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input-field text-sm mb-2"
      >
        <option value="NONE">Not deployed</option>
        <option value="PARTIAL">Partial coverage</option>
        <option value="COMPLETE">Fully covered</option>
      </select>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-field text-sm mb-2"
        placeholder="Short note (optional)"
      />
      <button type="button" onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2">
        {saving ? 'Saving…' : 'Save signage'}
      </button>
    </div>
  )
}

export default function Areas() {
  const { permissions } = useAuthStore()
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', status: 'ACTIVE' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedArea, setSelectedArea] = useState(null)

  useEffect(() => {
    fetchAreas()
  }, [filter])

  const fetchAreas = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.type) params.append('type', filter.type)
      if (filter.status) params.append('status', filter.status)

      const { data } = await api.get(`/areas?${params}`)
      if (data.success) {
        setAreas(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch areas')
    } finally {
      setLoading(false)
    }
  }
  
  const handleEdit = (area) => {
    setSelectedArea(area)
    setShowEditModal(true)
  }
  
  const handleDelete = async (areaId, areaName) => {
    if (!confirm(`Are you sure you want to delete "${areaName}"?`)) {
      return
    }
    
    try {
      const { data } = await api.delete(`/areas/${areaId}`)
      if (data.success) {
        toast.success('Area deleted successfully')
        fetchAreas()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete area')
    }
  }

  const areaTypes = ['STATE', 'DISTRICT', 'TEHSIL', 'BLOCK', 'VILLAGE', 'WARD', 'BOOTH']

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Area Management</h1>
          <p className="text-gray-600 mt-1">Manage hierarchical area structure</p>
        </div>
        {permissions?.areas?.create && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <FiPlus className="mr-2" />
            Add Area
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="input-field"
            >
              <option value="">All Types</option>
              {areaTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Areas List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <div key={area._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
                    <FiMap className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{area.name}</h3>
                    <span className="text-xs text-gray-500">{area.type}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  area.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {area.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Total Voters:</span>
                  <span className="font-medium">{area.metadata?.totalVoters || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Workers:</span>
                  <span className="font-medium">{area.stats?.activeWorkers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Map Location:</span>
                  <span className={`font-medium ${area.coordinates?.latitude ? 'text-green-600' : 'text-amber-500'}`}>
                    {area.coordinates?.latitude ? 'Set' : 'Not set'}
                  </span>
                </div>
              </div>

              {['VILLAGE', 'WARD', 'BOOTH'].includes(area.type) && permissions?.voters?.edit && (
                <FieldCampaignSignage area={area} onSaved={fetchAreas} />
              )}

              {(permissions?.areas?.edit || permissions?.areas?.delete) && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  {permissions?.areas?.edit && (
                    <button 
                      onClick={() => handleEdit(area)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      <FiEdit2 className="mr-1" />
                      Edit
                    </button>
                  )}
                  {permissions?.areas?.delete && (
                    <button 
                      onClick={() => handleDelete(area._id, area.name)}
                      className="btn-danger flex-1 text-sm"
                    >
                      <FiTrash2 className="mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddAreaModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchAreas()
          }}
          existingAreas={areas}
        />
      )}
      
      {showEditModal && selectedArea && (
        <EditAreaModal
          area={selectedArea}
          onClose={() => {
            setShowEditModal(false)
            setSelectedArea(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedArea(null)
            fetchAreas()
          }}
          existingAreas={areas}
        />
      )}
    </div>
  )
}

function AddAreaModal({ onClose, onSuccess, existingAreas }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'STATE',
    code: '',
    parentId: '',
    coordinates: {
      latitude: '',
      longitude: ''
    },
    metadata: {
      population: '',
      totalVoters: ''
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const areaTypes = [
    { value: 'STATE', label: 'State (राज्य)' },
    { value: 'DISTRICT', label: 'District (जिला)' },
    { value: 'TEHSIL', label: 'Tehsil (तहसील)' },
    { value: 'BLOCK', label: 'Block (ब्लॉक)' },
    { value: 'VILLAGE', label: 'Village (गाँव)' },
    { value: 'WARD', label: 'Ward (वार्ड)' },
    { value: 'BOOTH', label: 'Booth (बूथ)' }
  ]

  // Filter parent areas based on selected type
  const getParentAreas = () => {
    const typeHierarchy = {
      STATE: [],
      DISTRICT: ['STATE'],
      TEHSIL: ['DISTRICT'],
      /** Block: under tehsil when used; otherwise directly under district (UP-style विकास खंड). */
      BLOCK: ['TEHSIL', 'DISTRICT'],
      VILLAGE: ['BLOCK'],
      WARD: ['BLOCK'],
      BOOTH: ['VILLAGE', 'WARD'],
    }

    const allowedParentTypes = typeHierarchy[formData.type] || []
    return existingAreas.filter((area) => allowedParentTypes.includes(area.type))
  }

  const parentHintForEmpty = () => {
    const t = formData.type
    if (t === 'DISTRICT') return 'STATE'
    if (t === 'TEHSIL') return 'DISTRICT'
    if (t === 'BLOCK') return 'TEHSIL or DISTRICT (ब्लॉक सीधे जिले के नीचे भी)'
    if (t === 'VILLAGE' || t === 'WARD') return 'BLOCK'
    if (t === 'BOOTH') return 'VILLAGE या WARD'
    return 'parent'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData = {
        ...formData,
        coordinates: {
          latitude: formData.coordinates.latitude ? parseFloat(formData.coordinates.latitude) : undefined,
          longitude: formData.coordinates.longitude ? parseFloat(formData.coordinates.longitude) : undefined
        },
        metadata: {
          population: formData.metadata.population ? parseInt(formData.metadata.population) : undefined,
          totalVoters: formData.metadata.totalVoters ? parseInt(formData.metadata.totalVoters) : undefined
        }
      }

      if (!submitData.code) delete submitData.code
      if (!submitData.parentId) delete submitData.parentId
      if (!submitData.coordinates.latitude) delete submitData.coordinates

      const { data } = await api.post('/areas', submitData)
      if (data.success) {
        toast.success('Area added successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add area')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Area</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Helpful Note */}
            {existingAreas.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium">
                  💡 पहली बार area add कर रहे हैं?
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  पहले <strong>STATE</strong> बनाएं (जैसे: Uttar Pradesh), फिर बाकी areas add करें।
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Lucknow, Sadar, Booth 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, parentId: '' })}
                className="input-field"
              >
                {areaTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Hierarchy: STATE → DISTRICT → (optional TEHSIL) → BLOCK → VILLAGE/WARD → BOOTH. जहाँ तहसील नहीं,
                ब्लॉक सीधे जिले के अंतर्गत बनाएँ।
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Area {formData.type !== 'STATE' && '*'}
              </label>
              <select
                required={formData.type !== 'STATE'}
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="input-field"
                disabled={formData.type === 'STATE'}
              >
                <option value="">
                  {formData.type === 'STATE' ? 'No Parent (Top Level)' : 'Select Parent Area'}
                </option>
                {getParentAreas().map(area => (
                  <option key={area._id} value={area._id}>
                    {area.name} ({area.type})
                  </option>
                ))}
              </select>
              {formData.type !== 'STATE' && getParentAreas().length === 0 && (
                <p className="mt-1 rounded bg-orange-50 p-2 text-xs text-orange-600">
                  ⚠️ कोई parent area नहीं मिला! पहले <strong>{parentHintForEmpty()}</strong> बनाएं।
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Code (Optional)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input-field"
                placeholder="e.g., LKO-01, BOOTH-101"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Population (Optional)
                </label>
                <input
                  type="number"
                  value={formData.metadata.population}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, population: e.target.value }
                  })}
                  className="input-field"
                  min="0"
                  placeholder="Total population"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Voters (Optional)
                </label>
                <input
                  type="number"
                  value={formData.metadata.totalVoters}
                  onChange={(e) => setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, totalVoters: e.target.value }
                  })}
                  className="input-field"
                  min="0"
                  placeholder="Registered voters"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude (Map)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.latitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: { ...formData.coordinates, latitude: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., 26.8467"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude (Map)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.longitude}
                  onChange={(e) => setFormData({
                    ...formData,
                    coordinates: { ...formData.coordinates, longitude: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., 80.9462"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Google Maps pe area ka naam search karo, right-click karo aur coordinates copy karo.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Guide:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>STATE:</strong> Top level (e.g., Uttar Pradesh)</li>
                <li>• <strong>DISTRICT:</strong> Under State (e.g., Lucknow)</li>
                <li>• <strong>TEHSIL:</strong> Under District (optional — जहाँ लागू हो)</li>
                <li>• <strong>BLOCK:</strong> Under Tehsil, or directly under District if no tehsil</li>
                <li>• <strong>VILLAGE:</strong> Rural area under Block</li>
                <li>• <strong>WARD:</strong> Urban area under Block</li>
                <li>• <strong>BOOTH:</strong> Polling booth under Village/Ward</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (formData.type !== 'STATE' && getParentAreas().length === 0)}
                className="btn-primary flex-1"
              >
                {submitting ? 'Adding...' : 'Add Area'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit Area Modal Component
function EditAreaModal({ area, onClose, onSuccess, existingAreas }) {
  const [formData, setFormData] = useState({
    name: area.name || '',
    type: area.type || 'STATE',
    code: area.code || '',
    parentId: area.parentId?._id || area.parentId || '',
    status: area.status || 'ACTIVE',
    coordinates: {
      latitude: area.coordinates?.latitude || '',
      longitude: area.coordinates?.longitude || ''
    },
    metadata: {
      population: area.metadata?.population || '',
      totalVoters: area.metadata?.totalVoters || ''
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const areaTypes = [
    { value: 'STATE', label: 'State (राज्य)' },
    { value: 'DISTRICT', label: 'District (जिला)' },
    { value: 'TEHSIL', label: 'Tehsil (तहसील)' },
    { value: 'BLOCK', label: 'Block (ब्लॉक)' },
    { value: 'VILLAGE', label: 'Village (गाँव)' },
    { value: 'WARD', label: 'Ward (वार्ड)' },
    { value: 'BOOTH', label: 'Booth (बूथ)' }
  ]

  // Filter parent areas based on selected type
  const getParentAreas = () => {
    const typeHierarchy = {
      STATE: [],
      DISTRICT: ['STATE'],
      TEHSIL: ['DISTRICT'],
      BLOCK: ['TEHSIL', 'DISTRICT'],
      VILLAGE: ['BLOCK'],
      WARD: ['BLOCK'],
      BOOTH: ['VILLAGE', 'WARD'],
    }

    const allowedParentTypes = typeHierarchy[formData.type] || []
    return existingAreas.filter(
      (a) => allowedParentTypes.includes(a.type) && a._id !== area._id
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData = {
        ...formData,
        coordinates: {
          latitude: formData.coordinates.latitude ? parseFloat(formData.coordinates.latitude) : undefined,
          longitude: formData.coordinates.longitude ? parseFloat(formData.coordinates.longitude) : undefined
        },
        metadata: {
          population: formData.metadata.population ? parseInt(formData.metadata.population) : undefined,
          totalVoters: formData.metadata.totalVoters ? parseInt(formData.metadata.totalVoters) : undefined
        }
      }

      if (!submitData.code) delete submitData.code
      if (!submitData.parentId) delete submitData.parentId

      const { data } = await api.put(`/areas/${area._id}`, submitData)
      if (data.success) {
        toast.success('Area updated successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update area')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Edit Area</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Area Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g., Uttar Pradesh, Lucknow, Booth 101"
              />
            </div>

            {/* Area Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Type *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value, parentId: '' })}
                className="input-field"
              >
                {areaTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Area */}
            {getParentAreas().length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Area {formData.type !== 'STATE' && '*'}
                </label>
                <select
                  required={formData.type !== 'STATE'}
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Parent Area</option>
                  {getParentAreas().map(parent => (
                    <option key={parent._id} value={parent._id}>
                      {parent.name} ({parent.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Area Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Code (Optional)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input-field"
                placeholder="e.g., UP, LKO, 101"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-field"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Population (Optional)
                </label>
                <input
                  type="number"
                  value={formData.metadata.population}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    metadata: { ...formData.metadata, population: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Voters (Optional)
                </label>
                <input
                  type="number"
                  value={formData.metadata.totalVoters}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    metadata: { ...formData.metadata, totalVoters: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., 30000"
                />
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude (Map)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.latitude}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    coordinates: { ...formData.coordinates, latitude: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., 26.8467"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude (Map)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coordinates.longitude}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    coordinates: { ...formData.coordinates, longitude: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., 80.9462"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Google Maps pe area search karo, right-click karo aur coordinates copy karo.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Updating...' : 'Update Area'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
