'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

export default function RegionsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [regions, setRegions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD',
    tax_rate: 0,
    countries: 1
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
      setRegions([
        { id: 1, name: 'North America', countries: 3, currency: 'USD', tax_rate: 8.5 },
        { id: 2, name: 'Europe', countries: 27, currency: 'EUR', tax_rate: 20.0 },
        { id: 3, name: 'Asia Pacific', countries: 12, currency: 'USD', tax_rate: 10.0 },
      ])
    } catch (error) {
      console.error('Error loading regions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({ name: '', currency: 'USD', tax_rate: 0, countries: 1 })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    try {
      const newRegion = {
        id: Date.now(),
        ...formData
      }
      setRegions([...regions, newRegion])
      alert('Region created successfully')
      setShowModal(false)
      setFormData({ name: '', currency: 'USD', tax_rate: 0, countries: 1 })
    } catch (error) {
      console.error('Error creating region:', error)
      alert('Failed to create region')
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
            <h1 className="text-2xl font-semibold text-ui-fg-base">Regions</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage geographic regions and currencies</p>
          </div>
          <button onClick={handleCreate} className="btn-primary">
            {t.regions.addRegion}
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Countries</th>
                  <th>Currency</th>
                  <th>Tax Rate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.id}>
                    <td className="font-medium">{region.name}</td>
                    <td className="text-ui-fg-muted">{region.countries} countries</td>
                    <td className="font-mono text-sm">{region.currency}</td>
                    <td className="text-ui-fg-muted">{region.tax_rate}%</td>
                    <td>
                      <button className="btn-ghost txt-compact-small">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Region Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create Region</h3>
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
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input w-full"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Countries</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.countries}
                    onChange={(e) => setFormData({ ...formData, countries: parseInt(e.target.value) || 1 })}
                    className="input w-full"
                  />
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
