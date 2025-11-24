'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'

export default function InventoryPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [adjustment, setAdjustment] = useState({
    type: 'add',
    quantity: 0,
    reason: ''
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
      setInventory([
        { id: 1, sku: 'PROD-001', name: 'Modern Sofa', quantity: 45, reserved: 3, location: 'Warehouse A' },
        { id: 2, sku: 'PROD-002', name: 'Dining Table', quantity: 12, reserved: 1, location: 'Warehouse A' },
        { id: 3, sku: 'PROD-003', name: 'Office Chair', quantity: 0, reserved: 0, location: 'Warehouse B' },
      ])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustInventory = (item: any) => {
    setSelectedItem(item)
    setAdjustment({ type: 'add', quantity: 0, reason: '' })
    setShowModal(true)
  }

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (adjustment.quantity <= 0) {
      alert(t.inventory.quantityRequired)
      return
    }

    if (!adjustment.reason.trim()) {
      alert(t.inventory.reasonRequired)
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      
      // Mock adjustment
      const newQuantity = adjustment.type === 'add' 
        ? selectedItem.quantity + adjustment.quantity
        : Math.max(0, selectedItem.quantity - adjustment.quantity)

      setInventory(inventory.map(item => 
        item.id === selectedItem.id 
          ? { ...item, quantity: newQuantity }
          : item
      ))

      alert(t.inventory.adjustedSuccess)
      setShowModal(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      alert(t.inventory.adjustedError)
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
            <h1 className="text-2xl font-semibold text-ui-fg-base">{t.inventory.title}</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">{t.inventory.subtitle}</p>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>{t.inventory.sku}</th>
                  <th>{t.inventory.product}</th>
                  <th>{t.inventory.available}</th>
                  <th>{t.inventory.reserved}</th>
                  <th>{t.inventory.location}</th>
                  <th>{t.common.actions}</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono text-sm">{item.sku}</td>
                    <td className="font-medium">{item.name}</td>
                    <td>
                      <span className={item.quantity === 0 ? 'text-red-600' : 'text-ui-fg-base'}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="text-ui-fg-muted">{item.reserved}</td>
                    <td className="text-ui-fg-muted">{item.location}</td>
                    <td>
                      <button onClick={() => handleAdjustInventory(item)} className="btn-ghost txt-compact-small">{t.inventory.adjust}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adjust Inventory Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">{t.inventory.adjustInventory}</h3>
              <div className="mb-4">
                <p className="text-sm text-ui-fg-muted">{t.inventory.product}: <span className="font-medium text-ui-fg-base">{selectedItem.name}</span></p>
                <p className="text-sm text-ui-fg-muted">{t.inventory.sku}: <span className="font-medium text-ui-fg-base">{selectedItem.sku}</span></p>
                <p className="text-sm text-ui-fg-muted">{t.inventory.currentQuantity}: <span className="font-medium text-ui-fg-base">{selectedItem.quantity}</span></p>
              </div>
              <form onSubmit={handleSubmitAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.inventory.adjustmentType}</label>
                  <select
                    value={adjustment.type}
                    onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="add">{t.inventory.addStock}</option>
                    <option value="remove">{t.inventory.removeStock}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.inventory.quantity} *</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustment.quantity}
                    onChange={(e) => setAdjustment({ ...adjustment, quantity: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.inventory.reason} *</label>
                  <textarea
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                    className="input w-full"
                    rows={3}
                    placeholder={t.inventory.reasonPlaceholder}
                    required
                  />
                </div>
                <div className="p-3 bg-ui-bg-subtle rounded">
                  <p className="text-sm">
                    {t.inventory.newQuantity}: <span className="font-semibold">
                      {adjustment.type === 'add' 
                        ? selectedItem.quantity + adjustment.quantity
                        : Math.max(0, selectedItem.quantity - adjustment.quantity)
                      }
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    {t.common.cancel}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t.inventory.confirmAdjustment}
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
