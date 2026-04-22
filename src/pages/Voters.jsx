import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiPlus, FiSearch, FiDownload, FiUpload, FiEye, FiEdit2, FiTrash2, FiX } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Voters() {
  const { permissions, role } = useAuthStore()
  const navigate = useNavigate()
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    caste: '',
    religion: '',
    consentStatus: '',
    areaId: ''
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  
  // Area filters
  const [areas, setAreas] = useState([])
  const [states, setStates] = useState([])
  const [selectedFilterState, setSelectedFilterState] = useState('')
  const [filterDistricts, setFilterDistricts] = useState([])
  const [selectedFilterDistrict, setSelectedFilterDistrict] = useState('')
  const [filterTehsils, setFilterTehsils] = useState([])
  const [selectedFilterTehsil, setSelectedFilterTehsil] = useState('')
  const [filterBlocks, setFilterBlocks] = useState([])
  const [selectedFilterBlock, setSelectedFilterBlock] = useState('')

  useEffect(() => {
    fetchStatesForFilter()
  }, [])
  
  const fetchStatesForFilter = async () => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'STATE', limit: 100 } })
      if (data.success) {
        setStates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch states:', error)
    }
  }
  
  const handleFilterStateChange = async (stateId) => {
    setSelectedFilterState(stateId)
    setSelectedFilterDistrict('')
    setSelectedFilterTehsil('')
    setSelectedFilterBlock('')
    setFilters({ ...filters, areaId: stateId })
    setFilterDistricts([])
    setFilterTehsils([])
    setFilterBlocks([])
    
    if (stateId) {
      try {
        const { data } = await api.get('/areas', { params: { type: 'DISTRICT', parentId: stateId, limit: 100 } })
        if (data.success) {
          setFilterDistricts(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch districts:', error)
      }
    }
  }
  
  const FILTER_DISTRICT_BLOCKS = '__DISTRICT_BLOCKS__'

  const handleFilterDistrictChange = async (districtId) => {
    setSelectedFilterDistrict(districtId)
    setSelectedFilterTehsil('')
    setSelectedFilterBlock('')
    setFilters({ ...filters, areaId: districtId })
    setFilterTehsils([])
    setFilterBlocks([])

    if (!districtId) return
    try {
      const { data } = await api.get('/areas', { params: { type: 'TEHSIL', parentId: districtId, limit: 100 } })
      const tehsils = data.success ? data.data || [] : []
      setFilterTehsils(tehsils)
      if (tehsils.length === 0) {
        const { data: b } = await api.get('/areas', { params: { type: 'BLOCK', parentId: districtId, limit: 100 } })
        if (b.success) {
          setFilterBlocks(b.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch tehsils:', error)
    }
  }

  const handleFilterTehsilChange = async (value) => {
    setSelectedFilterBlock('')
    setFilterBlocks([])

    if (value === '' || value === FILTER_DISTRICT_BLOCKS) {
      setSelectedFilterTehsil(value === FILTER_DISTRICT_BLOCKS ? FILTER_DISTRICT_BLOCKS : '')
      setFilters({ ...filters, areaId: selectedFilterDistrict })
      if (selectedFilterDistrict) {
        try {
          const { data } = await api.get('/areas', {
            params: { type: 'BLOCK', parentId: selectedFilterDistrict, limit: 100 },
          })
          if (data.success) {
            setFilterBlocks(data.data || [])
          }
        } catch (error) {
          console.error('Failed to fetch blocks:', error)
        }
      }
      return
    }

    setSelectedFilterTehsil(value)
    setFilters({ ...filters, areaId: value })
    try {
      const { data } = await api.get('/areas', { params: { type: 'BLOCK', parentId: value, limit: 100 } })
      if (data.success) {
        setFilterBlocks(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
    }
  }
  
  const handleFilterBlockChange = (blockId) => {
    setSelectedFilterBlock(blockId)
    setFilters({ ...filters, areaId: blockId })
  }

  useEffect(() => {
    fetchVoters()
  }, [pagination.page])

  const fetchVoters = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      }
      
      const { data } = await api.get('/voters', { params })
      if (data.success) {
        setVoters(data.data || [])
        setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }))
      }
    } catch (error) {
      console.error('Fetch voters error:', error)
      toast.error('Failed to load voters')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchVoters()
  }

  const canCreate = permissions?.voters?.create || role === 'SUPER_ADMIN'
  const canEdit = permissions?.voters?.edit || role === 'SUPER_ADMIN'
  const canExport = permissions?.voters?.export || role === 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Voters</h1>
          <p className="text-gray-600">Manage voter database</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.open('/samples/voter-template.csv', '_blank')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Sample File</span>
          </button>
          {canCreate && (
            <>
              <button 
                onClick={() => navigate('/voters/bulk-upload')}
                className="btn-secondary flex items-center gap-2"
              >
                <FiUpload className="w-4 h-4" />
                <span className="hidden sm:inline">Bulk Upload</span>
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Voter</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="search"
                placeholder="Search by name, phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field"
              />
            </div>
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="input-field"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={filters.consentStatus}
              onChange={(e) => setFilters({ ...filters, consentStatus: e.target.value })}
              className="input-field"
            >
              <option value="">All Consent</option>
              <option value="GIVEN">Given</option>
              <option value="NOT_GIVEN">Not Given</option>
              <option value="PENDING">Pending</option>
            </select>
            <button onClick={handleSearch} className="btn-primary">
              <FiSearch className="w-4 h-4 mr-2" />
              Search
            </button>
          </div>
          
          {/* Area Filters */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">📍 Filter by Area:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <select
                value={selectedFilterState}
                onChange={(e) => handleFilterStateChange(e.target.value)}
                className="input-field"
              >
                <option value="">All States</option>
                {states.map(state => (
                  <option key={state._id} value={state._id}>{state.name}</option>
                ))}
              </select>
              <select
                value={selectedFilterDistrict}
                onChange={(e) => handleFilterDistrictChange(e.target.value)}
                className="input-field"
                disabled={!selectedFilterState}
              >
                <option value="">All Districts</option>
                {filterDistricts.map(district => (
                  <option key={district._id} value={district._id}>{district.name}</option>
                ))}
              </select>
              <select
                value={selectedFilterTehsil}
                onChange={(e) => handleFilterTehsilChange(e.target.value)}
                className="input-field"
                disabled={!selectedFilterDistrict}
              >
                <option value="">All Tehsils</option>
                {filterTehsils.length > 0 && (
                  <option value={FILTER_DISTRICT_BLOCKS}>No tehsil (district blocks)</option>
                )}
                {filterTehsils.map(tehsil => (
                  <option key={tehsil._id} value={tehsil._id}>{tehsil.name}</option>
                ))}
              </select>
              <select
                value={selectedFilterBlock}
                onChange={(e) => handleFilterBlockChange(e.target.value)}
                className="input-field"
                disabled={!selectedFilterDistrict || filterBlocks.length === 0}
              >
                <option value="">All Blocks</option>
                {filterBlocks.map(block => (
                  <option key={block._id} value={block._id}>{block.name}</option>
                ))}
              </select>
              {filters.areaId && (
                <button
                  onClick={() => {
                    setSelectedFilterState('')
                    setSelectedFilterDistrict('')
                    setSelectedFilterTehsil('')
                    setSelectedFilterBlock('')
                    setFilters({ ...filters, areaId: '' })
                    setFilterDistricts([])
                    setFilterTehsils([])
                    setFilterBlocks([])
                  }}
                  className="btn-secondary"
                >
                  Clear Area Filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Voters Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : voters.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No voters found</p>
          {canCreate && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary mt-4"
            >
              Add First Voter
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Age</th>
                <th className="text-left py-3 px-4">Gender</th>
                <th className="text-left py-3 px-4">Area</th>
                <th className="text-left py-3 px-4">Consent</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {voters.map((voter) => (
                <tr key={voter._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-800">{voter.name || '—'}</p>
                      {voter.relativeName && (
                        <p className="text-sm text-gray-500">पिता/पति: {voter.relativeName}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{voter.phone || '-'}</td>
                  <td className="py-3 px-4">{voter.age || '-'}</td>
                  <td className="py-3 px-4">{voter.gender || '-'}</td>
                  <td className="py-3 px-4">
                    {voter.areaId ? (
                      <div className="text-sm">
                        <p className="font-medium text-gray-800">{voter.areaId.name}</p>
                        <p className="text-gray-500">{voter.areaId.type}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      voter.consentStatus === 'GIVEN' ? 'badge-success' :
                      voter.consentStatus === 'NOT_GIVEN' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {voter.consentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/voters/${voter._id}`}
                        className="text-primary-600 hover:text-primary-700"
                        title="View"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/voters/${voter._id}?edit=1`}
                          className="text-slate-600 hover:text-primary-600"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="btn-secondary"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Voter Modal */}
      {showAddModal && (
        <AddVoterModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchVoters()
          }}
        />
      )}
    </div>
  )
}


// Add Voter Modal Component
function AddVoterModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    address: {
      street: '',
      landmark: '',
      pincode: ''
    },
    occupation: '',
    voterIdNumber: '',
    caste: '',
    religion: '',
    education: '',
    supportLevel: 'UNKNOWN',
    consentStatus: 'NOT_GIVEN',
    areaId: '',
    problems: []
  })
  const [submitting, setSubmitting] = useState(false)
  
  // Problems management
  const [showAddProblem, setShowAddProblem] = useState(false)
  const [newProblem, setNewProblem] = useState({
    category: 'HOUSING',
    description: '',
    customCategory: '',
    priority: 'MEDIUM'
  })
  
  const problemCategories = [
    { value: 'HOUSING', label: 'घर (Housing)' },
    { value: 'WATER', label: 'पानी (Water)' },
    { value: 'ELECTRICITY', label: 'बिजली (Electricity)' },
    { value: 'ROAD', label: 'सड़क (Road)' },
    { value: 'DRAINAGE', label: 'नाली (Drainage)' },
    { value: 'SANITATION', label: 'स्वच्छता (Sanitation)' },
    { value: 'HEALTH', label: 'स्वास्थ्य (Health)' },
    { value: 'EDUCATION', label: 'शिक्षा (Education)' },
    { value: 'EMPLOYMENT', label: 'रोजगार (Employment)' },
    { value: 'PENSION', label: 'पेंशन (Pension)' },
    { value: 'RATION_CARD', label: 'राशन कार्ड (Ration Card)' },
    { value: 'GOVERNMENT_SCHEME', label: 'सरकारी योजना (Govt Scheme)' },
    { value: 'CUSTOM', label: 'अन्य (Other)' }
  ]
  
  const handleAddProblem = () => {
    if (!newProblem.description.trim()) {
      toast.error('Please enter problem description')
      return
    }
    
    if (newProblem.category === 'CUSTOM' && !newProblem.customCategory.trim()) {
      toast.error('Please enter custom category name')
      return
    }
    
    const problem = {
      ...newProblem,
      status: 'PENDING',
      reportedDate: new Date()
    }
    
    setFormData({
      ...formData,
      problems: [...formData.problems, problem]
    })
    
    setNewProblem({
      category: 'HOUSING',
      description: '',
      customCategory: '',
      priority: 'MEDIUM'
    })
    setShowAddProblem(false)
    toast.success('Problem added')
  }
  
  const handleRemoveProblem = (index) => {
    const updatedProblems = formData.problems.filter((_, i) => i !== index)
    setFormData({ ...formData, problems: updatedProblems })
  }
  
  // Area cascading dropdowns
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [tehsils, setTehsils] = useState([])
  const [blocks, setBlocks] = useState([])
  const [villages, setVillages] = useState([])
  const [booths, setBooths] = useState([])
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTehsil, setSelectedTehsil] = useState('')
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedVillage, setSelectedVillage] = useState('')
  
  // Fetch states on mount
  useEffect(() => {
    fetchStates()
  }, [])
  
  const fetchStates = async () => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'STATE', limit: 100 } })
      if (data.success) {
        setStates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch states:', error)
    }
  }
  
  const fetchDistricts = async (stateId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'DISTRICT', parentId: stateId, limit: 100 } })
      if (data.success) {
        setDistricts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    }
  }
  
  const ADD_MODAL_DISTRICT_BLOCKS = '__DISTRICT_BLOCKS__'

  const fetchTehsils = async (districtId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'TEHSIL', parentId: districtId, limit: 100 } })
      const list = data.success ? data.data || [] : []
      setTehsils(list)
      return list
    } catch (error) {
      console.error('Failed to fetch tehsils:', error)
      setTehsils([])
      return []
    }
  }

  const fetchBlocks = async (parentAreaId) => {
    if (!parentAreaId) {
      setBlocks([])
      return
    }
    try {
      const { data } = await api.get('/areas', { params: { type: 'BLOCK', parentId: parentAreaId, limit: 100 } })
      if (data.success) {
        setBlocks(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
    }
  }
  
  const fetchVillages = async (blockId) => {
    try {
      const { data } = await api.get('/areas', { params: { parentId: blockId, limit: 100 } })
      if (data.success) {
        // Filter VILLAGE and WARD types
        const villageWards = (data.data || []).filter(a => a.type === 'VILLAGE' || a.type === 'WARD')
        setVillages(villageWards)
      }
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    }
  }
  
  const fetchBooths = async (villageId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'BOOTH', parentId: villageId, limit: 200 } })
      if (data.success) {
        setBooths(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch booths:', error)
    }
  }
  
  const handleStateChange = (stateId) => {
    setSelectedState(stateId)
    setSelectedDistrict('')
    setSelectedTehsil('')
    setSelectedBlock('')
    setSelectedVillage('')
    setFormData({ ...formData, areaId: '' })
    setDistricts([])
    setTehsils([])
    setBlocks([])
    setVillages([])
    setBooths([])
    if (stateId) fetchDistricts(stateId)
  }
  
  const handleDistrictChange = async (districtId) => {
    setSelectedDistrict(districtId)
    setSelectedTehsil('')
    setSelectedBlock('')
    setSelectedVillage('')
    setFormData({ ...formData, areaId: '' })
    setTehsils([])
    setBlocks([])
    setVillages([])
    setBooths([])
    if (!districtId) return
    const tehsilList = await fetchTehsils(districtId)
    if (tehsilList.length === 0) {
      await fetchBlocks(districtId)
    }
  }

  const handleTehsilChange = (value) => {
    setSelectedBlock('')
    setSelectedVillage('')
    setFormData({ ...formData, areaId: '' })
    setVillages([])
    setBooths([])
    if (value === '' || value === ADD_MODAL_DISTRICT_BLOCKS) {
      setSelectedTehsil(value === ADD_MODAL_DISTRICT_BLOCKS ? ADD_MODAL_DISTRICT_BLOCKS : '')
      setBlocks([])
      if (selectedDistrict) {
        fetchBlocks(selectedDistrict)
      }
      return
    }
    setSelectedTehsil(value)
    setBlocks([])
    fetchBlocks(value)
  }
  
  const handleBlockChange = (blockId) => {
    setSelectedBlock(blockId)
    setSelectedVillage('')
    setFormData({ ...formData, areaId: '' })
    setVillages([])
    setBooths([])
    if (blockId) fetchVillages(blockId)
  }
  
  const handleVillageChange = (villageId) => {
    setSelectedVillage(villageId)
    setFormData({ ...formData, areaId: '' })
    setBooths([])
    if (villageId) fetchBooths(villageId)
  }
  
  const handleBoothChange = (boothId) => {
    setFormData({ ...formData, areaId: boothId })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/voters', formData)
      if (data.success) {
        toast.success('Voter added successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add voter')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add New Voter</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    pattern="[0-9]{10}"
                    placeholder="10 digit number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="input-field"
                    min="18"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <textarea
                    value={formData.address.street}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                    className="input-field"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={formData.address.landmark}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, landmark: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                    className="input-field"
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>
            </div>

            {/* Area Selection - Cascading Dropdowns */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Area / Location (Optional)
              </h3>
              <div className="rounded-lg bg-blue-50 p-3 mb-4">
                <p className="text-sm text-blue-700">
                  📍 State → District → (optional Tehsil) → Block → Village/Ward → Booth. अगर तहसील नहीं, ब्लॉक सीधे
                  जिले से चुनें।
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State (राज्य)
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state._id} value={state._id}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District (जिला)
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="input-field"
                    disabled={!selectedState}
                  >
                    <option value="">Select District</option>
                    {districts.map(district => (
                      <option key={district._id} value={district._id}>{district.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tehsil (तहसील) — optional
                  </label>
                  <select
                    value={selectedTehsil}
                    onChange={(e) => handleTehsilChange(e.target.value)}
                    className="input-field"
                    disabled={!selectedDistrict}
                  >
                    <option value="">Select Tehsil</option>
                    {tehsils.length > 0 && (
                      <option value={ADD_MODAL_DISTRICT_BLOCKS}>No tehsil — blocks under district</option>
                    )}
                    {tehsils.map(tehsil => (
                      <option key={tehsil._id} value={tehsil._id}>{tehsil.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block (ब्लॉक)
                  </label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    className="input-field"
                    disabled={!selectedDistrict || blocks.length === 0}
                  >
                    <option value="">Select Block</option>
                    {blocks.map(block => (
                      <option key={block._id} value={block._id}>{block.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village / Ward (गाँव/वार्ड)
                  </label>
                  <select
                    value={selectedVillage}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    className="input-field"
                    disabled={!selectedBlock}
                  >
                    <option value="">Select Village/Ward</option>
                    {villages.map(village => (
                      <option key={village._id} value={village._id}>
                        {village.name} ({village.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booth (बूथ)
                  </label>
                  <select
                    value={formData.areaId}
                    onChange={(e) => handleBoothChange(e.target.value)}
                    className="input-field"
                    disabled={!selectedVillage}
                  >
                    <option value="">Select Booth</option>
                    {booths.map(booth => (
                      <option key={booth._id} value={booth._id}>
                        {booth.name} {booth.code ? `(${booth.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.areaId && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-green-600">
                      ✓ Area selected successfully
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voter ID Number
                  </label>
                  <input
                    type="text"
                    value={formData.voterIdNumber}
                    onChange={(e) => setFormData({ ...formData, voterIdNumber: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caste
                  </label>
                  <select
                    value={formData.caste}
                    onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Caste</option>
                    <option value="GENERAL">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Religion
                  </label>
                  <select
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Religion</option>
                    <option value="HINDU">Hindu</option>
                    <option value="MUSLIM">Muslim</option>
                    <option value="CHRISTIAN">Christian</option>
                    <option value="SIKH">Sikh</option>
                    <option value="BUDDHIST">Buddhist</option>
                    <option value="JAIN">Jain</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education
                  </label>
                  <select
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Education</option>
                    <option value="ILLITERATE">Illiterate</option>
                    <option value="PRIMARY">Primary</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="HIGHER_SECONDARY">Higher Secondary</option>
                    <option value="GRADUATE">Graduate</option>
                    <option value="POST_GRADUATE">Post Graduate</option>
                    <option value="PROFESSIONAL">Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Level
                  </label>
                  <select
                    value={formData.supportLevel}
                    onChange={(e) => setFormData({ ...formData, supportLevel: e.target.value })}
                    className="input-field"
                  >
                    <option value="UNKNOWN">Unknown</option>
                    <option value="STRONG_SUPPORTER">Strong Supporter</option>
                    <option value="SUPPORTER">Supporter</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="OPPONENT">Opponent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consent Status
                  </label>
                  <select
                    value={formData.consentStatus}
                    onChange={(e) => setFormData({ ...formData, consentStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="NOT_GIVEN">Not Given</option>
                    <option value="GIVEN">Given</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Problems/Issues Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Problems / Issues (Optional)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProblem(!showAddProblem)}
                  className="btn-secondary text-sm"
                >
                  <FiPlus className="w-4 h-4 mr-1" />
                  Add Problem
                </button>
              </div>

              {/* Add Problem Form */}
              {showAddProblem && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Problem Category
                      </label>
                      <select
                        value={newProblem.category}
                        onChange={(e) => setNewProblem({ ...newProblem, category: e.target.value })}
                        className="input-field"
                      >
                        {problemCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newProblem.priority}
                        onChange={(e) => setNewProblem({ ...newProblem, priority: e.target.value })}
                        className="input-field"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>
                  
                  {newProblem.category === 'CUSTOM' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Category Name
                      </label>
                      <input
                        type="text"
                        value={newProblem.customCategory}
                        onChange={(e) => setNewProblem({ ...newProblem, customCategory: e.target.value })}
                        className="input-field"
                        placeholder="Enter custom category (e.g., Transport, Legal)"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Problem Description
                    </label>
                    <textarea
                      value={newProblem.description}
                      onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                      className="input-field"
                      rows="2"
                      placeholder="Describe the problem in detail..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddProblem}
                      className="btn-primary text-sm"
                    >
                      Add Problem
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddProblem(false)
                        setNewProblem({ category: 'HOUSING', description: '', customCategory: '', priority: 'MEDIUM' })
                      }}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Problems List */}
              {formData.problems.length > 0 && (
                <div className="space-y-2">
                  {formData.problems.map((problem, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            problem.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                            problem.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {problem.priority}
                          </span>
                          <span className="font-medium text-sm text-gray-800">
                            {problem.category === 'CUSTOM' ? problem.customCategory : 
                             problemCategories.find(c => c.value === problem.category)?.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{problem.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProblem(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {formData.problems.length === 0 && !showAddProblem && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No problems added yet. Click "Add Problem" to add voter's issues.
                </p>
              )}
            </div>

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
                {submitting ? 'Adding...' : 'Add Voter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Bulk Upload Modal Component
function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState([])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // You can add CSV parsing here for preview
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
      const { data } = await api.post('/voters/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) {
        toast.success(`${data.data.imported} voters imported successfully`)
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
      <div className="bg-white rounded-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bulk Upload Voters</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Download the sample CSV file template</li>
                <li>Fill in voter details in the template</li>
                <li>Upload the completed file</li>
                <li>Required fields: Name, Phone, Gender</li>
              </ul>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
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
