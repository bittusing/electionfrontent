import { useEffect, useState } from 'react'
import { FiPlus, FiClock, FiX, FiUser } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Tasks() {
  const { hasPermission } = useAuthStore()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const endpoint = filter === 'my-tasks' ? '/tasks/my-tasks' : '/tasks'
      const { data } = await api.get(endpoint)
      if (data.success) {
        setTasks(data.data)
      }
    } catch (error) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      LOW: 'text-gray-600',
      MEDIUM: 'text-blue-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
    }
    return colors[priority] || 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
          <p className="text-gray-600">Manage and track tasks</p>
        </div>
        {hasPermission('tasks', 'create') && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Create Task
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          All Tasks
        </button>
        <button
          onClick={() => setFilter('my-tasks')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'my-tasks'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          My Tasks
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div key={task._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{task.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <FiClock className="w-4 h-4" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddTaskModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchTasks()
          }}
        />
      )}
    </div>
  )
}

function AddTaskModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    taskType: 'OTHER',
    priority: 'MEDIUM',
    dueDate: ''
  })
  const [users, setUsers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users')
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch users')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/tasks', formData)
      if (data.success) {
        toast.success('Task created successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To *
                </label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Type
                </label>
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  className="input-field"
                >
                  <option value="VOTER_CONTACT">Voter Contact</option>
                  <option value="SURVEY">Survey</option>
                  <option value="EVENT">Event</option>
                  <option value="DOOR_TO_DOOR">Door to Door</option>
                  <option value="PHONE_BANKING">Phone Banking</option>
                  <option value="DATA_ENTRY">Data Entry</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>
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
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
