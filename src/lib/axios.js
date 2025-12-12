import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

function getUserRole() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.role || null
  } catch {
    return null
  }
}

function getSelectedLibraryId() {
  try {
    const directId = localStorage.getItem('selectedLibraryId')
    if (directId) return Number(directId)

    const rawData = localStorage.getItem('selectedLibraryData')
    if (!rawData) return null
    const parsed = JSON.parse(rawData)
    return parsed?.id ? Number(parsed.id) : null
  } catch {
    return null
  }
}

function shouldInjectLibraryId(config) {
  const url = (config?.url || '').toLowerCase()
  // Never inject for auth/register/public endpoints.
  if (url.includes('auth.php') || url.includes('register.php') || url.includes('public-plans.php')) return false
  return getUserRole() === 'library_owner'
}

function injectLibraryId(config) {
  const libraryId = getSelectedLibraryId()
  if (!libraryId) return config

  config.params = config.params || {}
  if (!config.params.library_id) {
    config.params.library_id = libraryId
  }

  // For POST/PUT/PATCH/DELETE bodies, add library_id unless already present.
  const method = (config.method || 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
      if (!config.data.library_id) {
        config.data = { ...config.data, library_id: libraryId }
      }
    }
  }

  return config
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (shouldInjectLibraryId(config)) {
      config = injectLibraryId(config)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    }
    return Promise.reject(error)
  }
)

export default apiClient
