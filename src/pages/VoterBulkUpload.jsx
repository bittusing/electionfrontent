import { useState, useEffect } from 'react'
import { FiUpload, FiDownload, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function VoterBulkUpload() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [preview, setPreview] = useState([])
  
  // Area dropdowns for default area selection
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [tehsils, setTehsils] = useState([])
  const [blocks, setBlocks] = useState([])
  const [villages, setVillages] = useState([])
  const [booths, setBooths] = useState([])
  
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTehsil, setSelectedTehsil] = useState('')
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedVillage, setSelectedVillage] = useState('')
  const [defaultAreaId, setDefaultAreaId] = useState('')

  useEffect(() => {
    fetchStates()
  }, [])

  const fetchStates = async () => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'STATE', limit: 100 } })
      if (data.success) {
        setStates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch states:', error)
    }
  }

  const fetchDistricts = async (stateId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'DISTRICT', parentId: stateId, limit: 100 } })
      if (data.success) {
        setDistricts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    }
  }

  const fetchTehsils = async (districtId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'TEHSIL', parentId: districtId, limit: 100 } })
      if (data.success) {
        setTehsils(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tehsils:', error)
    }
  }

  const fetchBlocks = async (tehsilId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'BLOCK', parentId: tehsilId, limit: 100 } })
      if (data.success) {
        setBlocks(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error)
    }
  }

  const fetchVillages = async (blockId) => {
    try {
      const { data } = await api.get('/areas', { params: { parentId: blockId, limit: 100 } })
      if (data.success) {
        const villageWards = (data.data || []).filter(a => a.type === 'VILLAGE' || a.type === 'WARD')
        setVillages(villageWards)
      }
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    }
  }

  const fetchBooths = async (villageId) => {
    try {
      const { data } = await api.get('/areas', { params: { type: 'BOOTH', parentId: villageId, limit: 200 } })
      if (data.success) {
        setBooths(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch booths:', error)
    }
  }

  const handleStateChange = (stateId) => {
    setSelectedState(stateId)
    setSelectedDistrict('')
    setSelectedTehsil('')
    setSelectedBlock('')
    setSelectedVillage('')
    setDefaultAreaId('')
    setDistricts([])
    setTehsils([])
    setBlocks([])
    setVillages([])
    setBooths([])
    if (stateId) fetchDistricts(stateId)
  }

  const handleDistrictChange = (districtId) => {
    setSelectedDistrict(districtId)
    setSelectedTehsil('')
    setSelectedBlock('')
    setSelectedVillage('')
    setDefaultAreaId('')
    setTehsils([])
    setBlocks([])
    setVillages([])
    setBooths([])
    if (districtId) fetchTehsils(districtId)
  }

  const handleTehsilChange = (tehsilId) => {
    setSelectedTehsil(tehsilId)
    setSelectedBlock('')
    setSelectedVillage('')
    setDefaultAreaId('')
    setBlocks([])
    setVillages([])
    setBooths([])
    if (tehsilId) fetchBlocks(tehsilId)
  }

  const handleBlockChange = (blockId) => {
    setSelectedBlock(blockId)
    setSelectedVillage('')
    setDefaultAreaId('')
    setVillages([])
    setBooths([])
    if (blockId) fetchVillages(blockId)
  }

  const handleVillageChange = (villageId) => {
    setSelectedVillage(villageId)
    setDefaultAreaId('')
    setBooths([])
    if (villageId) fetchBooths(villageId)
  }

  const handleBoothChange = (boothId) => {
    setDefaultAreaId(boothId)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (defaultAreaId) {
      formData.append('defaultAreaId', defaultAreaId)
    }

    try {
      const { data } = await api.post('/voters/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) {
        setUploadResult(data.data)
        toast.success(`${data.data.imported} voters imported successfully!`)
        setFile(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload file')
      if (error.response?.data?.errors) {
        setUploadResult({ errors: error.response.data.errors })
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Bulk Voter Upload</h1>
        <p className="text-gray-600 mt-1">Upload multiple voters using Excel/CSV file</p>
      </div>

      {/* Instructions Card */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">📋 Instructions (निर्देश):</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Download the sample template file</li>
          <li>Fill in voter details in the template</li>
          <li>(Optional) Select default area for all voters</li>
          <li>Upload the completed file</li>
          <li>Review the results</li>
        </ol>
      </div>

      {/* Download Template */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Step 1: Download Template</h3>
        <button
          onClick={() => window.open('/samples/voter-template.csv', '_blank')}
          className="btn-secondary flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" />
          Download Sample Template
        </button>
      </div>

      {/* Default Area Selection */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">
          Step 2: Select Default Area (Optional)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          अगर सभी voters एक ही area के हैं तो यहाँ select करें। Excel में area column खाली छोड़ सकते हैं।
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State (राज्य)
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="input-field"
            >
              <option value="">Select State</option>
              {states.map(state => (
                <option key={state._id} value={state._id}>{state.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District (जिला)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="input-field"
              disabled={!selectedState}
            >
              <option value="">Select District</option>
              {districts.map(district => (
                <option key={district._id} value={district._id}>{district.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tehsil (तहसील)
            </label>
            <select
              value={selectedTehsil}
              onChange={(e) => handleTehsilChange(e.target.value)}
              className="input-field"
              disabled={!selectedDistrict}
            >
              <option value="">Select Tehsil</option>
              {tehsils.map(tehsil => (
                <option key={tehsil._id} value={tehsil._id}>{tehsil.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block (ब्लॉक)
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => handleBlockChange(e.target.value)}
              className="input-field"
              disabled={!selectedTehsil}
            >
              <option value="">Select Block</option>
              {blocks.map(block => (
                <option key={block._id} value={block._id}>{block.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Village/Ward (गाँव/वार्ड)
            </label>
            <select
              value={selectedVillage}
              onChange={(e) => handleVillageChange(e.target.value)}
              className="input-field"
              disabled={!selectedBlock}
            >
              <option value="">Select Village/Ward</option>
              {villages.map(village => (
                <option key={village._id} value={village._id}>
                  {village.name} ({village.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booth (बूथ)
            </label>
            <select
              value={defaultAreaId}
              onChange={(e) => handleBoothChange(e.target.value)}
              className="input-field"
              disabled={!selectedVillage}
            >
              <option value="">Select Booth</option>
              {booths.map(booth => (
                <option key={booth._id} value={booth._id}>
                  {booth.name} {booth.code ? `(${booth.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {defaultAreaId && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ Default area selected. All voters without area in Excel will be assigned to this booth.
            </p>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Step 3: Upload File</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel/CSV File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="input-field"
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn-primary flex items-center gap-2"
          >
            <FiUpload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload & Import Voters'}
          </button>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Upload Results</h3>
          
          {uploadResult.imported > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <FiCheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  Success! {uploadResult.imported} voters imported
                </span>
              </div>
            </div>
          )}

          {uploadResult.failed > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <FiAlertCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {uploadResult.failed} voters failed to import
                </span>
              </div>
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-red-800">Errors:</p>
                  <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                    {uploadResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li>... and {uploadResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {uploadResult.duplicates > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <FiAlertCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {uploadResult.duplicates} duplicate voters skipped
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
