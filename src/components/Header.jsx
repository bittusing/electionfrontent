import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
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
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/80 h-16 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-primary-50 text-gray-700 lg:hidden transition-colors"
          aria-label="Open menu"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        <div className="hidden lg:block flex-1 max-w-lg">
          <input
            type="search"
            placeholder="Search…"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-400 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:ml-4">
          <button
            type="button"
            className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Notifications"
          >
            <FiBell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
          </button>

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
              className="p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="sm:hidden p-2.5 rounded-xl hover:bg-red-50 text-red-600"
            aria-label="Logout"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
