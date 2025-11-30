import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login(email, password, rememberMe)
      
      if (response.success) {
        localStorage.setItem('authToken', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email)
        }
        
        toast.success('Login successful!')
        
        // Navigate based on role
        if (response.data.user.role === 'system_admin') {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
        
        return { success: true }
      } else {
        toast.error(response.message || 'Login failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, message: 'Network error' }
    }
  }

  const register = async (data) => {
    try {
      const response = await authAPI.register(data)
      
      if (response.success) {
        toast.success('Registration successful! Please login.')
        navigate('/login')
        return { success: true }
      } else {
        toast.error(response.message || 'Registration failed')
        return { success: false, message: response.message, errors: response.errors }
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, message: 'Network error' }
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/login', { replace: true })
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
