'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import AdminLayout from '../../components/AdminLayout'
import { useLanguage } from '../../context/LanguageContext'
import { CheckCircle, XCircle, Clock, User } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

interface PendingProduct {
  id: number
  name: string
  description: string
  price: number
  stock_quantity: number
  sku: string
  image_url?: string
  approval_status: string
  created_by: number
  created_at: string
  categories: any[]
}

export default function PendingProductsPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [products, setProducts] = useState<PendingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<number | null>(null)

  useEffect(() => {
    checkAuthAndLoadProducts()
  }, [])

  const checkAuthAndLoadProducts = async () => {
    const token = localStorage.getItem('adminToken')
    
    if (!token) {
      router.push('/login')
      return
    }

    try {
      // Check if user is admin
      const userResponse = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!userResponse.data.is_admin || userResponse.data.role !== 'admin') {
        alert('Only admins can access this page')
        router.push('/products')
        return
      }

      await loadPendingProducts(token)
    } catch (error) {
      console.error('Auth error:', error)
      localStorage.removeItem('adminToken')
      router.push('/login')
    }
  }

  const loadPendingProducts = async (token: string) => {
    try {
      const response = await axios.get(`${API_URL}/admin/products/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProducts(response.data)
    } catch (error) {
      console.error('Error loading pending products:', error)
      alert('Failed to load pending products')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (productId: number) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    setProcessing(productId)
    try {
      await axios.post(
        `${API_URL}/admin/products/${productId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Remove from pending list
      setProducts(products.filter(p => p.id !== productId))
      alert('Product approved successfully!')
    } catch (error: any) {
      console.error('Error approving product:', error)
      alert(error.response?.data?.detail || 'Failed to approve product')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (productId: number) => {
    const token = localStorage.getItem('adminToken')
    if (!token) return

    const reason = prompt('Rejection reason (optional):')
    if (reason === null) return // User cancelled

    setProcessing(productId)
    try {
      await axios.post(
        `${API_URL}/admin/products/${productId}/reject`,
        {},
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { reason }
        }
      )
      
      // Remove from pending list
      setProducts(products.filter(p => p.id !== productId))
      alert('Product rejected')
    } catch (error: any) {
      console.error('Error rejecting product:', error)
      alert(error.response?.data?.detail || 'Failed to reject product')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading pending products...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            Pending Products Approval
          </h1>
          <div className="text-gray-600">
            {products.length} product{products.length !== 1 ? 's' : ''} waiting
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-green-800 mb-2">All Clear!</h2>
            <p className="text-green-700">No products pending approval at this time.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    {product.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {product.name}
                          </h2>
                          <p className="text-sm text-gray-500 mb-2">
                            SKU: {product.sku} | ID: {product.id}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            Created by user #{product.created_by} on{' '}
                            {new Date(product.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-600 mb-1">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Stock: {product.stock_quantity}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {product.description}
                      </p>

                      {product.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {product.categories.map((cat: any) => (
                            <span
                              key={cat.id}
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => handleApprove(product.id)}
                          disabled={processing === product.id}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {processing === product.id ? 'Processing...' : 'Approve'}
                        </button>
                        
                        <button
                          onClick={() => handleReject(product.id)}
                          disabled={processing === product.id}
                          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-5 h-5" />
                          {processing === product.id ? 'Processing...' : 'Reject'}
                        </button>

                        <button
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
