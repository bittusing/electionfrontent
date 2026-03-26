import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

export default function CredentialForm({ 
  type, 
  providers, 
  fields, 
  onSave, 
  onTest,
  initialData = null,
  loading = false 
}) {
  const { permissions } = useAuthStore()
  const canEdit = permissions?.settings?.edit

  const [formData, setFormData] = useState({
    provider: initialData?.provider || providers[0].value,
    credentials: initialData?.credentials || {},
    isPrimary: initialData?.isPrimary || false
  })

  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Get fields for selected provider
  const selectedProvider = providers.find(p => p.value === formData.provider)
  const providerFields = fields[formData.provider] || []

  const handleProviderChange = (e) => {
    setFormData({
      ...formData,
      provider: e.target.value,
      credentials: {}
    })
    setTestResult(null)
  }

  const handleFieldChange = (fieldName, value) => {
    setFormData({
      ...formData,
      credentials: {
        ...formData.credentials,
        [fieldName]: value
      }
    })
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const result = await onTest(formData.provider, formData.credentials)
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      await onSave(formData)
      setTestResult({
        success: true,
        message: 'Credentials saved successfully'
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to save credentials'
      })
    } finally {
      setSaving(false)
    }
  }

  const maskValue = (value) => {
    if (!value) return ''
    if (value.includes('*')) return value // Already masked
    return '*'.repeat(Math.max(0, value.length - 4)) + value.slice(-4)
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {type} Configuration
      </h3>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider
          </label>
          <select
            value={formData.provider}
            onChange={handleProviderChange}
            className="input-field"
            disabled={!canEdit || loading}
          >
            {providers.map(provider => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields */}
        {providerFields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                value={formData.credentials[field.name] || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="input-field"
                disabled={!canEdit || loading}
              >
                <option value="">Select {field.label}</option>
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.credentials[field.name] || false}
                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={!canEdit || loading}
                />
                <span className="ml-2 text-sm text-gray-600">{field.description}</span>
              </div>
            ) : (
              <input
                type={field.type || 'text'}
                value={
                  field.sensitive && initialData?.credentials?.[field.name]
                    ? maskValue(formData.credentials[field.name] || initialData.credentials[field.name])
                    : formData.credentials[field.name] || ''
                }
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="input-field"
                disabled={!canEdit || loading}
              />
            )}
            
            {field.hint && (
              <p className="text-xs text-gray-500 mt-1">{field.hint}</p>
            )}
          </div>
        ))}

        {/* Primary Provider Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPrimary}
            onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!canEdit || loading}
          />
          <label className="ml-2 text-sm text-gray-700">
            Set as primary provider
          </label>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm font-medium ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.message}
            </p>
            {testResult.details && (
              <pre className="text-xs mt-2 text-gray-600">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={handleTest}
              disabled={testing || saving || loading}
              className="btn-secondary"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={testing || saving || loading}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Credentials'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
