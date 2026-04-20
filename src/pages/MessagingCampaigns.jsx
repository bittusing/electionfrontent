import { useEffect, useState } from 'react'
import { FiPlus, FiSend, FiX, FiMessageSquare, FiUsers, FiCheckCircle, FiFilter } from 'react-icons/fi'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function MessagingCampaigns() {
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
      const { data } = await api.get('/messaging-campaigns')
      if (data.success) {
        setCampaigns(data.data)
      }
    } catch (error) {
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this campaign? Messages will be sent to all filtered voters.')) {
      return
    }

    try {
      const { data } = await api.post(`/messaging-campaigns/${campaignId}/send`)
      if (data.success) {
        toast.success('Campaign sent successfully!')
        fetchCampaigns()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send campaign')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMessageTypeIcon = (type) => {
    if (type === 'SMS') return '📱'
    if (type === 'WHATSAPP') return '💬'
    return '📱💬'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">SMS/WhatsApp Campaigns</h1>
          <p className="text-gray-600">Send bulk messages to filtered voters</p>
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
          <FiMessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No messaging campaigns found</p>
          {hasPermission('campaigns', 'create') && (
            <button type="button" onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
              Create Your First Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getMessageTypeIcon(campaign.messageType)}</span>
                    <h3 className="text-lg font-semibold text-gray-800">{campaign.name}</h3>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              {/* Message Preview */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 line-clamp-3">{campaign.messageTemplate}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                    <FiUsers className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{campaign.stats?.totalVoters || 0}</p>
                  <p className="text-xs text-gray-500">Target Voters</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <FiSend className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{campaign.stats?.messagesSent || 0}</p>
                  <p className="text-xs text-gray-500">Sent</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{campaign.stats?.messagesDelivered || 0}</p>
                  <p className="text-xs text-gray-500">Delivered</p>
                </div>
              </div>

              {/* Actions */}
              {campaign.status === 'DRAFT' && (
                <button
                  onClick={() => handleSendCampaign(campaign._id)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <FiSend className="w-4 h-4" />
                  Send Campaign
                </button>
              )}

              {campaign.status === 'COMPLETED' && (
                <div className="text-center text-sm text-gray-600">
                  Completed on {new Date(campaign.completedAt).toLocaleDateString()}
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
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Filters, 3: Message
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    messageType: 'SMS',
    messageTemplate: '',
    filters: {
      gender: '',
      ageMin: '',
      ageMax: '',
      caste: '',
      religion: '',
      supportLevel: ''
    }
  })
  const [voterCount, setVoterCount] = useState(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchVoterCount = async () => {
    setLoadingCount(true)
    try {
      const { data } = await api.post('/messaging-campaigns/filter-count', { filters: formData.filters })
      if (data.success) {
        setVoterCount(data.data.count)
      }
    } catch (error) {
      toast.error('Failed to fetch voter count')
    } finally {
      setLoadingCount(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await api.post('/messaging-campaigns', formData)
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
            <h2 className="text-2xl font-bold text-gray-800">Create Messaging Campaign</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Basic Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Filters</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="text-sm font-medium">Message</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
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
                    placeholder="e.g., Voter Awareness Campaign"
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
                    placeholder="Campaign description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type *
                  </label>
                  <select
                    required
                    value={formData.messageType}
                    onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                    className="input-field"
                  >
                    <option value="SMS">SMS Only</option>
                    <option value="WHATSAPP">WhatsApp Only</option>
                    <option value="BOTH">Both SMS & WhatsApp</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-primary"
                  >
                    Next: Set Filters
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Filters */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FiFilter className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Filter Target Voters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.filters.gender}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, gender: e.target.value }
                      })}
                      className="input-field"
                    >
                      <option value="">All</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caste
                    </label>
                    <select
                      value={formData.filters.caste}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, caste: e.target.value }
                      })}
                      className="input-field"
                    >
                      <option value="">All</option>
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
                      value={formData.filters.religion}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, religion: e.target.value }
                      })}
                      className="input-field"
                    >
                      <option value="">All</option>
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
                      Support Level
                    </label>
                    <select
                      value={formData.filters.supportLevel}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, supportLevel: e.target.value }
                      })}
                      className="input-field"
                    >
                      <option value="">All</option>
                      <option value="STRONG_SUPPORTER">Strong Supporter</option>
                      <option value="SUPPORTER">Supporter</option>
                      <option value="NEUTRAL">Neutral</option>
                      <option value="OPPONENT">Opponent</option>
                      <option value="UNKNOWN">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Min
                    </label>
                    <input
                      type="number"
                      value={formData.filters.ageMin}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, ageMin: e.target.value }
                      })}
                      className="input-field"
                      min="18"
                      placeholder="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Max
                    </label>
                    <input
                      type="number"
                      value={formData.filters.ageMax}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, ageMax: e.target.value }
                      })}
                      className="input-field"
                      max="120"
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Target Voters</p>
                      {voterCount !== null && (
                        <p className="text-2xl font-bold text-blue-600">{voterCount}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={fetchVoterCount}
                      disabled={loadingCount}
                      className="btn-secondary text-sm"
                    >
                      {loadingCount ? 'Counting...' : 'Get Count'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-primary"
                  >
                    Next: Write Message
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Message */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Template *
                  </label>
                  <textarea
                    required
                    value={formData.messageTemplate}
                    onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                    className="input-field"
                    rows="6"
                    placeholder="Write your message here... You can use variables like {name}, {area}, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Character count: {formData.messageTemplate.length} / 160 (SMS limit)
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Message Preview:</p>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-800">{formData.messageTemplate || 'Your message will appear here...'}</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
