import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token')
  }
  return null
}

// Create axios instance with auth header
export const api = axios.create({
  baseURL: API_URL,
})

// Add auth header to all requests
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Export API_URL for fetch calls
export { API_URL }

// Helper function for fetch calls with auth
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
  }
  
  return response
}
