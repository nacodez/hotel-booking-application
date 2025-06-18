import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const NotFoundPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [countdown, setCountdown] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  // Popular suggestions based on common user paths
  const suggestions = [
    { path: '/', label: 'Search Hotels', icon: '🏨' },
    { path: '/login', label: 'Sign In', icon: '👤' },
    { path: '/register', label: 'Create Account', icon: '📝' },
    { path: '/dashboard', label: 'My Bookings', icon: '📋' }
  ]

  // Extract potential search terms from the current path
  useEffect(() => {
    const path = location.pathname
    const segments = path.split('/').filter(Boolean)
    if (segments.length > 0) {
      setSearchTerm(segments[segments.length - 1].replace(/-/g, ' '))
    }
  }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const stopCountdown = () => {
    setCountdown(0)
  }

  return (
    <>
      <Helmet>
        <title>Page Not Found - Hotel Booking System</title>
        <meta name="description" content="The page you're looking for doesn't exist. Find hotels and book your perfect stay." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="not-found-page">
        <div className="not-found-container">
          {/* Header with logo/navigation */}
          <div className="not-found-header">
            <Link to="/" className="not-found-logo">
              <span className="logo-icon">🏨</span>
              Hotel Booking
            </Link>
          </div>

          {/* Main 404 content */}
          <div className="not-found-content">
            <div className="not-found-illustration">
              <div className="error-code">404</div>
              <div className="error-icon">
                <svg viewBox="0 0 200 200" className="lost-traveler">
                  {/* Suitcase */}
                  <rect x="70" y="120" width="60" height="40" rx="5" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2"/>
                  <rect x="85" y="130" width="30" height="20" fill="#a78bfa"/>
                  <circle cx="75" cy="165" r="8" fill="#374151"/>
                  <circle cx="125" cy="165" r="8" fill="#374151"/>
                  
                  {/* Person */}
                  <circle cx="100" cy="80" r="15" fill="#fbbf24"/>
                  <rect x="90" y="95" width="20" height="30" rx="10" fill="#3b82f6"/>
                  <rect x="85" y="110" width="10" height="20" fill="#1f2937"/>
                  <rect x="105" y="110" width="10" height="20" fill="#1f2937"/>
                  
                  {/* Question marks */}
                  <text x="50" y="60" fontSize="20" fill="#ef4444">?</text>
                  <text x="140" y="70" fontSize="16" fill="#ef4444">?</text>
                  <text x="160" y="100" fontSize="18" fill="#ef4444">?</text>
                </svg>
              </div>
            </div>

            <div className="not-found-text">
              <h1 className="not-found-title">Oops! Page Not Found</h1>
              
              <p className="not-found-subtitle">
                It looks like you've wandered off the beaten path. The page you're looking for doesn't exist.
              </p>

              <div className="not-found-path">
                <span className="path-label">You tried to visit:</span>
                <code className="requested-path">{location.pathname}</code>
              </div>
            </div>

            {/* Search form */}
            {searchTerm && (
              <div className="not-found-search">
                <form onSubmit={handleSearch} className="search-form">
                  <h3>Looking for hotels?</h3>
                  <div className="search-input-group">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for hotels..."
                      className="search-input"
                    />
                    <button type="submit" className="search-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21L16.65 16.65"></path>
                      </svg>
                      Search
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Suggestions */}
            <div className="not-found-suggestions">
              <h3>Here's what you can do:</h3>
              <div className="suggestions-grid">
                {suggestions.map((suggestion, index) => (
                  <Link 
                    key={index}
                    to={suggestion.path} 
                    className="suggestion-card"
                    onClick={stopCountdown}
                  >
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    <span className="suggestion-label">{suggestion.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Auto-redirect notice */}
            <div className="not-found-redirect">
              <div className="redirect-notice">
                <span className="redirect-text">
                  Redirecting to homepage in 
                </span>
                <span className="countdown-timer">{countdown}</span>
                <span className="redirect-text">seconds</span>
              </div>
              
              <div className="redirect-actions">
                <Link 
                  to="/" 
                  className="btn btn-primary"
                  onClick={stopCountdown}
                >
                  Go Now
                </Link>
                <button 
                  onClick={stopCountdown}
                  className="btn btn-secondary"
                >
                  Stay Here
                </button>
              </div>
            </div>

            {/* Help section */}
            <div className="not-found-help">
              <details className="help-details">
                <summary>Need help?</summary>
                <div className="help-content">
                  <p>If you believe this is an error, please try:</p>
                  <ul>
                    <li>Checking the URL for typos</li>
                    <li>Going back to the previous page</li>
                    <li>Using the search function</li>
                    <li>Contacting our support team</li>
                  </ul>
                  
                  <div className="help-contact">
                    <a href="mailto:support@hotelbooking.com" className="help-link">
                      📧 Contact Support
                    </a>
                    <a href="tel:+1-800-HOTELS" className="help-link">
                      📞 Call Us
                    </a>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Footer */}
          <div className="not-found-footer">
            <p>&copy; 2024 Hotel Booking System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage