import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authCredentials, setAuthCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [authError, setAuthError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { returnTo, bookingIntent, message } = location.state || {}

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAuthCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')

    if (!isLoginMode && authCredentials.password !== authCredentials.confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    try {
      setIsProcessingAuth(true)
      
      if (isLoginMode) {
        await login(authCredentials.email, authCredentials.password)
      } else {
        await register({
          email: authCredentials.email,
          password: authCredentials.password,
          firstName: 'User', // You might want to add these fields to the form
          lastName: 'Name',
          role: 'user'
        })
      }
      
      handlePostAuthRedirect()
    } catch (error) {
      console.error(' Auth error:', error)
      setAuthError(error.message)
    } finally {
      setIsProcessingAuth(false)
    }
  }

  const handlePostAuthRedirect = () => {
    if (returnTo && bookingIntent) {
      if (bookingIntent.isBrowsingMode) {
        navigate('/?selectDates=true', {
          state: {
            selectedRoom: {
              id: bookingIntent.room.id,
              title: bookingIntent.room.title,
              price: bookingIntent.room.price
            }
          }
        })
      } else {
        navigate('/booking/confirmation', {
          state: {
            bookingDetails: {
              roomId: bookingIntent.room.id,
              roomName: bookingIntent.room.title,
              roomImage: bookingIntent.room.image,
              pricePerNight: bookingIntent.room.pricePerNight,
              ...bookingIntent.searchCriteria
            }
          }
        })
      }
    } else if (returnTo) {
      navigate(returnTo)
    } else {
      navigate('/dashboard')
    }
  }

  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode)
    setAuthCredentials({
      email: '',
      password: '',
      confirmPassword: ''
    })
    setAuthError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">

          <div className="auth-header">
            <div className="hotel-logo">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
                <circle cx="9" cy="12" r="1"/>
                <circle cx="15" cy="12" r="1"/>
              </svg>
            </div>
            <h1 className="auth-title">{isLoginMode ? 'Sign In' : 'Create Account'}</h1>
            <p className="auth-subtitle">
              {isLoginMode ? 'Welcome back to your account' : 'Join us to start booking your perfect stay'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {message && (
              <div className="alert alert-info">
                {message}
              </div>
            )}
            
            {authError && (
              <div className="alert alert-error">
                {authError}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-container">
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={authCredentials.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email"
                  disabled={isProcessingAuth}
                  autoComplete="email"
                  required
                />
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={authCredentials.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={isLoginMode ? "Enter your password" : "Create a password"}
                  disabled={isProcessingAuth}
                  autoComplete={isLoginMode ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isProcessingAuth}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-container">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={authCredentials.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    disabled={isProcessingAuth}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isProcessingAuth}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {authCredentials.confirmPassword && authCredentials.password && (
                  <div className={`password-match ${authCredentials.password === authCredentials.confirmPassword ? 'match' : 'no-match'}`}>
                    {authCredentials.password === authCredentials.confirmPassword ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38a169', fontSize: '14px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                        Passwords match
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e53e3e', fontSize: '14px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="15" y1="9" x2="9" y2="15"/>
                          <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              className="auth-submit-btn"
              disabled={isProcessingAuth}
            >
              {isProcessingAuth ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                isLoginMode ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          <div className="auth-footer">
            <p>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={toggleAuthMode}
                className="auth-link"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {isLoginMode ? 'Sign up here' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage