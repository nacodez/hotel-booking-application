import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const navigate = useNavigate()
  const [searchCriteria, setSearchCriteria] = useState({
    guestCount: 2,
    checkInDate: '',
    checkOutDate: ''
  })
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    // Set default dates - check-in tomorrow, check-out day after
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

  const formatDateDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    // Format like "TUE, 3 JUN 2025"
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
      const updated = { ...prev, [name]: value }
      
      // Validate dates when they change
      if (name === 'checkInDate' || name === 'checkOutDate') {
        const errors = validateDates(
          name === 'checkInDate' ? value : prev.checkInDate,
          name === 'checkOutDate' ? value : prev.checkOutDate
        )
        setValidationErrors(errors)
      }
      
      return updated
    })
  }

  const handleRoomSearch = (e) => {
    e.preventDefault()
    
    // Final validation
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

  return (
    <div className="home-page">
      <section className="hero-search-section">
        {/* Hero Image Background */}
        <div className="hero-image-container">
          <div className="hero-image-placeholder"></div>
          <div className="hero-gradient-overlay"></div>
        </div>

        {/* Booking Widget */}
        <div className="booking-widget-container">
          <div className="booking-widget">
            <h2 className="booking-widget-title">BOOK A ROOM</h2>
            
            <form onSubmit={handleRoomSearch} className="booking-form">
              <div className="booking-form-fields">
                {/* Guests Dropdown */}
                <div className="booking-field">
                  <div className="field-with-icon">
                    <div className="field-icon user-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
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

                {/* Check-in Date */}
                <div className="booking-field">
                  <div className="field-with-icon">
                    <div className="field-icon calendar-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="checkInDate"
                      value={searchCriteria.checkInDate}
                      onChange={handleInputChange}
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

                {/* Check-out Date */}
                <div className="booking-field">
                  <div className="field-with-icon">
                    <div className="field-icon calendar-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="checkOutDate"
                      value={searchCriteria.checkOutDate}
                      onChange={handleInputChange}
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
  )
}

export default HomePage