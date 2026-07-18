import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiHome, FiMap, FiUsers, FiCheckSquare, FiCalendar,
  FiFileText, FiUserCheck, FiBarChart2, FiSettings, FiX, FiTarget, FiMessageSquare
} from 'react-icons/fi'
import { useAuthStore } from '../store/authStore'

const MENU_ITEMS = [
  { name: 'Dashboard', icon: FiHome, path: '/', permModule: 'dashboard' },
  { name: 'Campaigns', icon: FiTarget, path: '/campaigns', permModule: 'campaigns' },
  { name: 'Messaging', icon: FiMessageSquare, path: '/messaging', permModule: 'campaigns' },
  { name: 'Areas', icon: FiMap, path: '/areas', permModule: 'areas' },
  { name: 'Voters', icon: FiUsers, path: '/voters', permModule: 'voters' },
  { name: 'Tasks', icon: FiCheckSquare, path: '/tasks', permModule: 'tasks' },
  { name: 'Rallies', icon: FiCalendar, path: '/rallies', permModule: 'rallies' },
  { name: 'Daily Reports', icon: FiFileText, path: '/reports', permModule: 'reports' },
  { name: 'Workers', icon: FiUserCheck, path: '/workers', permModule: 'workers' },
  { name: 'Analytics', icon: FiBarChart2, path: '/analytics', permModule: 'reports', permAction: 'view' },
  { name: 'Users', icon: FiUsers, path: '/users', permModule: 'users' },
  { name: 'Settings', icon: FiSettings, path: '/settings', alwaysShow: true },
]

function NavItem({ item, pillId, onClick }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
          isActive ? 'text-white' : 'text-gray-700 hover:bg-primary-50/80 hover:text-primary-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={pillId}
              className="absolute inset-0 rounded-xl bg-primary-600 shadow-md shadow-primary-600/25"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <item.icon className="relative z-10 w-5 h-5 mr-3" />
          <span className="relative z-10">{item.name}</span>
        </>
      )}
    </NavLink>
  )
}

function NavList({ items, pillId, onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {items.map((item, i) => (
        <motion.div
          key={item.path}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.03 * i, ease: [0.16, 1, 0.3, 1] }}
        >
          <NavItem item={item} pillId={pillId} onClick={onNavigate} />
        </motion.div>
      ))}
    </nav>
  )
}

export default function Sidebar({ open, setOpen }) {
  const { permissions, role, user } = useAuthStore()

  const visibleMenuItems = MENU_ITEMS.filter(item => {
    if (item.alwaysShow) return true
    const action = item.permAction || 'view'
    return permissions?.[item.permModule]?.[action] === true
  })

  const displayRole = role?.replace(/_/g, ' ')

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white/95 backdrop-blur-md border-r border-gray-200/90 shadow-soft border-l-4 border-l-primary-500">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-5 border-b border-gray-100 bg-gradient-to-r from-primary-50/80 to-white">
            <motion.span
              className="text-2xl mr-2"
              aria-hidden
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
            >
              🗳️
            </motion.span>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Election CRM</span>
          </div>

          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center">
              <div className="w-11 h-11 rounded-xl bg-primary-100 ring-2 ring-primary-200/60 flex items-center justify-center shadow-sm">
                <span className="text-primary-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{displayRole}</p>
              </div>
            </div>
          </div>

          <NavList items={visibleMenuItems} pillId="desktop-active-pill" />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/98 backdrop-blur-md border-r border-gray-200 shadow-xl border-l-4 border-l-primary-500 transform transition-transform duration-300 ease-out lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100 bg-gradient-to-r from-primary-50/80 to-white">
            <div className="flex items-center min-w-0">
              <span className="text-2xl mr-2 shrink-0" aria-hidden>🗳️</span>
              <span className="text-lg font-bold text-gray-900 truncate">Election CRM</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 shrink-0">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center">
              <div className="w-11 h-11 rounded-xl bg-primary-100 ring-2 ring-primary-200/60 flex items-center justify-center shadow-sm">
                <span className="text-primary-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{displayRole}</p>
              </div>
            </div>
          </div>

          <NavList items={visibleMenuItems} pillId="mobile-active-pill" onNavigate={() => setOpen(false)} />
        </div>
      </aside>
    </>
  )
}
