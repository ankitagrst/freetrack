import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrg } from '../context/OrgContext'

/**
 * Route that requires both authentication and org selection
 * System admins bypass org requirement
 */
const OrgRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  const { selectedOrg } = useOrg()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // System admins can access without org selection
  if (user?.role === 'system_admin') {
    return children
  }
  
  // Regular users need org selected
  if (!selectedOrg) {
    return <Navigate to="/select-org" replace />
  }
  
  return children
}

export default OrgRoute
