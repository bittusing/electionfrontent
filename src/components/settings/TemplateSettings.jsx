import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

export default function TemplateSettings() {
  const { permissions } = useAuthStore()
  const canEdit = permissions?.settings?.edit

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create', 'edit', 'preview'
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'whatsapp',
    subject: '',
    content: ''
  })

  const availableVariables = [
    { name: 'voterName', label: 'Voter Name' },
    { name: 'area', label: 'Area' },
    { name: 'district', label: 'District' },
    { name: 'state', label: 'State' },
    { name: 'phoneNumber', label: 'Phone Number' },
    { name: 'voterId', label: 'Voter ID' }
  ]

  useEffect(() => {
    loadTemplates()
  }, [filterType])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const params = filterType !== 'all' ? { type: filterType } : {}
      const response = await api.get('/messaging-settings/templates', { params })
      setTemplates(response.data.data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setFormData({
      name: '',
      type: 'whatsapp',
      subject: '',
      content: ''
    })
    setSelectedTemplate(null)
    setShowModal(true)
  }

  const handleEdit = (template) => {
    setModalMode('edit')
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      content: template.content
    })
    setSelectedTemplate(template)
    setShowModal(true)
  }

  const handlePreview = async (template) => {
    try {
      const response = await api.get(`/messaging-settings/templates/${template._id}/preview`)
      setSelectedTemplate({
        ...template,
        preview: response.data.data
      })
      setModalMode('preview')
      setShowModal(true)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load preview')
    }
  }

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      await api.delete(`/messaging-settings/templates/${templateId}`)
      await loadTemplates()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete template')
    }
  }

  const handleSave = async () => {
    try {
      if (modalMode === 'create') {
        await api.post('/messaging-settings/templates', formData)
      } else {
        await api.put(`/messaging-settings/templates/${selectedTemplate._id}`, formData)
      }
      
      await loadTemplates()
      setShowModal(false)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save template')
    }
  }

  const insertVariable = (varName) => {
    const textarea = document.getElementById('template-content')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.content
    const before = text.substring(0, start)
    const after = text.substring(end)
    
    setFormData({
      ...formData,
      content: before + `{{${varName}}}` + after
    })
    
    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + varName.length + 4, start + varName.length + 4)
    }, 0)
  }

  const handleExport = async () => {
    try {
      const params = filterType !== 'all' ? { type: filterType } : {}
      const response = await api.get('/messaging-settings/templates-export', { 
        params,
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `templates_${filterType}_${Date.now()}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert('Failed to export templates')
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const fileContent = await file.text()
      const response = await api.post('/messaging-settings/templates-import', {
        fileContent
      })
      
      const results = response.data.data
      alert(`Import completed:\n${results.success.length} successful\n${results.failed.length} failed\n${results.skipped.length} renamed`)
      
      await loadTemplates()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to import templates')
    }
    
    event.target.value = ''
  }

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = []
    }
    acc[template.type].push(template)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Message Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage reusable message templates
          </p>
        </div>
        <div className="flex space-x-3">
          <input
            type="file"
            id="import-file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            disabled={!canEdit}
          />
          <button
            onClick={() => document.getElementById('import-file').click()}
            className="btn-secondary"
            disabled={!canEdit}
          >
            Import
          </button>
          <button
            onClick={handleExport}
            className="btn-secondary"
          >
            Export
          </button>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="btn-primary"
            >
              + Create Template
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        {['all', 'whatsapp', 'sms', 'email'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates */}
      {templates.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No Templates Found
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first template to get started
          </p>
          {canEdit && (
            <button
              onClick={handleCreate}
              className="btn-primary"
            >
              Create Template
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
            <div key={type}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">
                {type} Templates ({typeTemplates.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeTemplates.map(template => (
                  <div key={template._id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-800">{template.name}</h4>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded capitalize">
                        {template.type}
                      </span>
                    </div>
                    
                    {template.subject && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Subject:</strong> {template.subject}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {template.content}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.variables?.map(variable => (
                        <span
                          key={variable}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2 text-sm">
                      <button
                        onClick={() => handlePreview(template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Preview
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleEdit(template)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(template._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {modalMode === 'create' && 'Create Template'}
                  {modalMode === 'edit' && 'Edit Template'}
                  {modalMode === 'preview' && 'Template Preview'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {modalMode === 'preview' ? (
                <div className="space-y-4">
                  {selectedTemplate?.preview?.subject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {selectedTemplate.preview.rendered.subject}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                      {selectedTemplate.preview.rendered.content}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      disabled={modalMode === 'edit'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input-field"
                      disabled={modalMode === 'edit'}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  {formData.type === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content *
                    </label>
                    <textarea
                      id="template-content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="input-field"
                      rows="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Variables
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableVariables.map(variable => (
                        <button
                          key={variable.name}
                          onClick={() => insertVariable(variable.name)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                        >
                          {`{{${variable.name}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary"
                    >
                      {modalMode === 'create' ? 'Create' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
