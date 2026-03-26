import { useEffect, useState } from 'react'
import { FiPlus, FiCheckCircle, FiXCircle, FiClock, FiCalendar, FiUser } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function DailyReports() {
  const { permissions, role, user } = useAuthStore()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('my-reports')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    status: ''
  })

  useEffect(() => {
    fetchReports()
  }, [view])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const endpoint = view === 'my-reports' ? '/daily-reports/my-reports' : '/daily-reports'
      const { data } = await api.get(endpoint)
      if (data.success) {
        setReports(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (reportId) => {
    try {
      const { data } = await api.post(`/daily-reports/${reportId}/approve`)
      if (data.success) {
        toast.success('Report approved')
        fetchReports()
      }
    } catch (error) {
      toast.error('Failed to approve report')
    }
  }

  const handleReject = async (reportId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const { data } = await api.post(`/daily-reports/${reportId}/reject`, { reason })
      if (data.success) {
        toast.success('Report rejected')
        fetchReports()
      }
    } catch (error) {
      toast.error('Failed to reject report')
    }
  }

  const canViewAll = permissions?.reports?.viewAll || role === 'SUPER_ADMIN' || role === 'STATE_ADMIN'

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Reports</h1>
          <p className="text-gray-600 mt-1">Track daily work and activities</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <FiPlus className="mr-2" />
          Submit Report
        </button>
      </div>

      {/* View Toggle */}
      {canViewAll && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('my-reports')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'my-reports'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Reports
          </button>
          <button
            onClick={() => setView('all-reports')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'all-reports'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Reports
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="input-field"
            />
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
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No reports found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <FiUser className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {report.userId?.name || 'Unknown'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <FiCalendar className="mr-1" />
                      {format(new Date(report.date), 'dd MMM yyyy')}
                    </div>
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {/* Work Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatItem label="Tasks Completed" value={report.workSummary?.tasksCompleted || 0} />
                <StatItem label="Voters Contacted" value={report.workSummary?.votersContacted || 0} />
                <StatItem label="New Voters" value={report.workSummary?.newVotersAdded || 0} />
                <StatItem label="Hours Worked" value={report.workSummary?.hoursWorked || 0} />
              </div>

              {/* Activities */}
              {report.activities && report.activities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Activities:</h4>
                  <div className="space-y-2">
                    {report.activities.map((activity, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">{activity.type}:</span> {activity.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ground Feedback */}
              {report.groundFeedback && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Ground Feedback</h4>
                  <p className="text-sm text-blue-700">
                    Sentiment: <span className="font-medium">{report.groundFeedback.publicSentiment}</span>
                  </p>
                  {report.groundFeedback.keyIssues && report.groundFeedback.keyIssues.length > 0 && (
                    <p className="text-sm text-blue-700 mt-1">
                      Issues: {report.groundFeedback.keyIssues.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              {report.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                  <p className="text-sm text-gray-600">{report.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {view === 'all-reports' && report.status === 'SUBMITTED' && canViewAll && (
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(report._id)}
                    className="btn-primary flex-1 text-sm"
                  >
                    <FiCheckCircle className="mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(report._id)}
                    className="btn-danger flex-1 text-sm"
                  >
                    <FiXCircle className="mr-1" />
                    Reject
                  </button>
                </div>
              )}

              {/* Rejection Reason */}
              {report.status === 'REJECTED' && report.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</h4>
                  <p className="text-sm text-red-700">{report.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchReports()
          }}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SUBMITTED: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700'
  }

  const icons = {
    DRAFT: <FiClock className="mr-1" />,
    SUBMITTED: <FiClock className="mr-1" />,
    APPROVED: <FiCheckCircle className="mr-1" />,
    REJECTED: <FiXCircle className="mr-1" />
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {icons[status]}
      {status}
    </span>
  )
}

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800">{value}</p>
    </div>
  )
}

function CreateReportModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    areaId: user?.assignedAreas?.[0] || '',
    workSummary: {
      tasksCompleted: 0,
      votersContacted: 0,
      newVotersAdded: 0,
      hoursWorked: 0
    },
    activities: [],
    groundFeedback: {
      publicSentiment: 'NEUTRAL',
      keyIssues: [],
      suggestions: ''
    },
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/daily-reports', formData)
      if (data.success) {
        // Submit the report
        await api.post(`/daily-reports/${data.data._id}/submit`)
        toast.success('Report submitted successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Daily Report</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
                required
              />
            </div>

            {/* Work Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Work Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasks Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.workSummary.tasksCompleted}
                    onChange={(e) => setFormData({
                      ...formData,
                      workSummary: { ...formData.workSummary, tasksCompleted: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voters Contacted
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.workSummary.votersContacted}
                    onChange={(e) => setFormData({
                      ...formData,
                      workSummary: { ...formData.workSummary, votersContacted: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Voters Added
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.workSummary.newVotersAdded}
                    onChange={(e) => setFormData({
                      ...formData,
                      workSummary: { ...formData.workSummary, newVotersAdded: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.workSummary.hoursWorked}
                    onChange={(e) => setFormData({
                      ...formData,
                      workSummary: { ...formData.workSummary, hoursWorked: parseFloat(e.target.value) || 0 }
                    })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Ground Feedback */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ground Feedback</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Public Sentiment
                  </label>
                  <select
                    value={formData.groundFeedback.publicSentiment}
                    onChange={(e) => setFormData({
                      ...formData,
                      groundFeedback: { ...formData.groundFeedback, publicSentiment: e.target.value }
                    })}
                    className="input-field"
                  >
                    <option value="VERY_POSITIVE">Very Positive</option>
                    <option value="POSITIVE">Positive</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="VERY_NEGATIVE">Very Negative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggestions
                  </label>
                  <textarea
                    value={formData.groundFeedback.suggestions}
                    onChange={(e) => setFormData({
                      ...formData,
                      groundFeedback: { ...formData.groundFeedback, suggestions: e.target.value }
                    })}
                    className="input-field"
                    rows="3"
                    placeholder="Any suggestions or observations..."
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
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
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
