import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <motion.header
      className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 h-16 shadow-sm"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-primary-50 text-gray-700 lg:hidden transition-colors active:scale-95"
          aria-label="Open menu"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        <div className="hidden lg:block flex-1 max-w-lg">
          <motion.input
            type="search"
            placeholder="Search…"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-400 transition-colors text-sm"
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:ml-4">
          <motion.button
            type="button"
            className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Notifications"
            whileHover={{ rotate: [0, -12, 10, -6, 0] }}
            transition={{ duration: 0.5 }}
          >
            <FiBell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white animate-ping" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
          </motion.button>

          <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-gray-200">
            <div className="text-right min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[140px]">
                {user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-all active:scale-90"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="sm:hidden p-2.5 rounded-xl hover:bg-red-50 text-red-600 active:scale-90 transition-transform"
            aria-label="Logout"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
