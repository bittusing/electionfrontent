import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { useAuthBootstrap } from './hooks/useAuthBootstrap'
import RequirePermission from './components/RequirePermission'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import MessagingCampaigns from './pages/MessagingCampaigns'
import Areas from './pages/Areas'
import Voters from './pages/Voters'
import VoterBulkUpload from './pages/VoterBulkUpload'
import VoterDetail from './pages/VoterDetail'
import Tasks from './pages/Tasks'
import Rallies from './pages/Rallies'
import DailyReports from './pages/DailyReports'
import Workers from './pages/Workers'
import Analytics from './pages/Analytics'
import Users from './pages/Users'
import Settings from './pages/Settings'

import Layout from './components/Layout'
import ThemeProvider from './components/ThemeProvider'

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

function AppRoutes() {
  useAuthBootstrap()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <RequirePermission module="dashboard">
            <Dashboard />
          </RequirePermission>
        } />
        <Route path="campaigns" element={
          <RequirePermission module="campaigns">
            <Campaigns />
          </RequirePermission>
        } />
        <Route path="messaging" element={
          <RequirePermission module="campaigns">
            <MessagingCampaigns />
          </RequirePermission>
        } />
        <Route path="areas" element={
          <RequirePermission module="areas">
            <Areas />
          </RequirePermission>
        } />
        <Route path="voters" element={
          <RequirePermission module="voters">
            <Voters />
          </RequirePermission>
        } />
        <Route path="voters/bulk-upload" element={
          <RequirePermission module="voters" action="bulkImport">
            <VoterBulkUpload />
          </RequirePermission>
        } />
        <Route path="voters/:id" element={
          <RequirePermission module="voters">
            <VoterDetail />
          </RequirePermission>
        } />
        <Route path="tasks" element={
          <RequirePermission module="tasks">
            <Tasks />
          </RequirePermission>
        } />
        <Route path="rallies" element={
          <RequirePermission module="rallies">
            <Rallies />
          </RequirePermission>
        } />
        <Route path="reports" element={
          <RequirePermission module="reports">
            <DailyReports />
          </RequirePermission>
        } />
        <Route path="workers" element={
          <RequirePermission module="workers">
            <Workers />
          </RequirePermission>
        } />
        <Route path="analytics" element={
          <RequirePermission module="reports" action="viewAll">
            <Analytics />
          </RequirePermission>
        } />
        <Route path="users" element={
          <RequirePermission module="users">
            <Users />
          </RequirePermission>
        } />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <>
      <Router>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  )
}

export default App
