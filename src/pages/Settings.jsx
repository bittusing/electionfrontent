import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import WhatsAppSettings from '../components/settings/WhatsAppSettings'
import SMSSettings from '../components/settings/SMSSettings'
import EmailSettings from '../components/settings/EmailSettings'
import TemplateSettings from '../components/settings/TemplateSettings'
import ElectionConfigSettings from '../components/settings/ElectionConfigSettings'

export default function Settings() {
  const { permissions, user, role, setAuth, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')

  const canEditSettings = permissions?.settings?.edit
  const canViewSettings = permissions?.settings?.view
  const isAdmin = role === 'SUPER_ADMIN' || role === 'STATE_ADMIN'

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    const validTabs = ['profile', 'election', 'whatsapp', 'sms', 'email', 'templates']
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    window.location.hash = tab
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'election', label: 'Election Config', icon: '🗳️', show: isAdmin || canViewSettings },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', show: canViewSettings },
    { id: 'sms', label: 'SMS', icon: '📱', show: canViewSettings },
    { id: 'email', label: 'Email', icon: '📧', show: canViewSettings },
    { id: 'templates', label: 'Templates', icon: '📝', show: canViewSettings }
  ]

  const visibleTabs = tabs.filter(tab => tab.show !== false)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and system settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <ProfileSettings user={user} token={token} setAuth={setAuth} />
        )}

        {activeTab === 'election' && <ElectionConfigSettings />}
        {activeTab === 'whatsapp' && <WhatsAppSettings />}
        {activeTab === 'sms' && <SMSSettings />}
        {activeTab === 'email' && <EmailSettings />}
        {activeTab === 'templates' && <TemplateSettings />}
      </div>
    </div>
  )
}

function ProfileSettings({ user, token, setAuth }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const { data } = await api.put('/auth/profile', profile)
      if (data.success) {
        setAuth({ ...user, ...profile }, token)
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match')
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters')
    }
    setSavingPassword(true)
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      })
      if (data.success) {
        toast.success('Password changed successfully')
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSaveProfile} className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className="input-field"
                pattern="[0-9]{10}"
                required
              />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <form onSubmit={handleChangePassword} className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                className="input-field"
                minLength="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                className="input-field"
                minLength="6"
                required
              />
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Account Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </div>
        </div>
        {user?.assignedAreas && user.assignedAreas.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Assigned Areas</h3>
            <div className="flex flex-wrap gap-1.5">
              {user.assignedAreas.map((area, i) => (
                <span key={i} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                  {typeof area === 'object' ? area.name : area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
