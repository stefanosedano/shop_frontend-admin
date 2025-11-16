'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type SortField = 'id' | 'created_at' | 'customer' | 'status' | 'payment_status' | 'total_amount'
type SortDirection = 'asc' | 'desc' | null

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filters, setFilters] = useState({
    id: '',
    date: '',
    customer: '',
    status: '',
    payment_status: '',
    total: ''
  })

  useEffect(() => {
    checkAuthAndLoadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndLoadOrders = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrders(response.data)
    } catch (error) {
      console.error('Error loading orders:', error)
      localStorage.removeItem('admin_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-50 text-orange-700',
      processing: 'bg-blue-50 text-blue-700',
      shipped: 'bg-purple-50 text-purple-700',
      delivered: 'bg-green-50 text-green-700',
      cancelled: 'bg-red-50 text-red-700'
    }
    return colors[status] || 'bg-gray-50 text-gray-700'
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }))
  }

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders]

    // Apply filters
    if (filters.id) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(filters.id)
      )
    }
    if (filters.date) {
      filtered = filtered.filter(order => 
        new Date(order.created_at).toLocaleDateString().toLowerCase().includes(filters.date.toLowerCase())
      )
    }
    if (filters.customer) {
      filtered = filtered.filter(order => 
        (order.user?.email || 'Guest').toLowerCase().includes(filters.customer.toLowerCase())
      )
    }
    if (filters.status) {
      filtered = filtered.filter(order => 
        order.status.toLowerCase().includes(filters.status.toLowerCase())
      )
    }
    if (filters.payment_status) {
      filtered = filtered.filter(order => 
        (order.payment_status || 'paid').toLowerCase().includes(filters.payment_status.toLowerCase())
      )
    }
    if (filters.total) {
      filtered = filtered.filter(order => 
        order.total_amount?.toString().includes(filters.total)
      )
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal, bVal

        switch (sortField) {
          case 'id':
            aVal = a.id
            bVal = b.id
            break
          case 'created_at':
            aVal = new Date(a.created_at).getTime()
            bVal = new Date(b.created_at).getTime()
            break
          case 'customer':
            aVal = (a.user?.email || 'Guest').toLowerCase()
            bVal = (b.user?.email || 'Guest').toLowerCase()
            break
          case 'status':
            aVal = a.status.toLowerCase()
            bVal = b.status.toLowerCase()
            break
          case 'payment_status':
            aVal = (a.payment_status || 'paid').toLowerCase()
            bVal = (b.payment_status || 'paid').toLowerCase()
            break
          case 'total_amount':
            aVal = a.total_amount || 0
            bVal = b.total_amount || 0
            break
          default:
            return 0
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [orders, filters, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-4 h-4 text-blue-600" />
    }
    return <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-lg font-medium text-gray-900">Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No records</h3>
              <p className="text-sm text-gray-500">Your orders will show up here.</p>
            </div>
          </div>
        ) : (
          <div className="px-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">Order</span>
                        <button onClick={() => handleSort('id')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="id" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.id}
                        onChange={(e) => handleFilterChange('id', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">Date</span>
                        <button onClick={() => handleSort('created_at')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="created_at" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">Customer</span>
                        <button onClick={() => handleSort('customer')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="customer" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.customer}
                        onChange={(e) => handleFilterChange('customer', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">Fulfillment</span>
                        <button onClick={() => handleSort('status')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="status" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">Payment status</span>
                        <button onClick={() => handleSort('payment_status')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="payment_status" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.payment_status}
                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">Total</span>
                        <button onClick={() => handleSort('total_amount')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="total_amount" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.total}
                        onChange={(e) => handleFilterChange('total', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.user?.email || 'Guest'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-md ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs font-medium rounded-md bg-green-50 text-green-700">
                          {order.payment_status || 'paid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">${order.total_amount?.toFixed(2) || '0.00'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
