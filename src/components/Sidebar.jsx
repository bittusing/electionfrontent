import { NavLink } from 'react-router-dom'
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
  { name: 'Analytics', icon: FiBarChart2, path: '/analytics', permModule: 'reports', permAction: 'viewAll' },
  { name: 'Users', icon: FiUsers, path: '/users', permModule: 'users' },
  { name: 'Settings', icon: FiSettings, path: '/settings', alwaysShow: true },
]

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
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r border-gray-200">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <span className="text-2xl mr-2">🗳️</span>
            <span className="text-xl font-bold text-gray-800">Election CRM</span>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{displayRole}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🗳️</span>
              <span className="text-xl font-bold text-gray-800">Election CRM</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{displayRole}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
