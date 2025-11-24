'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

export default function GiftCardsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [giftCards, setGiftCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    value: 0,
    currency: 'USD'
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
      setGiftCards([
        { id: 1, code: 'GIFT-2024-ABC', balance: 100.00, original: 100.00, status: 'active' },
        { id: 2, code: 'GIFT-2024-DEF', balance: 45.50, original: 50.00, status: 'active' },
        { id: 3, code: 'GIFT-2024-GHI', balance: 0, original: 75.00, status: 'used' },
      ])
    } catch (error) {
      console.error('Error loading gift cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    const randomCode = 'GIFT-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    setFormData({ code: randomCode, value: 0, currency: 'USD' })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim() || formData.value <= 0) {
      alert('Code and value are required')
      return
    }

    try {
      const newCard = {
        id: Date.now(),
        code: formData.code,
        balance: formData.value,
        original: formData.value,
        status: 'active'
      }
      setGiftCards([...giftCards, newCard])
      alert('Gift card created successfully')
      setShowModal(false)
      setFormData({ code: '', value: 0, currency: 'USD' })
    } catch (error) {
      console.error('Error creating gift card:', error)
      alert('Failed to create gift card')
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
            <h1 className="text-2xl font-semibold text-ui-fg-base">Gift Cards</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage gift cards and balances</p>
          </div>
          <button onClick={handleCreate} className="btn-primary">
            {t.giftCards.addGiftCard}
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Balance</th>
                  <th>Original Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.map((card) => (
                  <tr key={card.id}>
                    <td className="font-mono text-sm">{card.code}</td>
                    <td className="font-medium">${card.balance.toFixed(2)}</td>
                    <td className="text-ui-fg-muted">${card.original.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${card.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                        {card.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn-ghost txt-compact-small">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Gift Card Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">{t.giftCards.addGiftCard}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
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
                  </select>
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
