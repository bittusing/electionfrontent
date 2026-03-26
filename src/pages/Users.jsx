import { useEffect, useState } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUser, FiSearch } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const ALL_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'STATE_ADMIN', label: 'State Admin' },
  { value: 'DISTRICT_ADMIN', label: 'District Admin' },
  { value: 'BLOCK_MANAGER', label: 'Block Manager' },
  { value: 'WARD_MANAGER', label: 'Ward Manager' },
  { value: 'BOOTH_WORKER', label: 'Booth Worker' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
]

export default function Users() {
  const { hasPermission } = useAuthStore()
  const [users, setUsers] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const canCreate = hasPermission('users', 'create')
  const canEdit = hasPermission('users', 'edit')
  const canDelete = hasPermission('users', 'delete')

  useEffect(() => {
    fetchUsers()
    fetchAreas()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/auth/users')
      if (data.success) {
        setUsers(data.data || [])
      }
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchAreas = async () => {
    try {
      const { data } = await api.get('/areas')
      if (data.success) {
        setAreas(data.data || [])
      }
    } catch (error) {
      console.error('Fetch areas error:', error)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search)
    const matchesRole = !roleFilter || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleCounts = ALL_ROLES.reduce((acc, r) => {
    acc[r.value] = users.filter(u => u.role === r.value).length
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600">Manage all system users and their roles</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {ALL_ROLES.map(r => (
          <div
            key={r.value}
            onClick={() => setRoleFilter(prev => prev === r.value ? '' : r.value)}
            className={`text-center py-3 px-2 rounded-lg border cursor-pointer transition-all ${
              roleFilter === r.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="text-lg font-bold text-gray-800">{roleCounts[r.value] || 0}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{r.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
            placeholder="Search by name, email or phone..."
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input-field w-full sm:w-48"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">No users found</p>
          {canCreate && !search && !roleFilter && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary mt-4">
              Add First User
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <UserCard key={user._id} user={user} canEdit={canEdit} canDelete={canDelete} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal
          areas={areas}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

function UserCard({ user, canEdit, canDelete }) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
            <FiUser className="text-primary-600 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
          {user.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <span className="font-medium w-16">Email:</span>
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <span className="font-medium w-16">Phone:</span>
          <span>{user.phone}</span>
        </div>
        {user.assignedAreas && user.assignedAreas.length > 0 && (
          <div className="flex items-start text-gray-600">
            <span className="font-medium w-16 shrink-0">Areas:</span>
            <span className="flex-1 text-xs">
              {user.assignedAreas.map(a => typeof a === 'object' ? a.name : a).join(', ')}
            </span>
          </div>
        )}
      </div>

      {(canEdit || canDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {canEdit && (
            <button className="btn-secondary flex-1 text-sm">
              <FiEdit2 className="w-4 h-4 mr-1" /> Edit
            </button>
          )}
          {canDelete && (
            <button className="btn-danger flex-1 text-sm">
              <FiTrash2 className="w-4 h-4 mr-1" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CreateUserModal({ areas, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    role: 'VOLUNTEER',
    assignedAreas: [],
    status: 'ACTIVE'
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/auth/register', formData)
      if (data.success) {
        toast.success('User created successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New User</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className="input-field"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Password *</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value)}
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">User can change this later</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Role & Access</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
                  <select
                    value={formData.role}
                    onChange={e => handleChange('role', e.target.value)}
                    className="input-field"
                    required
                  >
                    {ALL_ROLES.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Assigned Areas (Optional)
                  </label>
                  <select
                    multiple
                    value={formData.assignedAreas}
                    onChange={e => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      handleChange('assignedAreas', selected)
                    }}
                    className="input-field h-32"
                  >
                    {areas.length === 0 ? (
                      <option disabled>No areas available</option>
                    ) : (
                      areas.map(area => (
                        <option key={area._id} value={area._id}>
                          {area.name} ({area.type})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                    className="input-field"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Role Info */}
            <RolePermissionInfo role={formData.role} />

            <div className="flex gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function RolePermissionInfo({ role }) {
  const info = {
    SUPER_ADMIN: ['Full system access', 'Manage all users & roles', 'System configuration'],
    STATE_ADMIN: ['State-level operations', 'Create District Admins & below', 'View state-wide reports'],
    DISTRICT_ADMIN: ['District operations', 'Create Block Managers & below', 'District reports'],
    BLOCK_MANAGER: ['Block-level operations', 'Manage ward workers', 'Assign tasks'],
    WARD_MANAGER: ['Ward operations', 'Monitor booth activities', 'Ward reports'],
    BOOTH_WORKER: ['Manage booth voters', 'Submit daily reports', 'Update voter data'],
    VOLUNTEER: ['Basic data entry', 'View assigned tasks', 'Add voter contacts'],
  }

  const items = info[role] || []

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-semibold text-blue-800 mb-2">{role.replace(/_/g, ' ')} Permissions</h4>
      <ul className="text-sm text-blue-700 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-green-600">✓</span> {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
