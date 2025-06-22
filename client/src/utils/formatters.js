export const formatCurrency = (amount, currency = 'SGD') => {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('SGD', 'S$')
}

export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Singapore format: +65 6123 4567 (8 digits after country code)
  if (cleaned.length === 8) {
    return `+65 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  }
  
  // With country code already included
  if (cleaned.length === 10 && cleaned.startsWith('65')) {
    return `+65 ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`
  }
  
  // US format fallback for existing numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phoneNumber
}

export const capitalizeFirstLetter = (string) => {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

export const formatGuestCount = (count) => {
  return `${count} Guest${count === 1 ? '' : 's'}`
}

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export const formatBookingStatus = (status) => {
  const statusMap = {
    'confirmed': 'Confirmed',
    'cancelled': 'Cancelled',
    'checked-in': 'Checked In',
    'checked-out': 'Checked Out',
    'pending': 'Pending'
  }
  return statusMap[status] || capitalizeFirstLetter(status)
}