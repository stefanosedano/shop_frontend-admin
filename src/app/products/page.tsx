'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type SortField = 'id' | 'name' | 'price' | 'stock_quantity' | 'is_active'
type SortDirection = 'asc' | 'desc' | null

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    price: '',
    stock: '',
    status: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    sku: '',
    is_active: true
  })

  useEffect(() => {
    checkAuthAndLoadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuthAndLoadProducts = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading products:', error)
      localStorage.removeItem('admin_token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      sku: '',
      is_active: true
    })
    setShowModal(true)
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      sku: product.sku || '',
      is_active: product.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    const token = localStorage.getItem('admin_token')
    try {
      await axios.delete(`${API_URL}/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await checkAuthAndLoadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('admin_token')

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        sku: formData.sku,
        is_active: formData.is_active
      }

      if (editingProduct) {
        await axios.put(`${API_URL}/admin/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/admin/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      await checkAuthAndLoadProducts()
      setShowModal(false)
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Failed to save product')
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

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products]

    if (filters.id) {
      filtered = filtered.filter(p => p.id.toString().includes(filters.id))
    }
    if (filters.name) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(filters.name.toLowerCase()))
    }
    if (filters.price) {
      filtered = filtered.filter(p => p.price.toString().includes(filters.price))
    }
    if (filters.stock) {
      filtered = filtered.filter(p => p.stock_quantity.toString().includes(filters.stock))
    }
    if (filters.status) {
      const searchActive = filters.status.toLowerCase().includes('active')
      const searchInactive = filters.status.toLowerCase().includes('inactive')
      filtered = filtered.filter(p => {
        if (searchActive && p.is_active) return true
        if (searchInactive && !p.is_active) return true
        return false
      })
    }

    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal = a[sortField]
        let bVal = b[sortField]

        if (sortField === 'is_active') {
          aVal = aVal ? 1 : 0
          bVal = bVal ? 1 : 0
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [products, filters, sortField, sortDirection])

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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-lg font-medium text-gray-900">Products</h1>
          <button 
            onClick={handleAddNew}
            className="btn-primary"
          >
            + Add Product
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">ID</span>
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
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</span>
                    <button onClick={() => handleSort('name')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="name" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Price</span>
                    <button onClick={() => handleSort('price')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="price" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.price}
                    onChange={(e) => handleFilterChange('price', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</span>
                    <button onClick={() => handleSort('stock_quantity')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="stock_quantity" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters.stock}
                    onChange={(e) => handleFilterChange('stock', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                    <button onClick={() => handleSort('is_active')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="is_active" />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SKU"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Active Product
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
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
