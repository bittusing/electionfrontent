import { useState, useEffect } from 'react'
import { FiPlus, FiPhone, FiMail, FiX, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

const FIELD_ROLES = ['BLOCK_MANAGER', 'WARD_MANAGER', 'BOOTH_WORKER', 'VOLUNTEER']

export default function Workers() {
  const { permissions, hasPermission } = useAuthStore()
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ role: '', status: 'ACTIVE', search: '' })
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchWorkers()
  }, [filter.role, filter.status])

  const fetchWorkers = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.role) params.append('role', filter.role)
      if (filter.status) params.append('status', filter.status)

      const { data } = await api.get(`/auth/users?${params}`)
      if (data.success) {
        const fieldWorkers = (data.data || []).filter(u => FIELD_ROLES.includes(u.role))
        setWorkers(fieldWorkers)
      }
    } catch (error) {
      toast.error('Failed to fetch workers')
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkers = workers.filter(w => {
    if (!filter.search) return true
    const term = filter.search.toLowerCase()
    return (
      w.name?.toLowerCase().includes(term) ||
      w.phone?.includes(term) ||
      w.email?.toLowerCase().includes(term)
    )
  })

  const roleStats = FIELD_ROLES.map(r => ({
    role: r,
    label: r.replace(/_/g, ' '),
    count: workers.filter(w => w.role === r).length
  }))

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Field Workers</h1>
          <p className="text-gray-600 mt-1">Manage campaign field team members</p>
        </div>
        {hasPermission('workers', 'create') && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <FiPlus className="mr-2" />
            Add Worker
          </button>
        )}
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {roleStats.map(s => (
          <div
            key={s.role}
            onClick={() => setFilter(prev => ({ ...prev, role: prev.role === s.role ? '' : s.role }))}
            className={`card cursor-pointer transition-all py-4 text-center ${
              filter.role === s.role ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
            }`}
          >
            <p className="text-2xl font-bold text-gray-800">{s.count}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filter.search}
              onChange={e => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="input-field pl-10"
              placeholder="Search by name, phone, email..."
            />
          </div>
          <select
            value={filter.role}
            onChange={e => setFilter(prev => ({ ...prev, role: e.target.value }))}
            className="input-field"
          >
            <option value="">All Field Roles</option>
            {FIELD_ROLES.map(role => (
              <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filter.status}
            onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="input-field"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">No field workers found</p>
          <p className="text-gray-400 text-sm">
            {filter.search || filter.role ? 'Try changing the filters' : 'Add workers to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map(worker => (
            <WorkerCard key={worker._id} worker={worker} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddWorkerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchWorkers()
          }}
        />
      )}
    </div>
  )
}

function WorkerCard({ worker }) {
  const roleBadgeColors = {
    BLOCK_MANAGER: 'bg-blue-100 text-blue-700',
    WARD_MANAGER: 'bg-indigo-100 text-indigo-700',
    BOOTH_WORKER: 'bg-green-100 text-green-700',
    VOLUNTEER: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
            <span className="text-primary-600 font-semibold text-lg">
              {worker.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{worker.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              roleBadgeColors[worker.role] || 'bg-gray-100 text-gray-700'
            }`}>
              {worker.role?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          worker.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {worker.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <FiPhone className="mr-2 text-gray-400 w-4 h-4" />
          <span>{worker.phone}</span>
        </div>
        <div className="flex items-center">
          <FiMail className="mr-2 text-gray-400 w-4 h-4" />
          <span className="truncate">{worker.email}</span>
        </div>
        {worker.assignedAreas && worker.assignedAreas.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Assigned Areas</p>
            <div className="flex flex-wrap gap-1">
              {worker.assignedAreas.map((area, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {typeof area === 'object' ? area.name : area}
                </span>
              ))}
            </div>
          </div>
        )}
        {worker.performanceScore !== undefined && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Performance</span>
              <span className="font-medium text-primary-600">{worker.performanceScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${worker.performanceScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AddWorkerModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'BOOTH_WORKER',
    assignedAreas: []
  })
  const [areas, setAreas] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const roles = [
    { value: 'BLOCK_MANAGER', label: 'Block Manager' },
    { value: 'WARD_MANAGER', label: 'Ward Manager' },
    { value: 'BOOTH_WORKER', label: 'Booth Worker' },
    { value: 'VOLUNTEER', label: 'Volunteer' }
  ]

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data } = await api.get('/areas?status=ACTIVE')
        if (data.success) setAreas(data.data || [])
      } catch (err) {
        console.error('Failed to fetch areas')
      }
    }
    fetchAreas()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/auth/register', formData)
      if (data.success) {
        toast.success('Worker added successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add worker')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add Field Worker</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="input-field"
                pattern="[0-9]{10}"
                placeholder="10 digit number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="input-field"
                minLength="6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                required
                value={formData.role}
                onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="input-field"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Areas</label>
              <select
                multiple
                value={formData.assignedAreas}
                onChange={e => {
                  const selected = Array.from(e.target.selectedOptions, o => o.value)
                  setFormData(prev => ({ ...prev, assignedAreas: selected }))
                }}
                className="input-field h-28"
              >
                {areas.map(area => (
                  <option key={area._id} value={area._id}>
                    {area.name} ({area.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple areas</p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Adding...' : 'Add Worker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
