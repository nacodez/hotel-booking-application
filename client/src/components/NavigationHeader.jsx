import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavigationHeader = () => {
  const { currentUser, logoutUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleUserLogout = async () => {
    try {
      await logoutUser()
      navigate('/')
      setIsMenuOpen(false)
    } catch (error) {
      console.error('Error during logout:', error)

      navigate('/')
      setIsMenuOpen(false)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.mobile-menu-container') && !event.target.closest('.hamburger-btn')) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isMenuOpen])
  return (
    <header className={`navigation-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <nav className="nav-container">
          <Link to="/" className="brand-logo">
          BookingSuite
          </Link>
          <ul className="nav-menu desktop-only">
            <li>
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/search" className="nav-link">
                Rooms
              </Link>
            </li>
            {currentUser && (
              <li>
                <Link to="/dashboard" className="nav-link">
                  My Bookings
                </Link>
              </li>
            )}
            <li>
              <a href="/#about" className="nav-link">About</a>
            </li>
            <li>
              <a href="/#contact" className="nav-link">Contact</a>
            </li>
          </ul>
          <div className="user-actions desktop-only">
            {currentUser ? (
              <>
                <span className="user-welcome">
                  Welcome, {currentUser.displayName || currentUser.email.split('@')[0]}
                </span>
                <button onClick={handleUserLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/auth?mode=login" className="btn btn-secondary btn-sm">
                  Login
                </Link>
              </div>
            )}
          </div>
          <button 
            className="hamburger-btn mobile-tablet-only"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
          <div className={`mobile-menu-container mobile-tablet-only ${isMenuOpen ? 'open' : ''}`}>
            <div className="mobile-menu">

              {currentUser && (
                <div className="mobile-user-welcome-top">
                  Welcome, {currentUser.displayName || currentUser.email.split('@')[0]}
                </div>
              )}

              <ul className="mobile-nav-menu">
                <li>
                  <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="mobile-nav-link" onClick={closeMenu}>
                    Rooms
                  </Link>
                </li>
                {currentUser && (
                  <li>
                    <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                      My Bookings
                    </Link>
                  </li>
                )}
                <li>
                  <a href="/#about" className="mobile-nav-link" onClick={closeMenu}>About</a>
                </li>
                <li>
                  <a href="/#contact" className="mobile-nav-link" onClick={closeMenu}>Contact</a>
                </li>
              </ul>
              <div className="mobile-user-actions">
                {currentUser ? (
                  <button onClick={handleUserLogout} className="btn btn-secondary btn-sm mobile-logout-btn">
                    Logout
                  </button>
                ) : (
                  <Link to="/auth?mode=login" className="btn btn-secondary btn-sm mobile-login-btn" onClick={closeMenu}>
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default NavigationHeader