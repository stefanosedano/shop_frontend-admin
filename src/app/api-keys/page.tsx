'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'

export default function ApiKeysPage() {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

    try {
      // Mock data
      setApiKeys([
        { id: 1, name: 'Production Key', key: 'pk_live_***********************abc', created: '2024-01-15', last_used: '2024-11-16' },
        { id: 2, name: 'Development Key', key: 'pk_test_***********************def', created: '2024-01-15', last_used: '2024-11-15' },
        { id: 3, name: 'Mobile App', key: 'pk_live_***********************ghi', created: '2024-03-20', last_used: '2024-11-16' },
      ])
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
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
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-ui-fg-base">API Keys</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage API keys and access tokens</p>
          </div>
          <button className="btn-primary">
            Create API Key
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="font-medium">{key.name}</td>
                    <td className="font-mono text-sm text-ui-fg-muted">{key.key}</td>
                    <td className="text-ui-fg-muted">{key.created}</td>
                    <td className="text-ui-fg-muted">{key.last_used}</td>
                    <td>
                      <button className="btn-ghost txt-compact-small text-red-600">Revoke</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
