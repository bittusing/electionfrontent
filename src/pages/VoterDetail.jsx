import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiTrash2, FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

export default function VoterDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { permissions } = useAuthStore()
  const [voter, setVoter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVoter()
  }, [id])

  const fetchVoter = async () => {
    try {
      const { data } = await api.get(`/voters/${id}`)
      if (data.success) {
        setVoter(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch voter details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (!voter) {
    return <div className="text-center py-12">Voter not found</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/voters')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{voter.name}</h1>
            <p className="text-gray-600 mt-1">Voter Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {permissions?.voters?.edit && (
            <button className="btn-secondary">
              <FiEdit2 className="mr-2" />
              Edit
            </button>
          )}
          {permissions?.voters?.delete && (
            <button className="btn-danger">
              <FiTrash2 className="mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Phone" value={voter.phone} icon={<FiPhone />} />
              <InfoItem label="Email" value={voter.email} icon={<FiMail />} />
              <InfoItem label="Gender" value={voter.gender} />
              <InfoItem label="Age" value={voter.age} />
              <InfoItem label="Voter ID" value={voter.voterIdNumber} />
              <InfoItem label="Occupation" value={voter.occupation} />
            </div>
          </div>

          {/* Demographics */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Demographics</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Caste" value={voter.caste} />
              <InfoItem label="Sub-Caste" value={voter.subCaste} />
              <InfoItem label="Religion" value={voter.religion} />
              <InfoItem label="Education" value={voter.education} />
            </div>
          </div>

          {/* Employment */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Employment & Economic</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Employment Type" value={voter.employmentType} />
              <InfoItem label="Government Employee" value={voter.isGovernmentEmployee ? 'Yes' : 'No'} />
              <InfoItem label="Department" value={voter.governmentDepartment} />
              <InfoItem label="Monthly Income" value={voter.monthlyIncome} />
            </div>
          </div>

          {/* Migration */}
          {voter.isMigrant && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Migration Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Migrant Type" value={voter.migrantType} />
                <InfoItem label="Original State" value={voter.originalState} />
                <InfoItem label="Original District" value={voter.originalDistrict} />
                <InfoItem label="Migration Reason" value={voter.migrationReason} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
            <div className="space-y-3">
              <StatusBadge label="Consent" value={voter.consentStatus} />
              <StatusBadge label="Engagement" value={voter.engagementLevel} />
              <StatusBadge label="Support" value={voter.supportLevel} />
            </div>
          </div>

          {/* Benefits */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Government Benefits</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ration Card:</span>
                <span className="font-medium">{voter.rationCardType || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Schemes:</span>
                <span className="font-medium">{voter.governmentSchemes?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Influencer */}
          {voter.isInfluencer && (
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">⭐ Influencer</h3>
              <p className="text-sm text-yellow-700">
                Influence Level: {voter.influenceLevel}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, icon }) {
  return (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-center">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        <p className="font-medium text-gray-800">{value || '-'}</p>
      </div>
    </div>
  )
}

function StatusBadge({ label, value }) {
  const getColor = () => {
    if (value === 'HIGH' || value === 'GIVEN' || value === 'STRONG_SUPPORTER') return 'bg-green-100 text-green-700'
    if (value === 'MEDIUM' || value === 'SUPPORTER') return 'bg-blue-100 text-blue-700'
    if (value === 'LOW' || value === 'NEUTRAL') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`px-2 py-1 text-xs rounded-full ${getColor()}`}>
        {value || 'Unknown'}
      </span>
    </div>
  )
}
