import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiPhone } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

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
  const [shake, setShake] = useState(0)

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
      setShake((n) => n + 1)
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
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent-500/25 blur-3xl animate-blob"
        aria-hidden
      />
      <div
        className="absolute -bottom-32 -left-16 w-[28rem] h-[28rem] rounded-full bg-white/10 blur-3xl animate-blob-slow"
        aria-hidden
      />
      <div
        className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-primary-300/10 blur-3xl animate-blob"
        style={{ animationDelay: '-6s' }}
        aria-hidden
      />

      <motion.div
        className="relative max-w-md w-full z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-2xl mb-4"
            initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, type: 'spring', stiffness: 180, damping: 14 }}
            whileHover={{ scale: 1.06, rotate: -3 }}
          >
            <span className="text-4xl" role="img" aria-hidden>🗳️</span>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-sm">
            Election CRM
          </h1>
          <p className="text-primary-100 mt-2 text-sm sm:text-base font-medium">
            Campaign & field operations suite
          </p>
        </motion.div>

        <motion.div
          key={shake}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 sm:p-9"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={
            shake
              ? { opacity: 1, y: 0, scale: 1, x: [0, -10, 10, -8, 8, -4, 4, 0] }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={
            shake
              ? { x: { duration: 0.5, ease: 'easeInOut' } }
              : { duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }
          }
        >
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>

          <div className="flex gap-1 p-1 mb-6 bg-gray-100/90 rounded-xl relative">
            <button
              type="button"
              onClick={() => setLoginType('email')}
              className={`relative flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 ${
                loginType === 'email' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginType('phone')}
              className={`relative flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors z-10 ${
                loginType === 'phone' ? 'text-primary-600' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Phone
            </button>
            <motion.div
              className="absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm"
              initial={false}
              animate={{ x: loginType === 'email' ? 4 : 'calc(100% + 4px)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {loginType === 'email' ? (
                <motion.div
                  key="email"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              ) : (
                <motion.div
                  key="phone"
                  variants={fieldVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  transition={{ duration: 0.2 }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>

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

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-base font-semibold mt-2"
              whileHover={{ scale: loading ? 1 : 1.015 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span
                    key="loading"
                    className="inline-flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Signing in…
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Sign in
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <motion.div
            className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs font-semibold text-gray-600 mb-2">Demo</p>
            <p className="text-xs text-gray-500">admin@example.com / admin123</p>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-center text-primary-100/90 text-sm mt-6 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Built for Indian election campaigns
        </motion.p>
      </motion.div>
    </div>
  )
}
