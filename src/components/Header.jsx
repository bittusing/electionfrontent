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
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        {/* Search Bar (Desktop) */}
        <div className="hidden lg:block flex-1 max-w-lg">
          <input
            type="search"
            placeholder="Search..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 text-red-600"
              title="Logout"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Logout */}
          <button
            onClick={handleLogout}
            className="sm:hidden p-2 rounded-lg hover:bg-red-50 text-red-600"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
