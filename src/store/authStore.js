import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      permissions: null,
      role: null,
      assignedAreas: [],
      /** Booth / volunteer: which areas APIs use + breadcrumbs (from GET /auth/work-scope). */
      workScope: null,

      setAuth: (user, token) => set({
        user,
        token,
        assignedAreas: user?.assignedAreas || []
      }),

      setPermissions: (permissions, role) => set({ permissions, role }),

      setWorkScope: (workScope) => set({ workScope }),

      logout: () => set({
        user: null,
        token: null,
        permissions: null,
        role: null,
        assignedAreas: [],
        workScope: null,
      }),

      hasPermission: (module, action = 'view') => {
        const { permissions } = get()
        return permissions?.[module]?.[action] === true
      },

      isAdmin: () => {
        const { role } = get()
        return role === 'SUPER_ADMIN' || role === 'STATE_ADMIN'
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
