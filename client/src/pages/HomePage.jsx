import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { contactAPI } from '../services/apiService'

const HomePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchCriteria, setSearchCriteria] = useState({
    guestCount: 2,
    checkInDate: '',
    checkOutDate: ''
  })
  const [validationErrors, setValidationErrors] = useState({})

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [contactErrors, setContactErrors] = useState({})
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactSubmitStatus, setContactSubmitStatus] = useState(null) // 'success' | 'error'

  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)

    setSearchCriteria(prev => ({
      ...prev,
      checkInDate: tomorrow.toISOString().split('T')[0],
      checkOutDate: dayAfter.toISOString().split('T')[0]
    }))
  }, [])

  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const element = document.querySelector(location.hash)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
    } else {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [location.hash, location.pathname])

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getNextDay = (dateString) => {
    const date = new Date(dateString)
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  }

  const formatDateDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return formatted.replace(/(\w{3}), (\d+) (\w{3}) (\d+)/, '$1, $2 $3 $4').toUpperCase()
  }

  const validateDates = (checkIn, checkOut) => {
    const errors = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate < today) {
      errors.checkInDate = 'Check-in date cannot be in the past'
    }

    if (checkOutDate <= checkInDate) {
      errors.checkOutDate = 'Check-out date must be after check-in date'
    }

    return errors
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchCriteria(prev => {
      let updated = { ...prev, [name]: value }

      if (name === 'checkInDate' && value) {
        const nextDay = getNextDay(value)
        updated.checkOutDate = nextDay
      }

      if (name === 'checkInDate' || name === 'checkOutDate') {
        const errors = validateDates(
          name === 'checkInDate' ? value : updated.checkInDate,
          name === 'checkOutDate' ? value : updated.checkOutDate
        )
        setValidationErrors(errors)
      }

      return updated
    })
  }

  const handleRoomSearch = (e) => {
    e.preventDefault()

    const errors = validateDates(searchCriteria.checkInDate, searchCriteria.checkOutDate)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    const searchParams = new URLSearchParams({
      destinationCity: 'New York', // Default for now
      ...searchCriteria
    })
    navigate(`/search?${searchParams.toString()}`)
  }

  const validateContactForm = (form) => {
    const errors = {}

    if (!form.name.trim()) {
      errors.name = 'Name is required'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }

    if (!form.message.trim()) {
      errors.message = 'Message is required'
    } else if (form.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    } else if (form.message.trim().length > 1000) {
      errors.message = 'Message must not exceed 1000 characters'
    }

    return errors
  }

  const handleContactInputChange = (e) => {
    const { name, value } = e.target
    setContactForm(prev => ({ ...prev, [name]: value }))

    if (contactErrors[name]) {
      setContactErrors(prev => ({ ...prev, [name]: '' }))
    }

    if (contactSubmitStatus) {
      setContactSubmitStatus(null)
    }
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()

    const errors = validateContactForm(contactForm)
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors)
      return
    }

    setIsSubmittingContact(true)
    setContactErrors({})
    setContactSubmitStatus(null)

    try {
      const response = await contactAPI.sendMessage({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message: contactForm.message.trim()
      })

      if (response.success) {
        setContactSubmitStatus('success')
        setContactForm({ name: '', email: '', message: '' }) // Reset form
      } else {
        throw new Error(response.message || 'Failed to send message')
      }
    } catch (error) {
      console.error(' Contact form submission failed:', error)
      setContactSubmitStatus('error')
      setContactErrors({
        submit: error.response?.data?.message || error.message || 'Failed to send message. Please try again.'
      })
    } finally {
      setIsSubmittingContact(false)
    }
  }

  return (
    <div className="home-page">

      <section className="home-hero-section">
        <div className="home-content-wrapper">

          <section className="hero-section">
            <div className="hero-image-container">
              <div className="hero-slideshow">
                <div className="slideshow-container">
                  <div className="slide"></div>
                  <div className="slide"></div>
                  <div className="slide"></div>
                </div>
              </div>
              <div className="hero-gradient-overlay"></div>
            </div>
          </section>
          <section className="booking-search-section">
            <div className="booking-widget-container">
              <div className="booking-widget">
                <h2 className="booking-widget-title">BOOK A ROOM</h2>

                <form onSubmit={handleRoomSearch} className="booking-form">
                  <div className="booking-form-fields">

                    <div className="booking-field">
                      <div className="field-with-icon">
                        <div className="field-icon user-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <select
                          name="guestCount"
                          value={searchCriteria.guestCount}
                          onChange={handleInputChange}
                          className="booking-input booking-select"
                        >
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="booking-field">
                      <div className="field-with-icon">
                        <div className="field-icon calendar-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <input
                          type="date"
                          name="checkInDate"
                          value={searchCriteria.checkInDate}
                          onChange={handleInputChange}
                          min={getTodayDate()}
                          className={`booking-input booking-date ${validationErrors.checkInDate ? 'error' : ''}`}
                          required
                        />
                        <div className="date-display">
                          {formatDateDisplay(searchCriteria.checkInDate)}
                        </div>
                      </div>
                      {validationErrors.checkInDate && (
                        <div className="field-error">{validationErrors.checkInDate}</div>
                      )}
                    </div>
                    <div className="booking-field">
                      <div className="field-with-icon">
                        <div className="field-icon calendar-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>
                        <input
                          type="date"
                          name="checkOutDate"
                          value={searchCriteria.checkOutDate}
                          onChange={handleInputChange}
                          min={getTodayDate()}
                          className={`booking-input booking-date ${validationErrors.checkOutDate ? 'error' : ''}`}
                          required
                        />
                        <div className="date-display">
                          {formatDateDisplay(searchCriteria.checkOutDate)}
                        </div>
                      </div>
                      {validationErrors.checkOutDate && (
                        <div className="field-error">{validationErrors.checkOutDate}</div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="booking-search-button"
                    disabled={Object.keys(validationErrors).length > 0}
                  >
                    SEARCH FOR ROOMS
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </section>
      <section id="about" className="about-section">
        <div className="container">
          <h2>About BookingSuite</h2>
          <div className="about-content">
            <p>
              Welcome to BookingSuite, your premier destination for finding and booking the perfect accommodation in Singapore and beyond. We specialize in connecting
              travelers with exceptional hotels across the Lion City and region, offering comfort, luxury, and unforgettable experiences that showcase the best of
              Southeast Asian hospitality.
            </p>
            <p>
              With our extensive network of partner hotels and user-friendly booking platform, we make it easy to find the ideal room for your stay, whether you're
              exploring Singapore's vibrant districts for business or discovering the cultural treasures of our beautiful island nation for leisure.
            </p>
            <div className="about-features">
              <div className="feature">
                <h3>Best Prices</h3>
                <p>We guarantee competitive rates and exclusive deals on hotel bookings.</p>
              </div>
              <div className="feature">
                <h3>24/7 Support</h3>
                <p>Our customer service team is available around the clock to assist you.</p>
              </div>
              <div className="feature">
                <h3>Easy Booking</h3>
                <p>Simple, secure, and fast booking process with instant confirmation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="contact" className="contact-section">
        <div className="container">
          <h2>Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Phone</h3>
                <p>+65 6789 1234</p>
              </div>
              <div className="contact-item">
                <h3>Email</h3>
                <p>support@bookingsuite.com</p>
              </div>
              <div className="contact-item">
                <h3>Address</h3>
                <p>88 Marina Bay Drive<br />Singapore 018956</p>
              </div>
              <div className="contact-item">
                <h3>Hours</h3>
                <p>24/7 Customer Support<br />Available everyday</p>
              </div>
            </div>
            <div className="contact-form">
              <h3>Send us a message</h3>
              {contactSubmitStatus === 'success' && (
                <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', fontSize: '18px' }}></span>
                    <div>
                      <strong>Message sent successfully!</strong>
                      <br />
                      We'll get back to you soon.
                    </div>
                  </div>
                </div>
              )}
              {contactErrors.submit && (
                <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', fontSize: '18px' }}></span>
                    <div>{contactErrors.submit}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    className={`form-input ${contactErrors.name ? 'error' : ''}`}
                    value={contactForm.name}
                    onChange={handleContactInputChange}
                    disabled={isSubmittingContact}
                  />
                  {contactErrors.name && (
                    <div className="field-error">{contactErrors.name}</div>
                  )}
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    className={`form-input ${contactErrors.email ? 'error' : ''}`}
                    value={contactForm.email}
                    onChange={handleContactInputChange}
                    disabled={isSubmittingContact}
                  />
                  {contactErrors.email && (
                    <div className="field-error">{contactErrors.email}</div>
                  )}
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    className={`form-textarea ${contactErrors.message ? 'error' : ''}`}
                    rows="5"
                    value={contactForm.message}
                    onChange={handleContactInputChange}
                    disabled={isSubmittingContact}
                  ></textarea>
                  {contactErrors.message && (
                    <div className="field-error">{contactErrors.message}</div>
                  )}
                  <div className="character-count" style={{
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'right',
                    marginTop: '4px'
                  }}>
                    {contactForm.message.length}/1000
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmittingContact}
                >
                  {isSubmittingContact ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage