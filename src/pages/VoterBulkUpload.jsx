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
      const list = data.success ? data.data || [] : []
      setTehsils(list)
      return list
    } catch (error) {
      console.error('Failed to fetch tehsils:', error)
      setTehsils([])
      return []
    }
  }

  /** parentId = tehsil or district (blocks may sit directly under district when no tehsil). */
  const fetchBlocks = async (parentAreaId) => {
    if (!parentAreaId) {
      setBlocks([])
      return
    }
    try {
      const { data } = await api.get('/areas', { params: { type: 'BLOCK', parentId: parentAreaId, limit: 100 } })
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

  const handleDistrictChange = async (districtId) => {
    setSelectedDistrict(districtId)
    setSelectedTehsil('')
    setSelectedBlock('')
    setSelectedVillage('')
    setDefaultAreaId('')
    setTehsils([])
    setBlocks([])
    setVillages([])
    setBooths([])
    if (!districtId) return
    const tehsilList = await fetchTehsils(districtId)
    if (tehsilList.length === 0) {
      await fetchBlocks(districtId)
    }
  }

  /** User chose “no tehsil” while tehsils exist — load blocks directly under district. */
  const DISTRICT_BLOCKS = '__DISTRICT_BLOCKS__'

  const handleTehsilChange = (value) => {
    setSelectedBlock('')
    setSelectedVillage('')
    setDefaultAreaId('')
    setVillages([])
    setBooths([])
    if (value === '' || value === DISTRICT_BLOCKS) {
      setSelectedTehsil(value === DISTRICT_BLOCKS ? DISTRICT_BLOCKS : '')
      setBlocks([])
      if (selectedDistrict) {
        fetchBlocks(selectedDistrict)
      }
      return
    }
    setSelectedTehsil(value)
    setBlocks([])
    fetchBlocks(value)
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
    setDefaultAreaId(villageId || '')
    setBooths([])
    if (villageId) fetchBooths(villageId)
  }

  const handleBoothChange = (boothId) => {
    setDefaultAreaId(boothId || selectedVillage || '')
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

    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const importUrl = isPdf ? '/voters/bulk-import-pdf' : '/voters/bulk-import'

    try {
      const { data } = await api.post(importUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (data.success) {
        setUploadResult(data.data)
        const skipped = data.data.errors?.length || 0
        if (skipped > 0) {
          toast.success(`${data.data.imported} voters imported; ${skipped} row(s) skipped — see results below.`)
        } else {
          toast.success(`${data.data.imported} voters imported successfully!`)
        }
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
        <p className="text-gray-600 mt-1">
          Upload multiple voters using Excel, CSV, or a text-based PDF (नामावली).
        </p>
      </div>

      {/* Instructions Card */}
      <div className="card border border-primary-100 bg-gradient-to-br from-primary-50/90 to-white">
        <h3 className="font-semibold text-primary-900 mb-2">निर्देश · Bulk import (Panchayat / नामावली style)</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-primary-950/90">
          <li>State → District → Tehsil → Block → Village/Gram Panchayat → (optional) Booth चुनें — यही <strong>default areaId</strong> बनेगा।</li>
          <li>Excel (.xlsx) या CSV में नीचे वाले कॉलम भरें (हिंदी या English हेडर दोनों चलेंगे)।</li>
          <li>हर पंक्ति में कम से कम <strong>नाम</strong> या <strong>EPIC/SVN</strong> होना चाहिए।</li>
          <li>फोन, कास्ट, समर्थन स्तर आदि बूथ सदस्य बाद में Voters में अपडेट कर सकते हैं।</li>
        </ol>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-800">
          <p className="font-semibold text-slate-900 mb-2">Supported columns (first sheet / header row)</p>
          <div className="overflow-x-auto text-xs">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-1 pr-3">Field</th>
                  <th className="py-1 pr-3">English headers</th>
                  <th className="py-1">Hindi-style examples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-1 font-medium">Serial</td><td>rollSerialNumber, serial, S.No</td><td>क्र०सं०, क्रम संख्या</td></tr>
                <tr><td className="py-1 font-medium">House no.</td><td>houseNumber, house_no</td><td>मकान नं, मकान नं०</td></tr>
                <tr><td className="py-1 font-medium">Name</td><td>name</td><td>नाम, निर्वाचक का नाम</td></tr>
                <tr><td className="py-1 font-medium">Father / husband / mother</td><td>relativeName, father_name</td><td>पिता का नाम, पिता/पति/माता का नाम</td></tr>
                <tr><td className="py-1 font-medium">EPIC / SVN</td><td>voterIdNumber, EPIC</td><td>एस०वी०एन०, SVN</td></tr>
                <tr><td className="py-1 font-medium">Gender</td><td>MALE / FEMALE</td><td>पु / म (पुरुष / महिला)</td></tr>
                <tr><td className="py-1 font-medium">Age</td><td>age</td><td>आयु</td></tr>
                <tr><td className="py-1 font-medium">Location (text)</td><td colSpan={2}>state, district, block, gramPanchayat, ward — जिला, विकास खंड, ग्राम पंचायत, वार्ड (address में सेव होगा)</td></tr>
                <tr><td className="py-1 font-medium">Polling place</td><td colSpan={2}>pollingCenter, pollingSite — मतदान केन्द्र, मतदान स्थल → landmark</td></tr>
                <tr><td className="py-1 font-medium">areaId</td><td colSpan={2}>Optional Mongo _id per row; otherwise default area from Step 2 applies</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-xs text-emerald-950">
            <strong>PDF upload:</strong> अब <strong>.pdf</strong> भी चुन सकते हैं — सर्वर PDF से <em>selectable text</em> निकालकर EPIC
            (10 अक्षर) ढूँढता है और नाम/रिश्तेदार/मकान/आयु/लिंग best-effort भरता है। <strong>स्कैन वाली</strong> PDF (जिसमें टेक्स्ट
            कॉपी नहीं होता) पर यह काम नहीं करेगा — उसके लिए OCR या Excel ज़रूरी। बड़ी फ़ाइल (~35 MB तक)।
          </p>
        </div>
      </div>

      {/* Download Template */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Step 1: Download template</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.open('/samples/voter-template.csv', '_blank')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Basic CSV sample
          </button>
          <button
            type="button"
            onClick={() => window.open('/samples/voter-panchayat-roll-sample.csv', '_blank')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Panchayat roll (Hindi headers) sample
          </button>
        </div>
      </div>

      {/* Default Area Selection */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">
          Step 2: Default area (ज़रूरी जब Excel में areaId न हो)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          नामावली जैसी शीट में हर पंक्ति के लिए <code className="rounded bg-slate-100 px-1">areaId</code> देना ज़रूरी नहीं —
          यहाँ <strong>ग्राम पंचायत / बूथ</strong> चुनें तो सभी पंक्तियाँ उसी यूनिट में जुड़ जाएँगी। बूथ न चुना हो तो चयनित गाँव/वार्ड ID default रहेगा।
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
              Tehsil (तहसील) — ज़रूरी नहीं
            </label>
            <select
              value={selectedTehsil}
              onChange={(e) => handleTehsilChange(e.target.value)}
              className="input-field"
              disabled={!selectedDistrict}
            >
              <option value="">Select Tehsil</option>
              {tehsils.length > 0 && (
                <option value={DISTRICT_BLOCKS}>बिना तहसील — जिले के सीधे ब्लॉक</option>
              )}
              {tehsils.map(tehsil => (
                <option key={tehsil._id} value={tehsil._id}>{tehsil.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              अगर जिले में कोई तहसील नहीं है, ब्लॉक सूची अपने आप लोड हो जाएगी।
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block (ब्लॉक)
            </label>
            <select
              value={selectedBlock}
              onChange={(e) => handleBlockChange(e.target.value)}
              className="input-field"
              disabled={!selectedDistrict || blocks.length === 0}
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
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm text-emerald-900">
              Default <code className="rounded bg-white/80 px-1">areaId</code> set — rows without their own areaId will use this booth or village.
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
              Select Excel / CSV / PDF
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,application/pdf"
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
              {uploadResult.pdfMeta && (
                <p className="mt-2 text-xs text-green-900/90">
                  PDF: {uploadResult.pdfMeta.pages} page(s), {uploadResult.pdfMeta.charCount} chars extracted,{' '}
                  {uploadResult.pdfMeta.extractedEpics} EPIC match(es) → {uploadResult.pdfMeta.uniqueRows} unique rows
                  parsed.
                </p>
              )}
            </div>
          )}

          {uploadResult.errors?.length > 0 && uploadResult.imported > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                {uploadResult.errors.length} row(s) skipped (see list below)
              </p>
            </div>
          )}

          {uploadResult.errors?.length > 0 && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-800">Row notes</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                {uploadResult.errors.slice(0, 30).map((error, index) => (
                  <li key={index}>
                    {typeof error === 'string'
                      ? error
                      : `Row ${error.row}: ${error.message || JSON.stringify(error)}`}
                  </li>
                ))}
                {uploadResult.errors.length > 30 && (
                  <li>… and {uploadResult.errors.length - 30} more</li>
                )}
              </ul>
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
