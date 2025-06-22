import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BookingDetailsModal from '../components/BookingDetailsModal'
import CancelBookingModal from '../components/CancelBookingModal'
import { bookingAPI, roomAPI } from '../services/apiService'

const UserDashboard = () => {
  const { currentUser, logoutUser } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('upcoming')
  const [userBookings, setUserBookings] = useState([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [bookingError, setBookingError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  const bookingsPerPage = 6

  const getSearchPlaceholder = () => {
    return isMobile ? "Search by room or confirmation..." : "Search by room name or confirmation number..."
  }

  const getRoomFallbackImage = (roomName, roomId) => {
    const roomType = roomName?.toLowerCase() || ''
    
    if (roomType.includes('suite') || roomType.includes('executive')) {
      return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80' // Luxury suite
    } else if (roomType.includes('deluxe')) {
      return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80' // Deluxe room
    } else if (roomType.includes('standard')) {
      return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80' // Standard room
    } else if (roomType.includes('king')) {
      return 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80' // King bed room
    } else if (roomType.includes('queen')) {
      return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80' // Queen bed room
    } else {
      const fallbacks = [
        'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80'
      ]
      const index = (roomId || '').length % fallbacks.length
      return fallbacks[index]
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        setIsLoadingBookings(true)
        setBookingError(null)
        
        const bookingResponse = await bookingAPI.getUserBookingHistory()
        
        if (!bookingResponse.success) {
          throw new Error(bookingResponse.message || 'Failed to fetch bookings')
        }

        const bookings = bookingResponse.data || []

        if (bookings.length === 0) {
          setUserBookings([])
          return
        }
        const enrichedBookings = await Promise.all(
          bookings.map(async (booking, index) => {
            try {
              const roomResponse = await roomAPI.getRoomDetails(booking.roomId)
              
              const roomData = roomResponse.success ? roomResponse.data : null
              
              let roomImage
              if (roomData?.images && Array.isArray(roomData.images) && roomData.images.length > 0) {
                roomImage = roomData.images[0]
              } else {
                roomImage = getRoomFallbackImage(booking.roomName, booking.roomId)
              }
              
              const enrichedBooking = {
                ...booking,
                roomImage: roomImage,
                contactInfo: {
                  name: `${booking.guestInformation?.firstName || ''} ${booking.guestInformation?.lastName || ''}`.trim(),
                  email: booking.guestInformation?.email || '',
                  phone: booking.guestInformation?.phoneNumber || ''
                },
                specialRequests: booking.guestInformation?.specialRequests || '',
                bookedDate: booking.createdAt
              }
              
              return enrichedBooking
            } catch (roomError) {
              console.error(` Failed to fetch room details for booking:`, {
                bookingId: booking.id,
                roomId: booking.roomId,
                roomName: booking.roomName,
                error: roomError.message,
                stack: roomError.stack
              })
              
              const fallbackImage = getRoomFallbackImage(booking.roomName, booking.roomId)
              
              return {
                ...booking,
                roomImage: fallbackImage,
                contactInfo: {
                  name: `${booking.guestInformation?.firstName || ''} ${booking.guestInformation?.lastName || ''}`.trim(),
                  email: booking.guestInformation?.email || '',
                  phone: booking.guestInformation?.phoneNumber || ''
                },
                specialRequests: booking.guestInformation?.specialRequests || '',
                bookedDate: booking.createdAt
              }
            }
          })
        )
        
        setUserBookings(enrichedBookings)
      } catch (error) {
        console.error(' Error fetching bookings:', error)
        console.error(' Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        })
        
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load bookings'
        setBookingError(errorMessage)
        setUserBookings([]) // Set empty array on error
      } finally {
        setIsLoadingBookings(false)
      }
    }

    if (currentUser) {
      fetchUserBookings()
    } else {
    }
  }, [currentUser])

  const getFilteredBookings = () => {
    const today = new Date()
    let filtered = userBookings

    if (activeTab === 'upcoming') {
      filtered = userBookings.filter(booking => {
        const checkInDate = new Date(booking.checkInDate)
        return checkInDate >= today && booking.status === 'confirmed'
      })
    } else {
      filtered = userBookings.filter(booking => {
        const checkOutDate = new Date(booking.checkOutDate)
        return checkOutDate < today || booking.status === 'completed' || booking.status === 'cancelled'
      })
    }

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.confirmationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
        break
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))
        break
      case 'price-desc':
        filtered.sort((a, b) => b.totalAmount - a.totalAmount)
        break
      case 'price-asc':
        filtered.sort((a, b) => a.totalAmount - b.totalAmount)
        break
      default:
        break
    }

    return filtered
  }

  const filteredBookings = getFilteredBookings()
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * bookingsPerPage,
    currentPage * bookingsPerPage
  )

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    }).format(price).replace('SGD', 'S$')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'status-default'
    }
  }

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  const handleCancelBooking = (booking) => {
    setBookingToCancel(booking)
    setShowCancelModal(true)
  }

  const confirmCancelBooking = async () => {
    try {
      
      const response = await bookingAPI.cancelBookingReservation(bookingToCancel.id)
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel booking')
      }
      
      setUserBookings(prev =>
        prev.map(booking =>
          booking.id === bookingToCancel.id
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      )
      
      setShowCancelModal(false)
      setBookingToCancel(null)
      
    } catch (error) {
      console.error('Error cancelling booking:', error)
      console.error('Cancel error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel booking'
      
      alert(`Failed to cancel booking: ${errorMessage}`)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
  }

  const handleBookNow = () => {
    navigate('/')
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      navigate('/')
    }
  }

  if (!currentUser) {
    navigate('/login')
    return null
  }

  if (isLoadingBookings) {
    return (
      <div className="user-dashboard">
        <div className="container">
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-dashboard">
      <div className="container">
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => handleTabChange('upcoming')}
          >
            Upcoming Bookings
            {userBookings.filter(b => {
              const checkInDate = new Date(b.checkInDate)
              return checkInDate >= new Date() && b.status === 'confirmed'
            }).length > 0 && (
              <span className="tab-count">
                {userBookings.filter(b => {
                  const checkInDate = new Date(b.checkInDate)
                  return checkInDate >= new Date() && b.status === 'confirmed'
                }).length}
              </span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => handleTabChange('past')}
          >
            Past Bookings
          </button>
        </div>
        {filteredBookings.length > 0 && (
          <div className="dashboard-controls">
            <div className="search-section">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                <div className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="sort-section">
              <label htmlFor="sort-select" className="sort-label">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
              </select>
            </div>
          </div>
        )}

        <div className="dashboard-content">
          {paginatedBookings.length === 0 && !bookingError ? (
            <div className="empty-state">
              {activeTab === 'upcoming' ? (
                <div className="empty-content">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                      <circle cx="9" cy="12" r="1"/>
                      <circle cx="15" cy="12" r="1"/>
                    </svg>
                  </div>
                  <h3>No upcoming bookings</h3>
                  <p>Ready for your next adventure? Discover amazing places to stay.</p>
                  <button className="btn btn-primary" onClick={handleBookNow}>
                    Book Your Stay
                  </button>
                </div>
              ) : (
                <div className="empty-content">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <h3>No past bookings yet</h3>
                  <p>Your booking history will appear here once you've completed your stays.</p>
                </div>
              )}
            </div>
          ) : (
            <>

              <div className="bookings-grid">
                {paginatedBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-image">
                      <img 
                        src={booking.roomImage || '/placeholder-room.jpg'} 
                        alt={booking.roomName}
                        className="room-thumbnail"
                      />
                      <div className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="booking-content">
                      <div className="booking-header">
                        <h3 className="room-title">{booking.roomName}</h3>
                        <p className="confirmation-number">#{booking.confirmationNumber}</p>
                      </div>
                      
                      <div className="booking-dates">
                        <div className="date-info">
                          <span className="date-label">Check-in</span>
                          <span className="date-value">{formatDate(booking.checkInDate)}</span>
                        </div>
                        <div className="date-separator">→</div>
                        <div className="date-info">
                          <span className="date-label">Check-out</span>
                          <span className="date-value">{formatDate(booking.checkOutDate)}</span>
                        </div>
                      </div>
                      
                      <div className="booking-details">
                        <div className="detail-item">
                          <span className="detail-label">Guests:</span>
                          <span className="detail-value">{booking.guestCount}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Total:</span>
                          <span className="detail-value price">{formatPrice(booking.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewDetails(booking)}
                      >
                        View Details
                      </button>
                      {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-info">
                    <span>Page {currentPage} of {totalPages}</span>
                    <span className="results-count">
                      ({filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'})
                    </span>
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedBooking(null)
          }}
        />
      )}

      {showCancelModal && bookingToCancel && (
        <CancelBookingModal
          booking={bookingToCancel}
          onConfirm={confirmCancelBooking}
          onCancel={() => {
            setShowCancelModal(false)
            setBookingToCancel(null)
          }}
        />
      )}
    </div>
  )
}

export default UserDashboard