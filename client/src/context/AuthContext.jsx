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

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        try {
          const response = await authAPI.getUserProfile()
          
          if (response.success && response.data?.user) {
            setCurrentUser(response.data.user)
          } else {
            localStorage.removeItem('authToken')
            localStorage.removeItem('refreshToken')
          }
        } catch (error) {
          console.error(' Error validating token:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
        }
      }
      setIsLoading(false)
    }

    checkAuthStatus()
  }, [])

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authAPI.login({ email, password })
      
      if (response.success) {
        const { user, tokens } = response.data
        
        localStorage.setItem('authToken', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        
        if (rememberMe) {
          localStorage.setItem('rememberUser', 'true')
        } else {
          localStorage.removeItem('rememberUser')
        }
        
        setCurrentUser(user)
        return user
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error(' AuthContext: Login error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        hasResponse: !!error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      })
      
      let errorMessage = 'Login failed. Please try again.'
      
      if (error.isCorsError || error.message.includes('CORS Error')) {
        errorMessage = 'Server configuration error (CORS). Please contact support or try again later.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Login request timed out. Please check your internet connection and try again.'
      } else if (error.message.includes('Unable to connect')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection or try again later.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      
      if (response.success) {
        const { user, tokens, requiresApproval } = response.data
        
        if (requiresApproval) {
          return { user, requiresApproval: true }
        }
        
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
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      } else {
        throw new Error(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  const logoutUser = async () => {
    try {
      if (currentUser) {
        await authAPI.logout()
      }
    } catch (error) {
      console.error('Error during logout API call:', error)
    } finally {
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

  const hasRole = (role) => {
    return currentUser?.roles?.includes(role) || false
  }

  const isAdmin = () => {
    return hasRole('admin')
  }

  const isHotelOwner = () => {
    return hasRole('hotel-owner')
  }

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