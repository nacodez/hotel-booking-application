import { useState } from 'react'

const BookingDetailsModal = ({ booking, onClose }) => {
  const [isPrinting, setIsPrinting] = useState(false)

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString = '15:00') => {
    return timeString
  }

  const calculateNights = () => {
    const checkIn = new Date(booking.checkInDate)
    const checkOut = new Date(booking.checkOutDate)
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  }

  const calculateBreakdown = () => {
    const nights = calculateNights()
    const roomRate = nights * (booking.totalAmount / (nights * 1.09)) // Reverse calculate base rate
    const taxAndService = booking.totalAmount - roomRate

    return {
      nights,
      roomRate,
      taxAndService,
      total: booking.totalAmount
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    const printContent = generatePrintContent()
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.onafterprint = () => {
        printWindow.close()
        setIsPrinting(false)
      }
    }
  }

  const generatePrintContent = () => {
    const { nights, roomRate, taxAndService, total } = calculateBreakdown()
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Booking Details - ${booking.confirmationNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .booking-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .confirmation-number {
          font-size: 18px;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .detail-label {
          font-weight: bold;
          width: 150px;
        }
        .detail-value {
          flex: 1;
        }
        .price-breakdown {
          border: 1px solid #ddd;
          padding: 15px;
          background-color: #f9f9f9;
        }
        .total-row {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
          font-size: 16px;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          display: inline-block;
        }
        .status-confirmed { background-color: #d4edda; color: #155724; }
        .status-completed { background-color: #cce5ff; color: #004085; }
        .status-cancelled { background-color: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="booking-title">Hotel Booking Details</div>
        <div class="confirmation-number">Confirmation: ${booking.confirmationNumber}</div>
      </div>

      <div class="section">
        <div class="section-title">Booking Information</div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-badge status-${booking.status}">
              ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Room:</span>
          <span class="detail-value">${booking.roomName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Check-in:</span>
          <span class="detail-value">${formatDate(booking.checkInDate)} from ${formatTime('15:00')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Check-out:</span>
          <span class="detail-value">${formatDate(booking.checkOutDate)} until ${formatTime('11:00')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${nights} ${nights === 1 ? 'night' : 'nights'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Guests:</span>
          <span class="detail-value">${booking.guestCount}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Guest Information</div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${booking.contactInfo.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${booking.contactInfo.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${booking.contactInfo.phone}</span>
        </div>
        ${booking.specialRequests ? `
        <div class="detail-row">
          <span class="detail-label">Special Requests:</span>
          <span class="detail-value">${booking.specialRequests}</span>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">Price Breakdown</div>
        <div class="price-breakdown">
          <div class="detail-row">
            <span class="detail-label">Room rate (${nights} ${nights === 1 ? 'night' : 'nights'}):</span>
            <span class="detail-value">${formatPrice(roomRate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tax & Service Charges:</span>
            <span class="detail-value">${formatPrice(taxAndService)}</span>
          </div>
          <div class="detail-row total-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">${formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Important Information</div>
        <p>• Please bring a valid ID for check-in</p>
        <p>• Check-in time: 3:00 PM | Check-out time: 11:00 AM</p>
        <p>• Free cancellation until 24 hours before check-in</p>
        <p>• For any changes or inquiries, please contact us with your confirmation number</p>
      </div>

      <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
        <p>Thank you for choosing our hotel. We look forward to hosting you!</p>
      </div>
    </body>
    </html>
    `
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const { nights, roomRate, taxAndService, total } = calculateBreakdown()

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="booking-details-modal">
        <div className="modal-header">
          <h2 className="modal-title">Booking Details</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Booking Summary */}
          <div className="booking-summary-section">
            <div className="booking-image-container">
              <img 
                src={booking.roomImage || '/placeholder-room.jpg'} 
                alt={booking.roomName}
                className="booking-image"
              />
              <div className={`status-badge ${booking.status === 'confirmed' ? 'status-confirmed' : booking.status === 'completed' ? 'status-completed' : 'status-cancelled'}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </div>
            </div>
            
            <div className="booking-info">
              <h3 className="room-name">{booking.roomName}</h3>
              <p className="confirmation-number">
                Confirmation: <strong>{booking.confirmationNumber}</strong>
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="details-section">
            <h4 className="section-title">Stay Details</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Check-in</span>
                <span className="detail-value">
                  {formatDate(booking.checkInDate)}
                  <span className="time-info">from {formatTime('15:00')}</span>
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Check-out</span>
                <span className="detail-value">
                  {formatDate(booking.checkOutDate)}
                  <span className="time-info">until {formatTime('11:00')}</span>
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Duration</span>
                <span className="detail-value">{nights} {nights === 1 ? 'night' : 'nights'}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Guests</span>
                <span className="detail-value">{booking.guestCount}</span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="details-section">
            <h4 className="section-title">Guest Information</h4>
            <div className="guest-details">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{booking.contactInfo.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{booking.contactInfo.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{booking.contactInfo.phone}</span>
              </div>
              {booking.specialRequests && (
                <div className="detail-item">
                  <span className="detail-label">Special Requests</span>
                  <span className="detail-value">{booking.specialRequests}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="details-section">
            <h4 className="section-title">Price Breakdown</h4>
            <div className="price-breakdown">
              <div className="price-item">
                <span className="price-label">Room rate ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                <span className="price-value">{formatPrice(roomRate)}</span>
              </div>
              <div className="price-item">
                <span className="price-label">Tax & Service Charges (9%)</span>
                <span className="price-value">{formatPrice(taxAndService)}</span>
              </div>
              <div className="price-divider"></div>
              <div className="price-item total">
                <span className="price-label">Total Amount</span>
                <span className="price-value">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn btn-secondary"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <>
                <div className="spinner"></div>
                Printing...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 6,2 18,2 18,9"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <polyline points="6,14 18,14 18,22 6,22 6,14"/>
                </svg>
                Print Details
              </>
            )}
          </button>
          
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingDetailsModal