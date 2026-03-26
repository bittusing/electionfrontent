import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RequirePermission({ module, action = 'view', children }) {
  const { permissions, token } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!permissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const hasAccess = permissions?.[module]?.[action] === true

  if (!hasAccess) {
    return <Unauthorized />
  }

  return children
}

function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Access Denied</h1>
      <p className="text-gray-500 max-w-md mb-6">
        You don't have permission to access this page. Contact your administrator if you believe this is an error.
      </p>
      <a href="/" className="btn-primary">
        Go to Dashboard
      </a>
    </div>
  )
}
