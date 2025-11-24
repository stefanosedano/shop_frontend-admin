'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

type SortField = 'id' | 'name' | 'price' | 'stock_quantity' | 'is_active'
type SortDirection = 'asc' | 'desc' | null

export default function ProductsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    price: '',
    stock: '',
    sku: '',
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

  // Reload products when language changes
  useEffect(() => {
    if (products.length > 0) {
      setPage(1)
      setProducts([])
      checkAuthAndLoadProducts(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  // Debounced filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setProducts([])
      checkAuthAndLoadProducts(true)
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortField, sortDirection])

  const buildQueryString = () => {
    const params = new URLSearchParams()
    
    // Add locale parameter for translations
    if (language && language !== 'en') {
      params.append('locale', language)
    }
    
    if (filters.id) params.append('id', filters.id)
    if (filters.name) params.append('name', filters.name)
    if (filters.price) params.append('price', filters.price)
    if (filters.stock) params.append('stock', filters.stock)
    if (filters.sku) params.append('sku', filters.sku)
    if (filters.status) params.append('status', filters.status)
    if (sortField) {
      params.append('sort', sortField)
      if (sortDirection) params.append('order', sortDirection)
    }
    
    return params.toString()
  }

  const checkAuthAndLoadProducts = async (resetPage = false) => {
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
      const url = `${API_URL}/admin/products${queryString ? '?' + queryString : ''}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(response.data) ? response.data : response.data.products || response.data.data || []
      
      if (resetPage) {
        setProducts(data)
        setPage(1)
      } else {
        setProducts(data)
      }
      setHasMore(data.length >= 50)
    } catch (error) {
      console.error('Error loading products:', error)
      if (error?.response?.status === 401) {
        localStorage.removeItem('admin_token')
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore) return

    const token = localStorage.getItem('admin_token')
    if (!token) return

    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const queryString = buildQueryString()
      const url = `${API_URL}/admin/products${queryString ? '?' + queryString + '&' : '?'}page=${nextPage}`
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = Array.isArray(response.data) ? response.data : response.data.products || response.data.data || []
      
      if (data.length > 0) {
        setProducts(prev => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map(p => p.id))
          const newProducts = data.filter(p => !existingIds.has(p.id))
          return [...prev, ...newProducts]
        })
        setPage(nextPage)
        setHasMore(data.length >= 50)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more products:', error)
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
        loadMoreProducts()
      }
    }

    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll)
      return () => mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [loading, loadingMore, hasMore, loadMoreProducts])

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
    if (!confirm(t.products.deleteConfirm)) return

    const token = localStorage.getItem('admin_token')
    try {
      await axios.delete(`${API_URL}/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await checkAuthAndLoadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(t.messages.deleteError)
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
    return <div className="flex items-center justify-center min-h-screen">{t.common.loading}</div>
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center gap-3">
          <h1 className="text-lg font-medium text-gray-900">{t.products.title}</h1>
          <div className="flex gap-2">
            <button 
              onClick={handleAddNew}
              className="btn-primary"
            >
              + {t.products.addProduct}
            </button>
          </div>
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
                    id="filter-product-id"
                    name="filter-product-id"
                    type="text"
                    placeholder="Filter..."
                    value={filters.id}
                    onChange={(e) => handleFilterChange('id', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.productName}</span>
                    <button onClick={() => handleSort('name')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="name" />
                    </button>
                  </div>
                  <input
                    id="filter-product-name"
                    name="filter-product-name"
                    type="text"
                    placeholder={t.products.filterPlaceholder}
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.price}</span>
                    <button onClick={() => handleSort('price')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="price" />
                    </button>
                  </div>
                  <input
                    id="filter-product-price"
                    name="filter-product-price"
                    type="text"
                    placeholder={t.products.priceFilter}
                    value={filters.price}
                    onChange={(e) => handleFilterChange('price', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.stock}</span>
                    <button onClick={() => handleSort('stock_quantity')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="stock_quantity" />
                    </button>
                  </div>
                  <input
                    id="filter-product-stock"
                    name="filter-product-stock"
                    type="text"
                    placeholder={t.products.filterPlaceholder}
                    value={filters.stock}
                    onChange={(e) => handleFilterChange('stock', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.products.sku}</span>
                  </div>
                  <input
                    id="filter-product-sku"
                    name="filter-product-sku"
                    type="text"
                    placeholder={t.products.filterPlaceholder}
                    value={filters.sku || ''}
                    onChange={(e) => handleFilterChange('sku', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t.common.status}</span>
                    <button onClick={() => handleSort('is_active')} className="hover:bg-gray-200 rounded p-1">
                      <SortIcon field="is_active" />
                    </button>
                  </div>
                  <input
                    id="filter-product-status"
                    name="filter-product-status"
                    type="text"
                    placeholder={t.products.filterPlaceholder}
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.common.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product, index) => (
                <tr key={`product-${product.id}-${index}`}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? t.common.active : t.common.inactive}
                      </span>
                      {product.approval_status && product.approval_status !== 'approved' && (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.approval_status === 'pending' ? 'Pending' : 'Rejected'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {t.common.edit}
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t.common.delete}
                    </button>
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
          {!hasMore && products.length > 0 && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-500">
              {t.products.allProducts}
            </div>
          )}
        </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? t.products.editProduct : t.products.addProduct}
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
                    {t.products.productName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.products.productName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.products.description}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.products.description}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.products.price} *
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
                      {t.products.stock} *
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
                    {t.products.sku}
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.products.sku}
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
                    {t.products.activeProduct}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingProduct ? t.products.updateProduct : t.products.createProduct}
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
