import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'

/**
 * Route that requires both authentication and library selection
 * System admins bypass library requirement
 */
const LibraryRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const { selectedLibrary } = useLibrary()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // System admins can access without library selection
  if (user?.role === 'system_admin') {
    return children
  }
  
  // Regular users need library selected
  if (!selectedLibrary) {
    return <Navigate to="/select-library" replace />
  }
  
  return children
}

export default LibraryRoute
