'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    store_name: 'My Shop',
    store_email: 'admin@shop.com',
    currency: 'USD',
    timezone: 'America/New_York'
  })

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-bg-interactive"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ui-fg-base">Settings</h1>
          <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage your store settings and preferences</p>
        </div>

        <div className="grid gap-6">
          {/* Store Details */}
          <div className="card">
            <h2 className="txt-compact-medium-plus text-ui-fg-base mb-4">Store Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block txt-compact-small text-ui-fg-muted mb-2">Store Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={settings.store_name}
                  onChange={(e) => setSettings({...settings, store_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block txt-compact-small text-ui-fg-muted mb-2">Store Email</label>
                <input
                  type="email"
                  className="input w-full"
                  value={settings.store_email}
                  onChange={(e) => setSettings({...settings, store_email: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="card">
            <h2 className="txt-compact-medium-plus text-ui-fg-base mb-4">Regional Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block txt-compact-small text-ui-fg-muted mb-2">Default Currency</label>
                <select className="select w-full" value={settings.currency}>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              <div>
                <label className="block txt-compact-small text-ui-fg-muted mb-2">Timezone</label>
                <select className="select w-full" value={settings.timezone}>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button className="btn-secondary">Cancel</button>
            <button className="btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
