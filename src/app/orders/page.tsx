'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type SortField = 'id' | 'created_at' | 'customer' | 'status' | 'payment_status' | 'total_amount'
type SortDirection = 'asc' | 'desc' | null

export default function OrdersPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
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

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setOrders([])
      checkAuthAndLoadOrders(true)
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortDirection])

  const buildQueryString = () => {
    const params = new URLSearchParams()
    
    if (filters.id) params.append('id', filters.id)
    if (filters.date) params.append('date', filters.date)
    if (filters.customer) params.append('customer', filters.customer)
    if (filters.status) params.append('status', filters.status)
    if (filters.payment_status) params.append('payment_status', filters.payment_status)
    if (filters.total) params.append('total', filters.total)
    if (sortField) {
      params.append('sort', sortField)
      if (sortDirection) params.append('order', sortDirection)
    }
    
    return params.toString()
  }

  const checkAuthAndLoadOrders = async (resetPage = false) => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    if (resetPage) {
      setLoading(true)
    }

    try {
      const currentPage = resetPage ? 1 : page
      const queryString = buildQueryString()
      const url = `${API_URL}/admin/orders/${queryString ? '?' + queryString : ''}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(response.data) ? response.data : response.data.orders || response.data.data || []
      
      if (resetPage) {
        setOrders(data)
        setPage(1)
      } else {
        setOrders(data)
      }
      setHasMore(data.length >= 50)
    } catch (error) {
      console.error('Error loading orders:', error)
      if (error?.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMoreOrders = useCallback(async () => {
    if (loadingMore || !hasMore) return

    const token = localStorage.getItem('admin_token')
    if (!token) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const queryString = buildQueryString()
      const url = `${API_URL}/admin/orders/${queryString ? '?' + queryString + '&' : '?'}page=${nextPage}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(response.data) ? response.data : response.data.orders || response.data.data || []
      
      if (data.length > 0) {
        setOrders(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(o => o.id))
          const newOrders = data.filter(o => !existingIds.has(o.id))
          return [...prev, ...newOrders]
        })
        setPage(nextPage)
        setHasMore(data.length >= 50)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more orders:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, page, filters, sortField, sortDirection])

  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return

      // Find the scrollable main element
      const mainElement = document.querySelector('main')
      if (!mainElement) return

      const scrollPosition = mainElement.scrollTop + mainElement.clientHeight
      const scrollHeight = mainElement.scrollHeight
      
      // Load more when within 300px of the bottom
      if (scrollPosition >= scrollHeight - 300) {
        loadMoreOrders()
      }
    }

    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll)
      return () => mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [loading, loadingMore, hasMore, loadMoreOrders])

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  }

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
                        <span className="text-xs font-medium text-gray-500 tracking-wide">{t.orders.orderId}</span>
                        <button onClick={() => handleSort('id')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="id" />
                        </button>
                      </div>
                      <input
                        id="filter-order-id"
                        name="filter-order-id"
                        type="text"
                        placeholder="Filter..."
                        value={filters.id}
                        onChange={(e) => handleFilterChange('id', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">{t.orders.date}</span>
                        <button onClick={() => handleSort('created_at')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="created_at" />
                        </button>
                      </div>
                      <input
                        id="filter-order-date"
                        name="filter-order-date"
                        type="text"
                        placeholder="Dec, 2025, 15..."
                        value={filters.date}
                        onChange={(e) => handleFilterChange('date', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">{t.orders.customer}</span>
                        <button onClick={() => handleSort('customer')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="customer" />
                        </button>
                      </div>
                      <input
                        id="filter-order-customer"
                        name="filter-order-customer"
                        type="text"
                        placeholder="Filter..."
                        value={filters.customer}
                        onChange={(e) => handleFilterChange('customer', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">{t.orders.status}</span>
                        <button onClick={() => handleSort('status')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="status" />
                        </button>
                      </div>
                      <input
                        id="filter-order-status"
                        name="filter-order-status"
                        type="text"
                        placeholder="Filter..."
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">{t.orders.paymentStatus}</span>
                        <button onClick={() => handleSort('payment_status')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="payment_status" />
                        </button>
                      </div>
                      <input
                        id="filter-order-payment-status"
                        name="filter-order-payment-status"
                        type="text"
                        placeholder="Filter..."
                        value={filters.payment_status}
                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 tracking-wide">{t.orders.total}</span>
                        <button onClick={() => handleSort('total_amount')} className="hover:bg-gray-200 rounded p-1">
                          <SortIcon field="total_amount" />
                        </button>
                      </div>
                      <input
                        id="filter-order-total"
                        name="filter-order-total"
                        type="text"
                        placeholder=">520, <850, =30..."
                        value={filters.total}
                        onChange={(e) => handleFilterChange('total', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order, index) => (
                    <tr key={`order-${order.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
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
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-sm text-gray-500">{t.messages.loadingMore}</span>
                </div>
              )}
              {!hasMore && orders.length > 0 && (
                <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                  {t.orders.allOrders}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
