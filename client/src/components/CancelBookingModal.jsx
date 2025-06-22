import { useState } from 'react'

const CancelBookingModal = ({ booking, onConfirm, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [reason, setReason] = useState('')

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

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error cancelling booking:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onCancel()
    }
  }

  const calculateRefundAmount = () => {
    const checkInDate = new Date(booking.checkInDate)
    const today = new Date()
    const hoursUntilCheckIn = (checkInDate - today) / (1000 * 60 * 60)
    
    if (hoursUntilCheckIn >= 24) {
      return booking.totalAmount
    } else if (hoursUntilCheckIn >= 0) {
      // 50% refund if cancelled within 24 hours
      return booking.totalAmount * 0.5
    } else {
      return 0
    }
  }

  const refundAmount = calculateRefundAmount()
  const isFullRefund = refundAmount === booking.totalAmount

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="cancel-booking-modal">
        <div className="modal-header">
          <h2 className="modal-title">
             Cancel Booking
          </h2>
          <button 
            className="modal-close" 
            onClick={onCancel}
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        <div className="modal-body">

          <div className="warning-section">
            <div className="warning-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 className="warning-title">Are you sure you want to cancel this booking?</h3>
            <p className="warning-message">
              This action cannot be undone. Please review the cancellation details below.
            </p>
          </div>
          <div className="booking-summary">
            <div className="booking-header">
              <h4 className="booking-title">{booking.roomName}</h4>
              <p className="confirmation-number">#{booking.confirmationNumber}</p>
            </div>
            
            <div className="booking-dates">
              <div className="date-range">
                <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
                <span className="guest-count">{booking.guestCount} {booking.guestCount === 1 ? 'guest' : 'guests'}</span>
              </div>
              <div className="booking-total">
                <span className="total-label">Booking Total:</span>
                <span className="total-amount">{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>
          </div>
          <div className="refund-section">
            <h4 className="section-title">Refund Information</h4>
            <div className="refund-details">
              {isFullRefund ? (
                <div className="refund-item positive">
                  <div className="refund-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                  </div>
                  <div className="refund-info">
                    <span className="refund-label">Full Refund Available</span>
                    <span className="refund-amount">{formatPrice(refundAmount)}</span>
                  </div>
                </div>
              ) : refundAmount > 0 ? (
                <div className="refund-item partial">
                  <div className="refund-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div className="refund-info">
                    <span className="refund-label">Partial Refund (50%)</span>
                    <span className="refund-amount">{formatPrice(refundAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="refund-item negative">
                  <div className="refund-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div className="refund-info">
                    <span className="refund-label">No Refund Available</span>
                    <span className="refund-amount">{formatPrice(0)}</span>
                  </div>
                </div>
              )}
              
              <div className="refund-note">
                <p>
                  {isFullRefund 
                    ? "Cancelling more than 24 hours before check-in qualifies for a full refund."
                    : refundAmount > 0 
                      ? "Cancelling within 24 hours of check-in qualifies for a 50% refund."
                      : "Cancelling after the check-in date does not qualify for a refund."
                  }
                </p>
                {refundAmount > 0 && (
                  <p>Refunds will be processed to your original payment method within 5-7 business days.</p>
                )}
              </div>
            </div>
          </div>
          <div className="reason-section">
            <label htmlFor="cancellation-reason" className="reason-label">
              Reason for cancellation (optional)
            </label>
            <textarea
              id="cancellation-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please let us know why you're cancelling so we can improve our service..."
              className="reason-textarea"
              rows="3"
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="modal-btn secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Keep Booking
          </button>
          
          <button 
            className="modal-btn primary"
            onClick={handleConfirm}
            disabled={isProcessing}
            style={{
              background: isProcessing 
                ? 'var(--color-text-muted)' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: isProcessing 
                ? 'none' 
                : '0 4px 14px 0 rgba(239, 68, 68, 0.39)'
            }}
          >
            {isProcessing ? (
              <>
                <div className="spinner"></div>
                Cancelling...
              </>
            ) : (
              'Cancel Booking'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelBookingModal