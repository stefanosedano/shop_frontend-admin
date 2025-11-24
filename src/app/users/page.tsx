'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type SortField = 'id' | 'email' | 'full_name' | 'is_admin' | 'is_active' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

export default function UsersPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState({
    id: '',
    email: '',
    full_name: '',
    admin: '',
    active: '',
    created: ''
  })
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    is_admin: false
  })

  useEffect(() => {
    checkAuthAndLoadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setUsers([])
      checkAuthAndLoadUsers(true)
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortDirection])

  const buildQueryString = () => {
    const params = new URLSearchParams()
    
    if (filters.id) params.append('id', filters.id)
    if (filters.email) params.append('email', filters.email)
    if (filters.full_name) params.append('full_name', filters.full_name)
    if (filters.admin) params.append('admin', filters.admin)
    if (filters.active) params.append('active', filters.active)
    if (filters.created) params.append('created', filters.created)
    if (sortField) {
      params.append('sort', sortField)
      if (sortDirection) params.append('order', sortDirection)
    }
    
    return params.toString()
  }

  const checkAuthAndLoadUsers = async (resetPage = false) => {
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
      const url = `${API_URL}/admin/users${queryString ? '?' + queryString : ''}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(response.data) ? response.data : response.data.users || response.data.data || []
      
      if (resetPage) {
        setUsers(data)
        setPage(1)
      } else {
        setUsers(data)
      }
      setHasMore(data.length >= 50)
    } catch (error) {
      console.error('Error loading users:', error)
      if (error?.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMoreUsers = useCallback(async () => {
    if (loadingMore || !hasMore) return

    const token = localStorage.getItem('admin_token')
    if (!token) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const queryString = buildQueryString()
      const url = `${API_URL}/admin/users${queryString ? '?' + queryString + '&' : '?'}page=${nextPage}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(response.data) ? response.data : response.data.users || response.data.data || []
      
      if (data.length > 0) {
        setUsers(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(u => u.id))
          const newUsers = data.filter(u => !existingIds.has(u.id))
          return [...prev, ...newUsers]
        })
        setPage(nextPage)
        setHasMore(data.length >= 50)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more users:', error)
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
        loadMoreUsers()
      }
    }

    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll)
      return () => mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [loading, loadingMore, hasMore, loadMoreUsers])

  const handleEdit = (user: any) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      is_admin: user.is_admin
    })
    setShowModal(true)
  }

  const handleDeactivate = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    const confirmMsg = currentStatus ? t.users.deactivateConfirm : t.users.activateConfirm
    if (!confirm(confirmMsg)) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/users/${userId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await checkAuthAndLoadUsers()
      alert(currentStatus ? t.users.deactivatedSuccess : t.users.activatedSuccess)
    } catch (error) {
      console.error('Error updating user status:', error)
      alert(currentStatus ? t.users.deactivateError : t.users.activateError)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      alert(t.users.emailRequired)
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      await axios.put(
        `${API_URL}/admin/users/${editingUser.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setShowModal(false)
      setFormData({ email: '', full_name: '', is_admin: false })
      await checkAuthAndLoadUsers()
      alert(t.users.updatedSuccess)
    } catch (error) {
      console.error('Error updating user:', error)
      alert(t.users.updateError)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ui-bg-interactive"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium text-gray-900">{t.users.title}</h1>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{t.users.userId}</span>
                    <button onClick={() => handleSort('id')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="id" />
                    </button>
                  </div>
                  <input
                    id="filter-user-id"
                    name="filter-user-id"
                    type="text"
                    placeholder={t.users.filterPlaceholder}
                    value={filters.id}
                    onChange={(e) => handleFilterChange('id', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{t.users.email}</span>
                    <button onClick={() => handleSort('email')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="email" />
                    </button>
                  </div>
                  <input
                    id="filter-user-email"
                    name="filter-user-email"
                    type="text"
                    placeholder={t.users.filterPlaceholder}
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{t.users.fullName}</span>
                    <button onClick={() => handleSort('full_name')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="full_name" />
                    </button>
                  </div>
                  <input
                    id="filter-user-full-name"
                    name="filter-user-full-name"
                    type="text"
                    placeholder={t.users.filterPlaceholder}
                    value={filters.full_name}
                    onChange={(e) => handleFilterChange('full_name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{t.users.admin}</span>
                    <button onClick={() => handleSort('is_admin')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="is_admin" />
                    </button>
                  </div>
                  <input
                    id="filter-user-admin"
                    name="filter-user-admin"
                    type="text"
                    placeholder={t.users.filterPlaceholder}
                    value={filters.admin}
                    onChange={(e) => handleFilterChange('admin', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{t.users.active}</span>
                    <button onClick={() => handleSort('is_active')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="is_active" />
                    </button>
                  </div>
                  <input
                    id="filter-user-active"
                    name="filter-user-active"
                    type="text"
                    placeholder={t.users.filterPlaceholder}
                    value={filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">{t.users.createdAt}</span>
                    <button onClick={() => handleSort('created_at')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="created_at" />
                    </button>
                  </div>
                  <input
                    id="filter-user-created"
                    name="filter-user-created"
                    type="text"
                    placeholder={t.users.filterPlaceholder}
                    value={filters.created}
                    onChange={(e) => handleFilterChange('created', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <span className="text-xs font-medium text-gray-500 tracking-wide">{t.common.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={`user-${user.id}-${index}`}>
                  <td>{user.id}</td>
                  <td className="font-medium">{user.email}</td>
                  <td>{user.full_name || t.users.na}</td>
                  <td>
                    <span className={`badge ${user.is_admin ? 'badge-success' : 'badge-neutral'}`}>
                      {user.is_admin ? t.users.yes : t.users.no}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                      {user.is_active ? t.users.active : t.users.inactive}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {t.common.edit}
                    </button>
                    <button
                      onClick={() => handleDeactivate(user.id, user.is_active)}
                      className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.is_active ? t.users.deactivate : t.users.activate}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-sm text-gray-500">{t.users.loadingMore}</span>
            </div>
          )}
          {!hasMore && users.length > 0 && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-500">
              {t.users.allLoaded}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">{t.users.editUser}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.users.email} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.users.fullName}
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_admin"
                      checked={formData.is_admin}
                      onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_admin" className="ml-2 text-sm font-medium text-gray-700">
                      {t.users.adminUser}
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      {t.users.updateUser}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      {t.common.cancel}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
