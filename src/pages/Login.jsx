import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth, setPermissions } = useAuthStore()

  const [loginType, setLoginType] = useState('email')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const loginData = loginType === 'email'
        ? { email: formData.email, password: formData.password }
        : { phone: formData.phone, password: formData.password }

      const { data } = await api.post('/auth/login', loginData)

      if (data.success) {
        setAuth(data.data.user, data.data.token)

        try {
          const permResponse = await api.get('/permissions/my-permissions')
          if (permResponse.data.success) {
            setPermissions(permResponse.data.data.permissions, permResponse.data.data.role)
          }
        } catch (permError) {
          console.warn('Failed to fetch permissions:', permError)
        }

        toast.success('Login successful!')
        navigate('/')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🗳️</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Election CRM</h1>
          <p className="text-primary-100">Campaign Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back</h2>

          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 py-2 rounded-md transition-colors ${
                loginType === 'email'
                  ? 'bg-white shadow-sm text-primary-600 font-medium'
                  : 'text-gray-600'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType('phone')}
              className={`flex-1 py-2 rounded-md transition-colors ${
                loginType === 'phone'
                  ? 'bg-white shadow-sm text-primary-600 font-medium'
                  : 'text-gray-600'
              }`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginType === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-10"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field pl-10"
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg font-medium"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Email: admin@example.com</p>
              <p>Password: admin123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-primary-100 text-sm mt-6">
          Built for Indian Election Campaigns
        </p>
      </div>
    </div>
  )
}
