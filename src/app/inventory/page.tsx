'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../../components/AdminLayout'

export default function InventoryPage() {
  const router = useRouter()
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
      alert('Quantity must be greater than 0')
      return
    }

    if (!adjustment.reason.trim()) {
      alert('Reason is required')
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

      alert(`Inventory ${adjustment.type === 'add' ? 'increased' : 'decreased'} successfully`)
      setShowModal(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Error adjusting inventory:', error)
      alert('Failed to adjust inventory')
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
            <h1 className="text-2xl font-semibold text-ui-fg-base">Inventory</h1>
            <p className="text-ui-fg-muted mt-1 txt-compact-medium">Manage stock levels and locations</p>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Location</th>
                  <th>Actions</th>
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
                      <button onClick={() => handleAdjustInventory(item)} className="btn-ghost txt-compact-small">Adjust</button>
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
              <h3 className="text-lg font-semibold mb-4">Adjust Inventory</h3>
              <div className="mb-4">
                <p className="text-sm text-ui-fg-muted">Product: <span className="font-medium text-ui-fg-base">{selectedItem.name}</span></p>
                <p className="text-sm text-ui-fg-muted">SKU: <span className="font-medium text-ui-fg-base">{selectedItem.sku}</span></p>
                <p className="text-sm text-ui-fg-muted">Current Quantity: <span className="font-medium text-ui-fg-base">{selectedItem.quantity}</span></p>
              </div>
              <form onSubmit={handleSubmitAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                  <select
                    value={adjustment.type}
                    onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
                    className="input w-full"
                  >
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity *</label>
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
                  <label className="block text-sm font-medium mb-1">Reason *</label>
                  <textarea
                    value={adjustment.reason}
                    onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                    className="input w-full"
                    rows={3}
                    placeholder="e.g., Stock receipt, Damaged goods, etc."
                    required
                  />
                </div>
                <div className="p-3 bg-ui-bg-subtle rounded">
                  <p className="text-sm">
                    New Quantity: <span className="font-semibold">
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
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Confirm Adjustment
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
