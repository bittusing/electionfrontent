import { useState, useEffect } from 'react'
import { FiUsers, FiCheckSquare, FiTrendingUp, FiActivity } from 'react-icons/fi'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function Analytics() {
  const [demographics, setDemographics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDemographics()
  }, [])

  const fetchDemographics = async () => {
    try {
      const { data } = await api.get('/analytics/voter-demographics')
      if (data.success) {
        setDemographics(data.data)
      }
    } catch (error) {
      toast.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive voter demographics and statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Voters"
          value={demographics?.totalVoters || 0}
          icon={<FiUsers />}
          color="blue"
        />
        <StatCard
          title="Government Employees"
          value={demographics?.governmentEmployees || 0}
          icon={<FiCheckSquare />}
          color="green"
        />
        <StatCard
          title="Influencers"
          value={demographics?.influencers || 0}
          icon={<FiTrendingUp />}
          color="yellow"
        />
        <StatCard
          title="Property Owners"
          value={demographics?.propertyOwners || 0}
          icon={<FiActivity />}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Caste Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Caste Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={demographics?.byCaste || []}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(demographics?.byCaste || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Religion Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Religion Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demographics?.byReligion || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Education Level */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Education Level</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demographics?.byEducation || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employment Type */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Employment Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={demographics?.byEmployment || []}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {(demographics?.byEmployment || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
