import { useEffect, useState } from 'react'
import { FiPlus, FiCalendar, FiTarget, FiTrendingUp, FiX } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Campaigns() {
  const { hasPermission } = useAuthStore()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/campaigns')
      if (data.success) {
        setCampaigns(data.data)
      }
    } catch (error) {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PLANNING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Campaigns</h1>
          <p className="text-gray-600">Manage election campaigns</p>
        </div>
        {hasPermission('campaigns', 'create') && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" />
            Create Campaign
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <FiTarget className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No campaigns found</p>
          {hasPermission('campaigns', 'create') && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
              Create Your First Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{campaign.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{campaign.type}</p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              {campaign.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Voters Contacted</span>
                    <span className="font-medium">
                      {campaign.progress?.votersContacted || 0} / {campaign.goals?.voterContact || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((campaign.progress?.votersContacted || 0) / (campaign.goals?.voterContact || 1)) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Rallies</span>
                    <span className="font-medium">
                      {campaign.progress?.ralliesCompleted || 0} / {campaign.goals?.ralliesPlanned || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((campaign.progress?.ralliesCompleted || 0) / (campaign.goals?.ralliesPlanned || 1)) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Budget */}
              {campaign.budget && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget</span>
                    <span className="font-medium">
                      ₹{campaign.budget.spent?.toLocaleString() || 0} / ₹{campaign.budget.allocated?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddCampaignModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchCampaigns()
          }}
        />
      )}
    </div>
  )
}

function AddCampaignModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ELECTION',
    electionType: 'GENERAL',
    startDate: '',
    endDate: '',
    electionDate: '',
    goals: {
      voterRegistration: 0,
      voterContact: 0,
      ralliesPlanned: 0,
      volunteersNeeded: 0
    },
    budget: {
      allocated: 0
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/campaigns', formData)
      if (data.success) {
        toast.success('Campaign created successfully')
        onSuccess()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create campaign')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create Campaign</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 2024 General Election Campaign"
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
                    placeholder="Campaign objectives and strategy"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="ELECTION">Election</option>
                      <option value="AWARENESS">Awareness</option>
                      <option value="VOTER_REGISTRATION">Voter Registration</option>
                      <option value="GET_OUT_THE_VOTE">Get Out The Vote</option>
                      <option value="FUNDRAISING">Fundraising</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Election Type
                    </label>
                    <select
                      value={formData.electionType}
                      onChange={(e) => setFormData({ ...formData, electionType: e.target.value })}
                      className="input-field"
                    >
                      <option value="GENERAL">General</option>
                      <option value="STATE">State</option>
                      <option value="LOCAL">Local</option>
                      <option value="BY_ELECTION">By-Election</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Election Date
                  </label>
                  <input
                    type="date"
                    value={formData.electionDate}
                    onChange={(e) => setFormData({ ...formData, electionDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Goals */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Campaign Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voter Registration Target
                  </label>
                  <input
                    type="number"
                    value={formData.goals.voterRegistration}
                    onChange={(e) => setFormData({
                      ...formData,
                      goals: { ...formData.goals, voterRegistration: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voter Contact Target
                  </label>
                  <input
                    type="number"
                    value={formData.goals.voterContact}
                    onChange={(e) => setFormData({
                      ...formData,
                      goals: { ...formData.goals, voterContact: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rallies Planned
                  </label>
                  <input
                    type="number"
                    value={formData.goals.ralliesPlanned}
                    onChange={(e) => setFormData({
                      ...formData,
                      goals: { ...formData.goals, ralliesPlanned: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteers Needed
                  </label>
                  <input
                    type="number"
                    value={formData.goals.volunteersNeeded}
                    onChange={(e) => setFormData({
                      ...formData,
                      goals: { ...formData.goals, volunteersNeeded: parseInt(e.target.value) || 0 }
                    })}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Budget</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocated Budget (₹)
                </label>
                <input
                  type="number"
                  value={formData.budget.allocated}
                  onChange={(e) => setFormData({
                    ...formData,
                    budget: { ...formData.budget, allocated: parseInt(e.target.value) || 0 }
                  })}
                  className="input-field"
                  min="0"
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
                {submitting ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
