'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

export default function ShippingPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    region: 'North America',
    price: 0,
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
      setShippingOptions([
        { id: 1, name: 'Standard Shipping', region: 'North America', price: 5.99, enabled: true },
        { id: 2, name: 'Express Shipping', region: 'North America', price: 15.99, enabled: true },
        { id: 3, name: 'International', region: 'Europe', price: 25.00, enabled: true },
      ])
    } catch (error) {
      console.error('Error loading shipping:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({ name: '', region: 'North America', price: 0, enabled: true })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || formData.price < 0) {
      alert('Name and valid price are required')
      return
    }

    try {
      const newOption = {
        id: Date.now(),
        ...formData
      }
      setShippingOptions([...shippingOptions, newOption])
      alert('Shipping option added successfully')
      setShowModal(false)
      setFormData({ name: '', region: 'North America', price: 0, enabled: true })
    } catch (error) {
      console.error('Error adding shipping option:', error)
      alert('Failed to add shipping option')
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
            <h1 className="text-2xl font-semibold text-ui-fg-base">Shipping</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage shipping options and rates</p>
          </div>
          <button onClick={handleAdd} className="btn-primary">
            {t.shipping.addShipping}
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Region</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shippingOptions.map((option) => (
                  <tr key={option.id}>
                    <td className="font-medium">{option.name}</td>
                    <td className="text-ui-fg-muted">{option.region}</td>
                    <td className="font-medium">${option.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${option.enabled ? 'badge-success' : 'badge-neutral'}`}>
                        {option.enabled ? 'enabled' : 'disabled'}
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

        {/* Add Shipping Option Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Add Shipping Option</h3>
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
                    <option value="International">International</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
                    Add
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
