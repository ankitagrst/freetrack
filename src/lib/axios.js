import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://royalblue-bear-657267.hostingersite.com/api/"

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
    let role = parsed?.role || null
    
    // Map legacy roles to new roles for frontend logic
    if (role === 'library_owner' || role === 'gym_owner') {
      role = 'organization_owner'
    }
    
    return role
  } catch {
    return null
  }
}

function getSelectedOrgId() {
  try {
    // Primary: new org selection
    const directOrgId = localStorage.getItem('selectedOrgId')
    if (directOrgId) return Number(directOrgId)

    const rawOrgData = localStorage.getItem('selectedOrgData')
    if (rawOrgData) {
      const parsed = JSON.parse(rawOrgData)
      if (parsed?.id) return Number(parsed.id)
    }
  } catch {
    // Ignore JSON parse errors and fall through
  }
  return null
}

function shouldInjectOrgId(config) {
  const url = (config?.url || '').toLowerCase()
  // Never inject for auth/register/public endpoints.
  if (url.includes('auth.php') || url.includes('register.php') || url.includes('public-plans.php')) return false
  // Inject for owners (and members carrying org selection locally)
  return ['organization_owner', 'member'].includes(getUserRole())
}

function injectOrgId(config) {
  const orgId = getSelectedOrgId()
  if (!orgId) return config

  config.params = config.params || {}
  if (!config.params.org_id) {
    config.params.org_id = orgId
  }

  // For POST/PUT/PATCH/DELETE bodies, add org_id unless already present.
  const method = (config.method || 'get').toLowerCase()
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    if (config.data && typeof config.data === 'object' && !Array.isArray(config.data)) {
      const nextData = { ...config.data }
      if (!nextData.org_id) nextData.org_id = orgId
      config.data = nextData
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
    if (shouldInjectOrgId(config)) {
      config = injectOrgId(config)
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
