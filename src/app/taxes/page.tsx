'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

export default function TaxesPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [taxRates, setTaxRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    region: 'North America',
    rate: 0,
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
      setTaxRates([
        { id: 1, name: 'US Sales Tax', region: 'North America', rate: 8.5, enabled: true },
        { id: 2, name: 'EU VAT', region: 'Europe', rate: 20.0, enabled: true },
        { id: 3, name: 'UK VAT', region: 'United Kingdom', rate: 20.0, enabled: true },
      ])
    } catch (error) {
      console.error('Error loading taxes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({ name: '', region: 'North America', rate: 0, enabled: true })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || formData.rate < 0) {
      alert('Name and valid rate are required')
      return
    }

    try {
      const newTaxRate = {
        id: Date.now(),
        ...formData
      }
      setTaxRates([...taxRates, newTaxRate])
      alert('Tax rate created successfully')
      setShowModal(false)
      setFormData({ name: '', region: 'North America', rate: 0, enabled: true })
    } catch (error) {
      console.error('Error creating tax rate:', error)
      alert('Failed to create tax rate')
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium text-gray-900">Taxes</h1>
          <button onClick={handleCreate} className="btn-primary">
            {t.taxes.addTax}
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Region</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxRates.map((tax) => (
                  <tr key={tax.id}>
                    <td className="font-medium">{tax.name}</td>
                    <td className="text-ui-fg-muted">{tax.region}</td>
                    <td className="font-medium">{tax.rate}%</td>
                    <td>
                      <span className={`badge ${tax.enabled ? 'badge-success' : 'badge-neutral'}`}>
                        {tax.enabled ? 'enabled' : 'disabled'}
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

        {/* Create Tax Rate Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Create Tax Rate</h3>
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
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="input w-full"
                  >
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia Pacific">Asia Pacific</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                    required
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
