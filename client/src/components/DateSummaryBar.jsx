const DateSummaryBar = ({ checkInDate, checkOutDate, guestCount, roomCount = 1 }) => {
  const formatDisplayDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase().replace(',', ',')
  }

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const timeDiff = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  const nights = calculateNights()
  
  return (
    <div className="date-summary-bar">
      <div className="container">
        <div className="date-summary-content">
          <div className="selected-dates">
            <div className="date-range">
              <span className="check-in-date">{formatDisplayDate(checkInDate)}</span>
              <span className="date-arrow">→</span>
              <span className="check-out-date">{formatDisplayDate(checkOutDate)}</span>
            </div>
          </div>
          
          <div className="booking-details">
            <div className="nights-guests">
              <span className="nights">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
              <span className="separator">•</span>
              <span className="guests">
                {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
              </span>
              {roomCount > 1 && (
                <>
                  <span className="separator">•</span>
                  <span className="rooms">
                    {roomCount} {roomCount === 1 ? 'Room' : 'Rooms'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DateSummaryBar