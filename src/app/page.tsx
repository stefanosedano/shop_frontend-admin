'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import AdminLayout from '../components/AdminLayout'
import { useLanguage } from '../context/LanguageContext'
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, Calendar, ChevronDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type DateFilter = 'year' | 'month' | 'week' | 'custom'

export default function AdminDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('month')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, customStartDate, customEndDate, isAuthenticated])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (dateFilter) {
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'week':
        const firstDay = now.getDate() - now.getDay()
        startDate = new Date(now.setDate(firstDay))
        endDate = new Date()
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

  const loadStats = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    try {
      setLoading(true)
      const dateRange = getDateRange()
      const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data)
      setIsAuthenticated(true)
    } catch (error) {
      localStorage.removeItem('admin_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCustomDates = () => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate)
      setCustomEndDate(tempEndDate)
      setDateFilter('custom')
      setShowDatePicker(false)
    }
  }

  const handleCancelCustomDates = () => {
    setTempStartDate(customStartDate)
    setTempEndDate(customEndDate)
    setShowDatePicker(false)
  }

  const handleOpenDatePicker = () => {
    setTempStartDate(customStartDate)
    setTempEndDate(customEndDate)
    setShowDatePicker(true)
  }

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'year':
        return 'This Year'
      case 'month':
        return 'This Month'
      case 'week':
        return 'This Week'
      case 'custom':
        return customStartDate && customEndDate 
          ? `${customStartDate} to ${customEndDate}`
          : 'Custom Range'
      default:
        return 'This Month'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ui-bg-subtle">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-bg-interactive"></div>
      </div>
    )
  }

  if (!isAuthenticated || !stats) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Page Header with Date Filter */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ui-fg-base">{t.dashboard.title}</h1>
              <p className="text-ui-fg-muted mt-1 txt-compact-medium">{t.dashboard.subtitle}</p>
            </div>
            
            {/* Date Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleOpenDatePicker}
                className="btn-secondary flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{getFilterLabel()}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showDatePicker && (
                <div className="absolute right-0 mt-2 w-80 bg-ui-bg-base rounded-lg shadow-elevation-modal border border-ui-border-base z-50">
                  <div className="p-4">
                    {/* Quick Filters */}
                    <div className="space-y-2 mb-4">
                      <button
                        onClick={() => {
                          setDateFilter('week')
                          setShowDatePicker(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors txt-compact-medium ${
                          dateFilter === 'week'
                            ? 'bg-ui-bg-interactive text-white'
                            : 'hover:bg-ui-bg-hover text-ui-fg-base'
                        }`}
                      >
                        {t.dashboard.thisWeek}
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter('month')
                          setShowDatePicker(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors txt-compact-medium ${
                          dateFilter === 'month'
                            ? 'bg-ui-bg-interactive text-white'
                            : 'hover:bg-ui-bg-hover text-ui-fg-base'
                        }`}
                      >
                        {t.dashboard.thisMonth}
                      </button>
                      <button
                        onClick={() => {
                          setDateFilter('year')
                          setShowDatePicker(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors txt-compact-medium ${
                          dateFilter === 'year'
                            ? 'bg-ui-bg-interactive text-white'
                            : 'hover:bg-ui-bg-hover text-ui-fg-base'
                        }`}
                      >
                        {t.dashboard.thisYear}
                      </button>
                    </div>

                    {/* Custom Date Range */}
                    <div className="border-t border-ui-border-base pt-4">
                      <label className="block txt-compact-small-plus text-ui-fg-base mb-3">
                        {t.dashboard.customRange}
                      </label>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block txt-compact-small text-ui-fg-muted mb-1">
                              {t.dashboard.from}
                            </label>
                            <input
                              id="custom-date-from"
                              name="custom-date-from"
                              type="date"
                              value={tempStartDate}
                              onChange={(e) => {
                                setTempStartDate(e.target.value)
                                if (!tempEndDate || e.target.value > tempEndDate) {
                                  setTempEndDate(e.target.value)
                                }
                              }}
                              className="input w-full"
                            />
                          </div>
                          <div>
                            <label className="block txt-compact-small text-ui-fg-muted mb-1">
                              {t.dashboard.to}
                            </label>
                            <input
                              id="custom-date-to"
                              name="custom-date-to"
                              type="date"
                              value={tempEndDate}
                              min={tempStartDate}
                              onChange={(e) => setTempEndDate(e.target.value)}
                              className="input w-full"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCancelCustomDates}
                            className="btn-secondary flex-1"
                          >
                            {t.dashboard.cancel}
                          </button>
                          <button
                            onClick={handleApplyCustomDates}
                            disabled={!tempStartDate || !tempEndDate}
                            className="btn-primary flex-1"
                          >
                            {t.dashboard.applyRange}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={t.dashboard.revenue}
          value={`$${stats.overview.total_revenue.toFixed(2)}`}
          subtitle={`$${stats.today.revenue.toFixed(2)} ${t.dashboard.today}`}
          trend="+12.5%"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title={t.dashboard.orders}
          value={stats.overview.total_orders}
          subtitle={`${stats.today.orders} ${t.dashboard.today}`}
          trend="+8.2%"
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <StatCard
          title={t.dashboard.products}
          value={stats.overview.total_products}
          subtitle={t.dashboard.activeProducts}
          icon={<Package className="w-5 h-5" />}
        />
        <StatCard
          title={t.dashboard.customers}
          value={stats.overview.total_users}
          subtitle={t.dashboard.registeredUsers}
          trend="+5.4%"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Today & This Month Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h2 className="txt-compact-medium-plus text-ui-fg-base mb-4">{t.dashboard.todayPerformance}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-ui-fg-muted txt-compact-medium">{t.dashboard.orders}</span>
              <span className="text-2xl font-semibold text-ui-fg-base">{stats.today.orders}</span>
            </div>
            <div className="h-px bg-ui-border-base"></div>
            <div className="flex justify-between items-center">
              <span className="text-ui-fg-muted txt-compact-medium">{t.dashboard.revenue}</span>
              <span className="text-2xl font-semibold text-ui-fg-interactive">${stats.today.revenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="txt-compact-medium-plus text-ui-fg-base mb-4">{t.dashboard.thisMonth}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-ui-fg-muted txt-compact-medium">{t.dashboard.orders}</span>
              <span className="text-2xl font-semibold text-ui-fg-base">{stats.this_month.orders}</span>
            </div>
            <div className="h-px bg-ui-border-base"></div>
            <div className="flex justify-between items-center">
              <span className="text-ui-fg-muted txt-compact-medium">{t.dashboard.revenue}</span>
              <span className="text-2xl font-semibold text-ui-fg-interactive">${stats.this_month.revenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Status */}
      <div className="card mb-6">
        <h2 className="txt-compact-medium-plus text-ui-fg-base mb-4">{t.dashboard.orderStatusOverview}</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatusBadge
            status={t.dashboard.pending}
            count={stats.order_status.pending}
          />
          <StatusBadge
            status={t.dashboard.processing}
            count={stats.order_status.processing}
          />
          <StatusBadge
            status={t.dashboard.shipped}
            count={stats.order_status.shipped}
          />
          <StatusBadge
            status={t.dashboard.delivered}
            count={stats.order_status.delivered}
          />
          <StatusBadge
            status={t.dashboard.cancelled}
            count={stats.order_status.cancelled}
          />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="txt-compact-medium-plus text-ui-fg-base">{t.dashboard.recentOrders}</h2>
          <Link
            href="/orders"
            className="txt-compact-small-plus text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
          >
            {t.dashboard.viewAll} →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t.dashboard.order}</th>
                <th>{t.dashboard.amount}</th>
                <th>{t.dashboard.orderStatus}</th>
                <th>{t.dashboard.date}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.map((order: any) => (
                <tr key={order.id}>
                  <td className="font-medium">
                    #{order.order_number}
                  </td>
                  <td>
                    ${order.total_amount.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${
                      order.status === 'delivered' ? 'badge-success' :
                      order.status === 'shipped' ? 'badge-info' :
                      order.status === 'processing' ? 'badge-info' :
                      order.status === 'pending' ? 'badge-warning' :
                      'badge-neutral'
                    }`}>
                      {order.status === 'delivered' ? t.dashboard.statusDelivered :
                       order.status === 'shipped' ? t.dashboard.statusShipped :
                       order.status === 'processing' ? t.dashboard.statusProcessing :
                       order.status === 'pending' ? t.dashboard.statusPending :
                       order.status === 'cancelled' ? t.dashboard.statusCancelled :
                       order.status === 'completed' ? t.dashboard.statusCompleted :
                       order.status}
                    </span>
                  </td>
                  <td className="text-ui-fg-muted">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <h2 className="txt-compact-medium-plus text-ui-fg-base mb-4">{t.dashboard.topSellingProducts}</h2>
        <div className="space-y-2">
          {stats.top_products.map((product: any, index: number) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-ui-bg-hover transition-fg border border-ui-border-base"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center txt-compact-small font-medium bg-ui-bg-component text-ui-fg-muted">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-ui-fg-base txt-compact-medium">{product.name}</p>
                  <p className="txt-compact-small text-ui-fg-muted">{product.total_sold} {t.dashboard.unitsSold}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ui-fg-base txt-compact-medium">
                  ${(product.total_sold * (product.price || 0)).toFixed(2)}
                </p>
                <p className="txt-compact-small text-ui-fg-muted">{t.dashboard.revenueLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon
}: {
  title: string
  value: string | number
  subtitle: string
  trend?: string
  icon?: React.ReactNode
}) {
  const isPositive = trend && trend.startsWith('+')
  
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="txt-compact-small text-ui-fg-muted uppercase">{title}</h3>
        {icon && (
          <div className="text-ui-fg-muted">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-3xl font-semibold text-ui-fg-base">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`txt-compact-small font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend}
            </span>
          </div>
        )}
      </div>
      <p className="txt-compact-small text-ui-fg-muted">{subtitle}</p>
    </div>
  )
}

// Status Badge Component
function StatusBadge({
  status,
  count
}: {
  status: string
  count: number
}) {
  return (
    <div className="text-center p-3 rounded-md bg-ui-bg-component border border-ui-border-base hover:bg-ui-bg-hover transition-fg">
      <p className="text-2xl font-semibold text-ui-fg-base mb-1">{count}</p>
      <p className="txt-compact-small text-ui-fg-muted">{status}</p>
    </div>
  )
}
