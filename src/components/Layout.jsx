import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMapPin } from 'react-icons/fi'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuthStore } from '../store/authStore'

function WorkScopeBanner() {
  const { workScope } = useAuthStore()
  if (!workScope || workScope.fullAccess) return null

  return (
    <div className="mb-4 rounded-xl border border-primary-200/80 bg-primary-50/90 px-4 py-3 text-sm text-primary-950 shadow-sm">
      <div className="flex items-start gap-2">
        <FiMapPin className="w-5 h-5 shrink-0 mt-0.5 text-primary-600" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary-900">Your assigned work area (data you can see)</p>
          <p className="text-primary-800/90 mt-1">{workScope.message}</p>
          {workScope.assignedRoots?.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-gray-800">
              {workScope.assignedRoots.map((row) => (
                <li key={row.areaId} className="rounded-lg bg-white/70 px-2 py-1.5 border border-primary-100">
                  <span className="font-medium text-primary-800">{row.type}</span>
                  {row.code ? ` · ${row.code}` : ''}: <span className="font-semibold">{row.name}</span>
                  <div className="text-gray-600 mt-0.5 break-words">{row.breadcrumb}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/40 relative overflow-x-hidden">
      <div
        className="pointer-events-none fixed -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary-200/15 blur-3xl animate-blob"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-96 h-96 rounded-full bg-accent-400/10 blur-3xl animate-blob-slow"
        aria-hidden
      />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <WorkScopeBanner />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
