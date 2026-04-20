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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900"
        aria-hidden
      />
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-16 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-md w-full z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-2xl mb-4">
            <span className="text-4xl" role="img" aria-hidden>🗳️</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-sm">
            Election CRM
          </h1>
          <p className="text-primary-100 mt-2 text-sm sm:text-base font-medium">
            Campaign & field operations suite
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 sm:p-9">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>

          <div className="flex gap-1 p-1 mb-6 bg-gray-100/90 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loginType === 'email'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType('phone')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                loginType === 'phone'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Phone
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginType === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-11"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field pl-11"
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
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-11"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base font-semibold mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 mb-2">Demo</p>
            <p className="text-xs text-gray-500">admin@example.com / admin123</p>
          </div>
        </div>

        <p className="text-center text-primary-100/90 text-sm mt-6 font-medium">
          Built for Indian election campaigns
        </p>
      </div>
    </div>
  )
}
