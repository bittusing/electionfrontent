import { useState, useEffect } from 'react'
import CredentialForm from './CredentialForm'
import api from '../../utils/api'

export default function EmailSettings() {
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [stats, setStats] = useState({})

  const providers = [
    { value: 'aws-ses', label: 'AWS SES' },
    { value: 'sendgrid', label: 'SendGrid' },
    { value: 'mailgun', label: 'Mailgun' },
    { value: 'smtp', label: 'SMTP' }
  ]

  const fields = {
    'aws-ses': [
      { name: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, sensitive: true },
      { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, sensitive: true },
      { name: 'region', label: 'Region', type: 'text', required: true, placeholder: 'us-east-1' },
      { name: 'fromEmail', label: 'From Email', type: 'email', required: true }
    ],
    sendgrid: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true, sensitive: true },
      { name: 'fromEmail', label: 'From Email', type: 'email', required: true },
      { name: 'fromName', label: 'From Name', type: 'text' }
    ],
    mailgun: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true, sensitive: true },
      { name: 'domain', label: 'Domain', type: 'text', required: true },
      { name: 'fromEmail', label: 'From Email', type: 'email', required: true }
    ],
    smtp: [
      { name: 'host', label: 'SMTP Host', type: 'text', required: true },
      { name: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true, sensitive: true },
      { name: 'fromEmail', label: 'From Email', type: 'email', required: true },
      { name: 'secure', label: 'Use TLS', type: 'checkbox', description: 'Enable TLS encryption' }
    ]
  }

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    try {
      setLoading(true)
      const response = await api.get('/messaging-settings/credentials/email')
      setCredentials(response.data.data || [])
      
      for (const cred of response.data.data || []) {
        loadStats(cred.provider)
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (provider) => {
    try {
      const response = await api.get(`/messaging-settings/credentials/email/${provider}/stats`)
      setStats(prev => ({
        ...prev,
        [provider]: response.data.data
      }))
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSave = async (formData) => {
    try {
      await api.post('/messaging-settings/credentials', {
        type: 'email',
        provider: formData.provider,
        credentials: formData.credentials,
        isPrimary: formData.isPrimary
      })
      
      await loadCredentials()
      setShowAddForm(false)
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to save credentials')
    }
  }

  const handleTest = async (provider, credentials) => {
    try {
      const response = await api.post('/messaging-settings/credentials/email/test', {
        provider,
        credentials
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Connection test failed')
    }
  }

  const handleDelete = async (credentialId) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return
    }

    try {
      await api.delete(`/messaging-settings/credentials/${credentialId}`)
      await loadCredentials()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete credential')
    }
  }

  const handleSetPrimary = async (credentialId) => {
    try {
      await api.put(`/messaging-settings/credentials/${credentialId}/primary`)
      await loadCredentials()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to set primary')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Email Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure email service credentials for sending campaigns
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Provider'}
        </button>
      </div>

      {showAddForm && (
        <CredentialForm
          type="Email"
          providers={providers}
          fields={fields}
          onSave={handleSave}
          onTest={handleTest}
        />
      )}

      {credentials.length === 0 && !showAddForm ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Email Credentials Configured
          </h3>
          <p className="text-gray-600 mb-4">
            Add your first email provider to start sending campaigns
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            Add Email Provider
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {credentials.map(cred => (
            <div key={cred._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-800 capitalize">
                      {cred.provider}
                    </h3>
                    {cred.isPrimary && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Primary
                      </span>
                    )}
                    {cred.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Last tested: {cred.lastTestedAt 
                      ? new Date(cred.lastTestedAt).toLocaleString() 
                      : 'Never'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!cred.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(cred._id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(cred._id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {stats[cred.provider] && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600">Today</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {stats[cred.provider].messagesSentToday || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">This Week</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {stats[cred.provider].messagesSentThisWeek || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">This Month</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {stats[cred.provider].messagesSentThisMonth || 0}
                    </p>
                  </div>
                </div>
              )}

              {cred.lastTestStatus && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  cred.lastTestStatus === 'success'
                    ? 'bg-green-50 text-green-800'
                    : cred.lastTestStatus === 'failed'
                    ? 'bg-red-50 text-red-800'
                    : 'bg-gray-50 text-gray-800'
                }`}>
                  Status: {cred.lastTestStatus}
                  {cred.lastTestError && ` - ${cred.lastTestError}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
