'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

interface PaymentCollection {
  id: number
  order_id: number
  order_number: string
  amount: number
  currency_code: string
  status: string
  created_at: string
  sessions_count: number
  payments_count: number
}

interface PaymentStats {
  total_payments: number
  total_captured: number
  total_refunds: number
  net_revenue: number
  pending_collections: number
  failed_collections: number
}

export default function PaymentsPage() {
  const router = useRouter()
  const [collections, setCollections] = useState<PaymentCollection[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const fetchData = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      setLoading(true)
      
      const statsResponse = await axios.get(`${API_URL}/admin/payments/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(statsResponse.data)
      
      const url = statusFilter 
        ? `${API_URL}/admin/payments/collections?status=${statusFilter}`
        : `${API_URL}/admin/payments/collections`
      const collectionsResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCollections(collectionsResponse.data.collections)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      captured: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
  }

  const handleViewDetails = (id: number) => {
    alert(`View payment collection #${id}`)
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
        <div className="mb-6">
          <h1 className="text-lg font-medium text-gray-900 mb-6">Payments</h1>
          <p className="text-ui-fg-muted">View and manage all payment transactions</p>
        </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-ui-fg-muted txt-compact-small mb-2">Total Payments</h3>
            <p className="text-3xl font-semibold text-ui-fg-base">{stats.total_payments}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-ui-fg-muted txt-compact-small mb-2">Total Captured</h3>
            <p className="text-3xl font-semibold text-green-600">${stats.total_captured.toFixed(2)}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-ui-fg-muted txt-compact-small mb-2">Net Revenue</h3>
            <p className="text-3xl font-semibold text-ui-fg-base">${stats.net_revenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-ui-fg-base mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-ui-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-ui-bg-interactive"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="captured">Captured</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order Number</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Sessions</th>
              <th>Payments</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-ui-fg-muted py-8">
                  No payment collections found
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id}>
                  <td>{collection.id}</td>
                  <td className="font-medium">{collection.order_number}</td>
                  <td>${collection.amount.toFixed(2)}</td>
                  <td>{collection.currency_code.toUpperCase()}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(collection.status)}`}>
                      {collection.status}
                    </span>
                  </td>
                  <td>{collection.sessions_count}</td>
                  <td>{collection.payments_count}</td>
                  <td>{new Date(collection.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(collection.id)}
                      className="text-gray-900 hover:text-gray-700 mr-4"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/orders?id=${collection.order_id}`)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View Order
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </AdminLayout>
  )
}
