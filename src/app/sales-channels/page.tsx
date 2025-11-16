'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'

export default function SalesChannelsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true
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

    try {
      // Mock data
      setChannels([
        { id: 1, name: 'Website', description: 'Main e-commerce website', products: 10003, enabled: true },
        { id: 2, name: 'Mobile App', description: 'iOS and Android app', products: 8500, enabled: true },
        { id: 3, name: 'Wholesale', description: 'B2B sales channel', products: 5000, enabled: true },
      ])
    } catch (error) {
      console.error('Error loading sales channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({ name: '', description: '', enabled: true })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    try {
      const newChannel = {
        id: Date.now(),
        ...formData,
        products: 0
      }
      setChannels([...channels, newChannel])
      alert('Sales channel created successfully')
      setShowModal(false)
      setFormData({ name: '', description: '', enabled: true })
    } catch (error) {
      console.error('Error creating sales channel:', error)
      alert('Failed to create sales channel')
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
            <h1 className="text-2xl font-semibold text-ui-fg-base">Sales Channels</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage where your products are sold</p>
          </div>
          <button onClick={handleCreate} className="btn-primary">
            Create Channel
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id}>
                    <td className="font-medium">{channel.name}</td>
                    <td className="text-ui-fg-muted">{channel.description}</td>
                    <td className="text-ui-fg-muted">{channel.products.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${channel.enabled ? 'badge-success' : 'badge-neutral'}`}>
                        {channel.enabled ? 'enabled' : 'disabled'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost txt-compact-small">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Sales Channel Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create Sales Channel</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input w-full"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium">Enabled</label>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
