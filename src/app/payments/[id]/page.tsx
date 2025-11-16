'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'

interface Payment {
  id: number
  provider: string
  provider_payment_id: string
  amount: number
  status: string
  captured_at: string
  created_at: string
  refunds: Refund[]
}

interface Refund {
  id: number
  amount: number
  reason: string
  status: string
  created_at: string
}

interface PaymentCollection {
  id: number
  order_id: number
  order_number: string
  customer_email: string
  amount: number
  currency_code: string
  status: string
  created_at: string
  sessions: any[]
  payments: Payment[]
}

export default function PaymentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const collectionId = params?.id as string
  
  const [collection, setCollection] = useState<PaymentCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(false)
  const [refundPaymentId, setRefundPaymentId] = useState<number | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [showRefundModal, setShowRefundModal] = useState(false)

  useEffect(() => {
    if (collectionId) {
      fetchCollection()
    }
  }, [collectionId])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/payments/collections/${collectionId}`)
      setCollection(response.data)
    } catch (error) {
      console.error('Failed to fetch payment collection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!refundPaymentId) return
    
    try {
      setRefunding(true)
      
      await api.post('/admin/payments/refund', {
        payment_id: refundPaymentId,
        amount: refundAmount ? parseFloat(refundAmount) : null,
        reason: refundReason
      })
      
      // Refresh data
      await fetchCollection()
      
      // Close modal
      setShowRefundModal(false)
      setRefundPaymentId(null)
      setRefundAmount('')
      setRefundReason('')
      
      alert('Refund processed successfully')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to process refund')
    } finally {
      setRefunding(false)
    }
  }

  const openRefundModal = (payment: Payment) => {
    setRefundPaymentId(payment.id)
    setRefundAmount(payment.amount.toString())
    setShowRefundModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-600">Payment collection not found</p>
          <button
            onClick={() => router.push('/payments')}
            className="mt-4 text-gray-900 hover:text-gray-700"
          >
            ← Back to Payments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/payments')}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Payments
        </button>
        <h1 className="text-3xl font-light text-gray-900 mb-2">
          Payment Details
        </h1>
        <p className="text-gray-600">Collection #{collection.id}</p>
      </div>

      {/* Collection Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">#{collection.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-medium">{collection.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{collection.customer_email}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Collection</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-xl">€{collection.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Currency:</span>
              <span className="font-medium">{collection.currency_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded-full text-sm ${
                collection.status === 'captured' ? 'bg-green-100 text-green-800' :
                collection.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {collection.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{new Date(collection.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Payments</h2>
        </div>
        <div className="p-6">
          {collection.payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No payments captured yet</p>
          ) : (
            <div className="space-y-6">
              {collection.payments.map((payment) => {
                const totalRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0)
                const canRefund = payment.status === 'captured' && totalRefunded < payment.amount
                
                return (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Payment #{payment.id}</h3>
                        <p className="text-sm text-gray-500">{payment.provider} · {payment.provider_payment_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">€{payment.amount.toFixed(2)}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          payment.status === 'captured' ? 'bg-green-100 text-green-800' :
                          payment.status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Captured:</span>
                        <span className="ml-2">{payment.captured_at ? new Date(payment.captured_at).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <span className="ml-2">{new Date(payment.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Refunds */}
                    {payment.refunds.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Refunds</h4>
                        <div className="space-y-2">
                          {payment.refunds.map((refund) => (
                            <div key={refund.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium">€{refund.amount.toFixed(2)}</span>
                                {refund.reason && <span className="text-gray-500 ml-2">- {refund.reason}</span>}
                              </div>
                              <span className="text-gray-500">{new Date(refund.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Total Refunded: €{totalRefunded.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Refund Button */}
                    {canRefund && (
                      <button
                        onClick={() => openRefundModal(payment)}
                        className="btn-danger mt-4"
                      >
                        Issue Refund
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Process Refund</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Leave empty for full refund"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  rows={3}
                  placeholder="Enter refund reason..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRefundModal(false)
                  setRefundPaymentId(null)
                  setRefundAmount('')
                  setRefundReason('')
                }}
                disabled={refunding}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refunding || !refundAmount}
                className="btn-danger"
              >
                {refunding ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
