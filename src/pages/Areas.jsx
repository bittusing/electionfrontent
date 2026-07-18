import { useState, useEffect, Fragment } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFlag, FiSearch, FiUpload, FiDownload, FiMapPin } from 'react-icons/fi'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import PaginationBar from '../components/PaginationBar'

const AREA_TYPES = ['STATE', 'DISTRICT', 'TEHSIL', 'BLOCK', 'VILLAGE', 'WARD', 'BOOTH']

const TYPE_BADGE_COLOR = {
  STATE: 'bg-blue-100 text-blue-700',
  DISTRICT: 'bg-indigo-100 text-indigo-700',
  TEHSIL: 'bg-violet-100 text-violet-700',
  BLOCK: 'bg-cyan-100 text-cyan-700',
  VILLAGE: 'bg-green-100 text-green-700',
  WARD: 'bg-teal-100 text-teal-700',
  BOOTH: 'bg-red-100 text-red-700',
}

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
    <div className="space-y-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input-field !py-1.5 !px-2 text-xs w-auto"
      >
        <option value="NONE">Not deployed</option>
        <option value="PARTIAL">Partial coverage</option>
        <option value="COMPLETE">Fully covered</option>
      </select>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="input-field !py-1.5 !px-2 text-xs w-auto"
        placeholder="Note (optional)"
      />
      <button type="button" onClick={save} disabled={saving} className="btn-primary !py-1.5 !px-2 text-xs w-full">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

