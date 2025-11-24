'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

interface Setting {
  id: number
  key: string
  value: string
  category: string
  description: string
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Setting[]>([])
  
  // Form data
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo')
  const [storeName, setStoreName] = useState('')
  const [storeEmail, setStoreEmail] = useState('')
  const [storePhone, setStorePhone] = useState('')

  useEffect(() => {
    checkAuthAndLoadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndLoadSettings = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSettings(response.data)
      
      // Populate form with existing settings
      response.data.forEach((setting: Setting) => {
        switch (setting.key) {
          case 'openai_api_key':
            setOpenaiApiKey(setting.value || '')
            break
          case 'openai_model':
            setOpenaiModel(setting.value || 'gpt-3.5-turbo')
            break
          case 'store_name':
            setStoreName(setting.value || '')
            break
          case 'store_email':
            setStoreEmail(setting.value || '')
            break
          case 'store_phone':
            setStorePhone(setting.value || '')
            break
        }
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      localStorage.removeItem('admin_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const token = localStorage.getItem('admin_token')
      const settingsToUpdate: Record<string, string> = {
        openai_api_key: openaiApiKey,
        openai_model: openaiModel,
        store_name: storeName,
        store_email: storeEmail,
        store_phone: storePhone
      }

      await axios.post(
        `${API_URL}/admin/settings/bulk`,
        settingsToUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert('Settings saved successfully')
      await checkAuthAndLoadSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
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
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-ui-fg-base">Settings</h1>
          <p className="text-ui-fg-muted mt-1 txt-compact-medium">
            Manage your store settings and AI configuration
          </p>
        </div>

        <div className="space-y-6">
          {/* OpenAI Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
              OpenAI Configuration
            </h2>
            <p className="text-sm text-ui-fg-muted mb-4">
              Configure OpenAI API for automatic product and category translations
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input-field w-full"
                />
                <p className="text-xs text-ui-fg-muted mt-1">
                  Your OpenAI API key (keep this secret)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  GPT Model
                </label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Economical)</option>
                  <option value="gpt-4">GPT-4 (Better Quality)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Faster GPT-4)</option>
                  <option value="gpt-4o">GPT-4o (Latest & Best)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
                </select>
                <p className="text-xs text-ui-fg-muted mt-1">
                  Model used for AI translations - GPT-4 models provide better translations but cost more
                </p>
              </div>

              <div className="bg-ui-bg-subtle p-4 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-ui-fg-interactive mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-ui-fg-subtle">
                    <strong>Model Comparison:</strong>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• <strong>GPT-3.5 Turbo:</strong> Best for high-volume, quick translations (~$0.002/1K tokens)</li>
                      <li>• <strong>GPT-4o Mini:</strong> Good balance of quality and speed (~$0.15/1M input tokens)</li>
                      <li>• <strong>GPT-4o:</strong> Best quality for product descriptions (~$2.50/1M input tokens)</li>
                      <li>• <strong>GPT-4 Turbo:</strong> High-quality, good for detailed content (~$10/1M input tokens)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ui-fg-base mb-4">
              Store Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  Store Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="My Shop"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  Store Email
                </label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="info@myshop.com"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ui-fg-base mb-2">
                  Store Phone
                </label>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
