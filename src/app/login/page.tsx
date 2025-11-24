'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useLanguage } from '../../context/LanguageContext'

// Use admin API for authentication
const AUTH_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

export default function AdminLogin() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState('admin@shop.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Login to get token
      const loginResponse = await axios.post(`${AUTH_API_URL}/auth/login`, {
        email,
        password
      })

      const token = loginResponse.data.access_token

      // Verify admin status
      const userResponse = await axios.get(`${AUTH_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!userResponse.data.is_admin) {
        setError('Access denied. Admin privileges required.')
        return
      }

      // Store token and redirect
      localStorage.setItem('admin_token', token)
      router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Admin Login</h1>
        <p className="text-center text-gray-600 mb-6">Shop Administration Dashboard</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-100 rounded text-sm">
          <p className="font-semibold mb-2">Default Admin Credentials:</p>
          <p>Email: admin@shop.local</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  )
}