export default function Areas() {
  const { permissions } = useAuthStore()
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type: '', status: 'ACTIVE', search: '' })
  const [searchInput, setSearchInput] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedArea, setSelectedArea] = useState(null)
  const [expandedSignageId, setExpandedSignageId] = useState(null)

  // All areas (unpaginated, capped) — used to populate the parent dropdowns in Add/Edit modals
  const [allAreasForParentPicker, setAllAreasForParentPicker] = useState([])

  // Cascading location filter (State -> District -> Tehsil -> Block), mirrors Voters page
  const [filterStates, setFilterStates] = useState([])
  const [selectedFilterState, setSelectedFilterState] = useState('')
  const [filterDistricts, setFilterDistricts] = useState([])
  const [selectedFilterDistrict, setSelectedFilterDistrict] = useState('')
  const [filterTehsils, setFilterTehsils] = useState([])
  const [selectedFilterTehsil, setSelectedFilterTehsil] = useState('')
  const [filterBlocks, setFilterBlocks] = useState([])
  const [selectedFilterBlock, setSelectedFilterBlock] = useState('')
  const [ancestorId, setAncestorId] = useState('')

  useEffect(() => {
    fetchFilterStates()
    fetchAllAreasForParentPicker()
  }, [])

  useEffect(() => {
    fetchAreas(pagination.page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filter.type, filter.status, filter.search, ancestorId])

  const fetchFilterStates = async () => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'STATE', limit: 200 } })
      if (data.success) setFilterStates(data.data || [])
    } catch (error) {
      console.error('Failed to fetch states:', error)
    }
  }

  /** Small cap — only used to populate parent-selection dropdowns in the Add/Edit modals. */
  const fetchAllAreasForParentPicker = async () => {
    try {
      const { data } = await api.get('/areas', { params: { limit: 500, status: '' } })
      if (data.success) setAllAreasForParentPicker(data.data || [])
    } catch (error) {
      console.error('Failed to fetch areas for parent picker:', error)
    }
  }

  const fetchAreas = async (page = pagination.page) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: pagination.limit,
        ...(filter.type && { type: filter.type }),
        ...(filter.status && { status: filter.status }),
        ...(filter.search && { search: filter.search }),
        ...(ancestorId && { ancestorId }),
      }
      const { data } = await api.get('/areas', { params })
      if (data.success) {
        setAreas(data.data || [])
        setPagination((prev) => ({ ...prev, page, total: data.pagination?.total ?? prev.total }))
      }
    } catch (error) {
      toast.error('Failed to fetch areas')
    } finally {
      setLoading(false)
    }
  }

  const refreshCurrentPage = () => {
    fetchAreas(pagination.page)
    fetchAllAreasForParentPicker()
  }

  const handleSearchSubmit = () => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    setFilter((prev) => ({ ...prev, search: searchInput.trim() }))
  }

  const handlePageChange = (page) => {
    if (page < 1 || page === pagination.page) return
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleLimitChange = (limit) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }))
  }

  const handleFilterStateChange = async (stateId) => {
    setSelectedFilterState(stateId)
    setSelectedFilterDistrict('')
    setSelectedFilterTehsil('')
    setSelectedFilterBlock('')
    setFilterDistricts([])
    setFilterTehsils([])
    setFilterBlocks([])
    setAncestorId(stateId)
    setPagination((prev) => ({ ...prev, page: 1 }))

    if (stateId) {
      try {
        const { data } = await api.get('/areas', { params: { type: 'DISTRICT', parentId: stateId, limit: 500 } })
        if (data.success) setFilterDistricts(data.data || [])
      } catch (error) {
        console.error('Failed to fetch districts:', error)
      }
    }
  }

  const handleFilterDistrictChange = async (districtId) => {
    setSelectedFilterDistrict(districtId)
    setSelectedFilterTehsil('')
    setSelectedFilterBlock('')
    setFilterTehsils([])
    setFilterBlocks([])
    setAncestorId(districtId || selectedFilterState)
    setPagination((prev) => ({ ...prev, page: 1 }))

    if (!districtId) return
    try {
      const { data } = await api.get('/areas', { params: { type: 'TEHSIL', parentId: districtId, limit: 500 } })
      const tehsils = data.success ? data.data || [] : []
      setFilterTehsils(tehsils)
      if (tehsils.length === 0) {
        const { data: b } = await api.get('/areas', { params: { type: 'BLOCK', parentId: districtId, limit: 500 } })
        if (b.success) setFilterBlocks(b.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tehsils:', error)
    }
  }

  const handleFilterTehsilChange = async (tehsilId) => {
    setSelectedFilterTehsil(tehsilId)
    setSelectedFilterBlock('')
    setFilterBlocks([])
    setAncestorId(tehsilId || selectedFilterDistrict || selectedFilterState)
    setPagination((prev) => ({ ...prev, page: 1 }))

    if (!tehsilId) {
      if (selectedFilterDistrict) {
        const { data } = await api.get('/areas', { params: { type: 'BLOCK', parentId: selectedFilterDistrict, limit: 500 } })
        if (data.success) setFilterBlocks(data.data || [])
      }
      return
    }
    try {
      const { data } = await api.get('/areas', { params: { type: 'BLOCK', parentId: tehsilId, limit: 500 } })
      if (data.success) setFilterBlocks(data.data || [])
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
    }
  }

  const handleFilterBlockChange = (blockId) => {
    setSelectedFilterBlock(blockId)
    setAncestorId(blockId || selectedFilterTehsil || selectedFilterDistrict || selectedFilterState)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const clearLocationFilter = () => {
    setSelectedFilterState('')
    setSelectedFilterDistrict('')
    setSelectedFilterTehsil('')
    setSelectedFilterBlock('')
    setFilterDistricts([])
    setFilterTehsils([])
    setFilterBlocks([])
    setAncestorId('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleEdit = (area) => {
    setSelectedArea(area)
    setShowEditModal(true)
  }

  const handleDelete = async (areaId, areaName) => {
    if (!confirm(`Are you sure you want to delete "${areaName}"?`)) return
    try {
      const { data } = await api.delete(`/areas/${areaId}`)
      if (data.success) {
        toast.success('Area deleted successfully')
        refreshCurrentPage()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete area')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Area Management</h1>
          <p className="text-gray-600 mt-1">State → District → Tehsil → Block → Village/Ward → Booth</p>
        </div>
        {permissions?.areas?.create && (
          <div className="flex gap-2">
            <button
              onClick={() => window.open('/samples/area-template.csv', '_blank')}
              className="btn-secondary flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              <span className="hidden sm:inline">Sample File</span>
            </button>
            <button onClick={() => setShowBulkUploadModal(true)} className="btn-secondary flex items-center gap-2">
              <FiUpload className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Area</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <input
              type="search"
              placeholder="Search by name or code…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="input-field"
            />
          </div>
          <select
            value={filter.type}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, type: e.target.value }))
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="input-field"
          >
            <option value="">All Types</option>
            {AREA_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, status: e.target.value }))
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <FiMapPin className="w-4 h-4 text-primary-500" />
              Drill into a location:
            </p>
            <button onClick={handleSearchSubmit} className="btn-primary !py-1.5 !px-3 text-sm">
              <FiSearch className="w-4 h-4 mr-1.5" />
              Search
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select value={selectedFilterState} onChange={(e) => handleFilterStateChange(e.target.value)} className="input-field">
              <option value="">All States</option>
              {filterStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <select
              value={selectedFilterDistrict}
              onChange={(e) => handleFilterDistrictChange(e.target.value)}
              className="input-field"
              disabled={!selectedFilterState}
            >
              <option value="">All Districts</option>
              {filterDistricts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select
              value={selectedFilterTehsil}
              onChange={(e) => handleFilterTehsilChange(e.target.value)}
              className="input-field"
              disabled={!selectedFilterDistrict}
            >
              <option value="">All Tehsils</option>
              {filterTehsils.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <select
              value={selectedFilterBlock}
              onChange={(e) => handleFilterBlockChange(e.target.value)}
              className="input-field"
              disabled={!selectedFilterDistrict || filterBlocks.length === 0}
            >
              <option value="">All Blocks</option>
              {filterBlocks.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            {ancestorId && (
              <button onClick={clearLocationFilter} className="btn-secondary">Clear Location Filter</button>
            )}
          </div>
        </div>
      </div>

      {/* Areas Table */}
      {loading ? (
        <div className="card overflow-hidden p-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-12 border-b border-gray-100 last:border-0" style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      ) : areas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No areas found</p>
          {permissions?.areas?.create && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">Add First Area</button>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Parent</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-right">Voters</th>
                <th className="py-3 px-4 text-right">Workers</th>
                <th className="py-3 px-4">Map</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <Fragment key={area._id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50/80 align-top">
                    <td className="py-3 px-4 font-medium text-gray-800">{area.name}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${TYPE_BADGE_COLOR[area.type] || 'badge-gray'}`}>{area.type}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {area.parentId ? `${area.parentId.name} (${area.parentId.type})` : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{area.code || '—'}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-gray-700">{area.metadata?.totalVoters || 0}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-gray-700">{area.stats?.activeWorkers || 0}</td>
                    <td className="py-3 px-4">
                      <span className={area.coordinates?.latitude ? 'text-green-600' : 'text-amber-500'}>
                        {area.coordinates?.latitude ? 'Set' : 'Not set'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${area.status === 'ACTIVE' ? 'badge-success' : 'badge-gray'}`}>{area.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {permissions?.areas?.edit && (
                          <button onClick={() => handleEdit(area)} className="text-slate-600 hover:text-primary-600" title="Edit">
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                        {permissions?.areas?.delete && (
                          <button onClick={() => handleDelete(area._id, area.name)} className="text-red-500 hover:text-red-700" title="Delete">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                        {['VILLAGE', 'WARD', 'BOOTH'].includes(area.type) && permissions?.voters?.edit && (
                          <button
                            onClick={() => setExpandedSignageId(expandedSignageId === area._id ? null : area._id)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Field signage"
                          >
                            <FiFlag className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedSignageId === area._id && (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <td colSpan={9} className="bg-primary-50/30 px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 mb-2">
                            <FiFlag className="text-primary-600" />
                            Field: posters / village signage — {area.name}
                          </div>
                          <div className="max-w-sm">
                            <FieldCampaignSignage area={area} onSaved={refreshCurrentPage} />
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total > 0 && (
        <PaginationBar
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          itemLabel="areas"
        />
      )}

      {showAddModal && (
        <AddAreaModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            refreshCurrentPage()
          }}
          existingAreas={allAreasForParentPicker}
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
            refreshCurrentPage()
          }}
          existingAreas={allAreasForParentPicker}
        />
      )}

      {showBulkUploadModal && (
        <BulkUploadAreaModal
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false)
            refreshCurrentPage()
            fetchFilterStates()
          }}
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
                  पहले <strong>STATE</strong> बनाएं (जैसे: Uttar Pradesh), फिर बाकी areas add करें। सैकड़ों areas
                  एक साथ चाहिए तो ऊपर <strong>Bulk Upload</strong> इस्तेमाल करें।
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

// Bulk Upload Area Modal Component
function BulkUploadAreaModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [resultSummary, setResultSummary] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResultSummary(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/areas/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) {
        toast.success(data.message || 'Import complete')
        setResultSummary(data.data)
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bulk Upload Areas</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>One row = one area, at <strong>any</strong> level (state, district, block, booth, etc.)</li>
                <li>Columns: <code className="bg-white px-1 rounded">type</code>, <code className="bg-white px-1 rounded">name</code>, <code className="bg-white px-1 rounded">code</code>, <code className="bg-white px-1 rounded">population</code>, <code className="bg-white px-1 rounded">totalVoters</code>, <code className="bg-white px-1 rounded">latitude</code>, <code className="bg-white px-1 rounded">longitude</code></li>
                <li>Path columns to auto-create the chain above each row: <code className="bg-white px-1 rounded">state</code>, <code className="bg-white px-1 rounded">district</code>, <code className="bg-white px-1 rounded">tehsil</code> (optional), <code className="bg-white px-1 rounded">block</code>, <code className="bg-white px-1 rounded">villageWard</code></li>
                <li>Example: a BOOTH row with state/district/block/villageWard filled in will auto-create the state, district, block and village/ward too if they don&apos;t already exist — no need to add them as separate rows first</li>
                <li>Re-uploading is safe — existing areas (matched by type + name + parent) are updated, not duplicated</li>
              </ul>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV or Excel File
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="input-field"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {resultSummary && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-900">
                <p className="font-semibold">
                  {resultSummary.created} created · {resultSummary.updated} updated
                  {resultSummary.errors?.length > 0 && ` · ${resultSummary.errors.length} error(s)`}
                </p>
                {resultSummary.errors?.length > 0 && (
                  <ul className="mt-2 max-h-32 overflow-y-auto space-y-0.5 text-xs text-red-700">
                    {resultSummary.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.message}</li>
                    ))}
                    {resultSummary.errors.length > 20 && <li>…and {resultSummary.errors.length - 20} more</li>}
                  </ul>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Close
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn-primary flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload & Import'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
