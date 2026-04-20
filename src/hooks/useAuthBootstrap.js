import { useEffect, useRef } from 'react'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'

export function useAuthBootstrap() {
  const { token, permissions, setPermissions, setAuth, setWorkScope, logout } = useAuthStore()
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!token) {
      bootstrapped.current = false
      return
    }
    if (bootstrapped.current) return
    bootstrapped.current = true

    const bootstrap = async () => {
      try {
        if (!permissions) {
          const { data } = await api.get('/permissions/my-permissions')
          if (data.success) {
            setPermissions(data.data.permissions, data.data.role)
          }
        }

        const { data: profileData } = await api.get('/auth/profile')
        if (profileData.success && profileData.data) {
          const user = profileData.data
          setAuth({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            assignedAreas: user.assignedAreas || []
          }, token)
        }

        try {
          const { data: scopeData } = await api.get('/auth/work-scope')
          if (scopeData.success && scopeData.data) {
            setWorkScope(scopeData.data)
          }
        } catch {
          setWorkScope(null)
        }
      } catch (error) {
        if (error.response?.status === 401) {
          logout()
        }
      }
    }

    bootstrap()
  }, [token])
}
