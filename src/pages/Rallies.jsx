import { useEffect, useState } from 'react'
import { FiPlus, FiCalendar, FiMapPin, FiUsers, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Rallies() {
  const { hasPermission } = useAuthStore()
  const [rallies, setRallies] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('upcoming')
  const [showAddModal, setShowAddModal] = useState(false)
  const [audienceOpenId, setAudienceOpenId] = useState(null)
  const [audienceById, setAudienceById] = useState({})
  const [audienceLoadingId, setAudienceLoadingId] = useState(null)

  useEffect(() => {
    fetchRallies()
  }, [view])

  const fetchRallies = async () => {
    try {
      setLoading(true)
      const endpoint = view === 'upcoming' ? '/rallies/upcoming?days=30' : '/rallies'
      const { data } = await api.get(endpoint)
      if (data.success) {
        setRallies(data.data)
      }
    } catch (error) {
      toast.error('Failed to load rallies')
    } finally {
      setLoading(false)
    }
  }

  const toggleAudience = async (rallyId) => {
    if (audienceOpenId === rallyId) {
      setAudienceOpenId(null)
      return
    }
    setAudienceOpenId(rallyId)
    if (audienceById[rallyId]) return
    setAudienceLoadingId(rallyId)
    try {
      const { data } = await api.get(`/rallies/${rallyId}/audience`)
      if (data.success) {
        setAudienceById((prev) => ({ ...prev, [rallyId]: data.data }))
      }
    } catch {
      toast.error('Could not load meeting audience')
      setAudienceOpenId(null)
    } finally {
      setAudienceLoadingId(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      POSTPONED: 'bg-yellow-100 text-yellow-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rallies & Events</h1>
          <p className="text-gray-600">Schedule and manage events</p>
        </div>
        {hasPermission('rallies', 'create') && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Schedule Rally
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setView('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'upcoming'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Events
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : rallies.length === 0 ? (
        <div className="card text-center py-12">
          <FiCalendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No rallies scheduled</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rallies.map((rally) => (
            <div key={rally._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{rally.title}</h3>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(rally.status)}`}>
                      {rally.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      <span>
                        {new Date(rally.schedule.date).toLocaleDateString()} at {rally.schedule.startTime}
                      </span>
                    </div>
                    
                    {rally.venue?.name && (
                      <div className="flex items-center gap-2">
                        <FiMapPin className="w-4 h-4" />
                        <span>{rally.venue.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      <span>Expected: {rally.expectedAttendees || 0} attendees</span>
                    </div>
                    {rally.areaId && (
                      <p className="text-xs text-gray-500">
                        Area: {typeof rally.areaId === 'object' ? rally.areaId.name : '—'} (
                        {typeof rally.areaId === 'object' ? rally.areaId.type : '—'})
                      </p>
                    )}
                  </div>
                </div>
                <div className="lg:shrink-0 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => toggleAudience(rally._id)}
                    className="btn-secondary text-sm w-full lg:w-auto inline-flex items-center justify-center gap-2"
                  >
                    {audienceOpenId === rally._id ? (
                      <>
                        <FiChevronUp className="w-4 h-4" />
                        Hide audience
                      </>
                    ) : (
                      <>
                        <FiChevronDown className="w-4 h-4" />
                        Meeting audience
                      </>
                    )}
                  </button>
                </div>
              </div>
              {audienceOpenId === rally._id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {audienceLoadingId === rally._id && (
                    <p className="text-sm text-gray-500">Loading voter summary…</p>
                  )}
                  {audienceById[rally._id] && (
                    <MeetingAudienceSummary data={audienceById[rally._id]} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddRallyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchRallies()
          }}
        />
      )}
    </div>
  )
}

function supportLabel(key) {
  const m = {
    STRONG_SUPPORTER: 'Strong supporter',
    SUPPORTER: 'Supporter',
    NEUTRAL: 'Neutral',
    OPPONENT: 'Opponent',
    UNKNOWN: 'Not set',
  }
  return m[key] || key || '—'
}

function MeetingAudienceSummary({ data }) {
  if (data.hint) {
    return <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">{data.hint}</p>
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase">Voters in scope</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{data.voterTotal ?? 0}</p>
        <p className="text-sm text-gray-600 mt-2">With mobile: {data.votersWithPhone ?? 0}</p>
        <p className="text-xs text-gray-500 mt-1">Areas matched: {data.areasMatched ?? 0}</p>
      </div>
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase">By support level</p>
        <ul className="mt-2 space-y-1 text-sm">
          {(data.bySupportLevel || []).map((row) => (
            <li key={row._id || 'x'} className="flex justify-between">
              <span className="text-gray-600">{supportLabel(row._id)}</span>
              <span className="font-semibold">{row.count}</span>
            </li>
          ))}
          {(!data.bySupportLevel || data.bySupportLevel.length === 0) && (
            <li className="text-gray-500 text-sm">No voters in these areas yet.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

function AddRallyModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'RALLY',
    venue: {
      name: '',
      address: '',
      landmark: ''
    },
    schedule: {
      date: '',
      startTime: '',
      endTime: ''
    },
    expectedAttendees: 0
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/rallies', formData)
      if (data.success) {
        toast.success('Rally scheduled successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule rally')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Schedule Rally</h2>
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
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="RALLY">Rally</option>
                  <option value="PUBLIC_MEETING">Public Meeting</option>
                  <option value="DOOR_TO_DOOR">Door to Door</option>
                  <option value="CORNER_MEETING">Corner Meeting</option>
                  <option value="ROAD_SHOW">Road Show</option>
                  <option value="PRESS_CONFERENCE">Press Conference</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Attendees
                </label>
                <input
                  type="number"
                  value={formData.expectedAttendees}
                  onChange={(e) => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) })}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Venue Details</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Venue Name"
                  value={formData.venue.name}
                  onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, name: e.target.value } })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.venue.address}
                  onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, address: e.target.value } })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Landmark"
                  value={formData.venue.landmark}
                  onChange={(e) => setFormData({ ...formData, venue: { ...formData.venue, landmark: e.target.value } })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Schedule *</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="date"
                  required
                  value={formData.schedule.date}
                  onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, date: e.target.value } })}
                  className="input-field"
                />
                <input
                  type="time"
                  required
                  placeholder="Start Time"
                  value={formData.schedule.startTime}
                  onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, startTime: e.target.value } })}
                  className="input-field"
                />
                <input
                  type="time"
                  placeholder="End Time"
                  value={formData.schedule.endTime}
                  onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, endTime: e.target.value } })}
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
                {submitting ? 'Scheduling...' : 'Schedule Rally'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
