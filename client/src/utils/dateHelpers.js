export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatDateForInput = (date) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

export const calculateNightsBetweenDates = (checkInDate, checkOutDate) => {
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const timeDifference = checkOut.getTime() - checkIn.getTime()
  return Math.ceil(timeDifference / (1000 * 3600 * 24))
}

export const isDateInPast = (dateString) => {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export const getMinimumCheckInDate = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return formatDateForInput(tomorrow)
}

export const getMinimumCheckOutDate = (checkInDate) => {
  if (!checkInDate) return getMinimumCheckInDate()
  const checkIn = new Date(checkInDate)
  checkIn.setDate(checkIn.getDate() + 1)
  return formatDateForInput(checkIn)
}