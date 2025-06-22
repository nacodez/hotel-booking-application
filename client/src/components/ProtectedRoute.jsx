import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { currentUser, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }
  if (!currentUser) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          returnTo: location.pathname,
          fromProtectedRoute: true 
        }} 
        replace 
      />
    )
  }
  return children
}

export default ProtectedRoute