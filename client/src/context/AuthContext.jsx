import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/apiService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing auth token on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('🔍 Checking auth status...')
      const token = localStorage.getItem('authToken')
      console.log('🔑 Token exists:', !!token)
      
      if (token) {
        try {
          console.log('📞 Calling getUserProfile API...')
          const response = await authAPI.getUserProfile()
          console.log('✅ Profile response:', response)
          
          if (response.success && response.data?.user) {
            setCurrentUser(response.data.user)
            console.log('👤 Current user set:', response.data.user)
          } else {
            console.log('❌ Invalid profile response format')
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
          }
        } catch (error) {
          console.error('❌ Error validating token:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
        }
      } else {
        console.log('🚫 No auth token found')
      }
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('🔐 Attempting login for:', email)
      const response = await authAPI.login({ email, password })
      console.log('🔐 Login response:', response)
      
      if (response.success) {
        const { user, tokens } = response.data
        console.log('🔐 Login successful, user:', user)
        console.log('🔐 Tokens received:', { accessToken: !!tokens?.accessToken, refreshToken: !!tokens?.refreshToken })
        
        // Store tokens
        localStorage.setItem('authToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        console.log('🔐 Tokens stored in localStorage')
        
        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberUser', 'true')
        } else {
          localStorage.removeItem('rememberUser')
        }
        
        setCurrentUser(user)
        console.log('🔐 Current user set to:', user)
        return user
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      
      // Handle specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error(error.message || 'Login failed. Please try again.')
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      
      if (response.success) {
        const { user, tokens, requiresApproval } = response.data
        
        // For hotel owners requiring approval, don't set tokens
        if (requiresApproval) {
          return { user, requiresApproval: true }
        }
        
        // Store tokens for regular users and admins
        if (tokens) {
          localStorage.setItem('authToken', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          setCurrentUser(user)
        }
        
        return { user, requiresApproval: false }
      } else {
        throw new Error(response.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle specific error messages
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  const logoutUser = async () => {
    try {
      // Call logout API if user is authenticated
      if (currentUser) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Error during logout API call:', error)
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage and state
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('rememberUser')
      setCurrentUser(null)
    }
  }

  const updateUserProfile = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates)
      if (response.success) {
        // Update current user state with new data
        const updatedProfile = await authAPI.getUserProfile()
        setCurrentUser(updatedProfile.data.user)
        return updatedProfile.data.user
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword
      })
      return response
    } catch (error) {
      console.error('Error changing password:', error)
      throw new Error(error.response?.data?.message || 'Failed to change password')
    }
  }

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    return currentUser?.roles?.includes(role) || false
  }

  // Helper function to check if user is admin
  const isAdmin = () => {
    return hasRole('admin')
  }

  // Helper function to check if user is hotel owner
  const isHotelOwner = () => {
    return hasRole('hotel-owner')
  }

  // Helper function to check if user is regular user
  const isUser = () => {
    return hasRole('user')
  }

  const authValue = {
    currentUser,
    isLoading,
    login,
    register,
    logoutUser,
    updateUserProfile,
    changePassword,
    hasRole,
    isAdmin,
    isHotelOwner,
    isUser
  }

  return (
    <AuthContext.Provider value={authValue}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}