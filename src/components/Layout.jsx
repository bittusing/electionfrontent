import { useState } from 'react'
import { Outlet } from 'react-router-dom'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/40">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-6 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
          <WorkScopeBanner />
          <Outlet />
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
