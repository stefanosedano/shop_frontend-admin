'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type SortField = 'id' | 'email' | 'full_name' | 'is_admin' | 'is_active' | 'created_at'
type SortDirection = 'asc' | 'desc' | null

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
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

  const checkAuthAndLoadUsers = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
      localStorage.removeItem('admin_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

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
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${API_URL}/admin/users/${userId}`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await checkAuthAndLoadUsers()
      alert(`User ${action}d successfully`)
    } catch (error) {
      console.error('Error updating user status:', error)
      alert(`Failed to ${action} user`)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      alert('Email is required')
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
      alert('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
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

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users]

    if (filters.id) {
      filtered = filtered.filter(u => u.id.toString().includes(filters.id))
    }
    if (filters.email) {
      filtered = filtered.filter(u => u.email.toLowerCase().includes(filters.email.toLowerCase()))
    }
    if (filters.full_name) {
      filtered = filtered.filter(u => (u.full_name || '').toLowerCase().includes(filters.full_name.toLowerCase()))
    }
    if (filters.admin) {
      const searchYes = filters.admin.toLowerCase().includes('yes')
      const searchNo = filters.admin.toLowerCase().includes('no')
      filtered = filtered.filter(u => {
        if (searchYes && u.is_admin) return true
        if (searchNo && !u.is_admin) return true
        return false
      })
    }
    if (filters.active) {
      const searchActive = filters.active.toLowerCase().includes('active')
      const searchInactive = filters.active.toLowerCase().includes('inactive')
      filtered = filtered.filter(u => {
        if (searchActive && u.is_active) return true
        if (searchInactive && !u.is_active) return true
        return false
      })
    }
    if (filters.created) {
      filtered = filtered.filter(u => new Date(u.created_at).toLocaleDateString().includes(filters.created))
    }

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal = a[sortField]
        let bVal = b[sortField]

        if (sortField === 'created_at') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        } else if (sortField === 'is_admin' || sortField === 'is_active') {
          aVal = aVal ? 1 : 0
          bVal = bVal ? 1 : 0
        } else if (sortField === 'full_name') {
          aVal = (aVal || '').toLowerCase()
          bVal = (bVal || '').toLowerCase()
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [users, filters, sortField, sortDirection])

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
          <h1 className="text-lg font-medium text-gray-900">Customers</h1>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">ID</span>
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
                    <span className="text-xs font-medium text-gray-500 tracking-wide">Email</span>
                    <button onClick={() => handleSort('email')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="email" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.email}
                    onChange={(e) => handleFilterChange('email', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">Full Name</span>
                    <button onClick={() => handleSort('full_name')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="full_name" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.full_name}
                    onChange={(e) => handleFilterChange('full_name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">Admin</span>
                    <button onClick={() => handleSort('is_admin')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="is_admin" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.admin}
                    onChange={(e) => handleFilterChange('admin', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">Active</span>
                    <button onClick={() => handleSort('is_active')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="is_active" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.active}
                    onChange={(e) => handleFilterChange('active', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 tracking-wide">Created</span>
                    <button onClick={() => handleSort('created_at')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="created_at" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.created}
                    onChange={(e) => handleFilterChange('created', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <span className="text-xs font-medium text-gray-500 tracking-wide">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td className="font-medium">{user.email}</td>
                  <td>{user.full_name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${user.is_admin ? 'badge-success' : 'badge-neutral'}`}>
                      {user.is_admin ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeactivate(user.id, user.is_active)}
                      className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Edit User</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
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
                      Full Name
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
                      Admin User
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="btn-primary"
                    >
                      Update User
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
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
