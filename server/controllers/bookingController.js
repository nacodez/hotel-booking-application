import { getFirestoreAdmin } from '../config/firebaseAdmin.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import emailService from '../services/emailService.js'
import cacheService from '../services/cacheService.js'

const firestore = getFirestoreAdmin()

const generateConfirmationNumber = () => {
  const timestamp = Date.now().toString().slice(-6)
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HB${timestamp}${randomStr}`
}

export const createBookingReservation = asyncHandler(async (req, res) => {
  const {
    roomId,
    roomName,
    checkInDate,
    checkOutDate,
    guestCount,
    guestInformation,
    totalAmount,
    pricePerNight
  } = req.body

  const userId = req.user?.uid || req.user?.userId || req.user?.id

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User ID not found in token'
    })
  }

  if (!roomId || !checkInDate || !checkOutDate || !guestInformation) {
    return res.status(400).json({
      success: false,
      message: 'Missing required booking information'
    })
  }

  try {
    const roomDoc = await firestore.collection('rooms').doc(roomId).get()
    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }
    const confirmationNumber = generateConfirmationNumber()
    
    const bookingData = {
      userId,
      roomId,
      roomName,
      checkInDate,
      checkOutDate,
      guestCount: guestCount || 1,
      guestInformation,
      totalAmount,
      pricePerNight,
      confirmationNumber,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const bookingRef = await firestore.collection('bookings').add(bookingData)

    try {
      const roomRef = firestore.collection('rooms').doc(roomId)
      
      await firestore.runTransaction(async (transaction) => {
        const roomDoc = await transaction.get(roomRef)
        const roomData = roomDoc.data()
        const currentBookedDates = roomData.bookedDates || []
        
        const newBooking = {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          bookingId: bookingRef.id
        }
        
        const updatedBookedDates = [...currentBookedDates, newBooking]
        
        transaction.update(roomRef, { bookedDates: updatedBookedDates })
      })
    } catch (updateError) {
      console.error(' Failed to update room bookedDates:', updateError)
    }

    try {
      cacheService.invalidateAvailabilityCache(roomId)
    } catch (cacheError) {
      console.warn(' Cache invalidation failed during booking creation (non-critical):', cacheError.message)
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: bookingRef.id,
        confirmationNumber,
        ...bookingData
      }
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create booking reservation'
    })
  }
})

export const getUserBookingHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  try {
    const bookingsSnapshot = await firestore.collection('bookings')
      .where('userId', '==', userId)
      .get()

    const userBookings = []
    bookingsSnapshot.forEach(doc => {
      userBookings.push({
        id: doc.id,
        ...doc.data()
      })
    })

    userBookings.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB - dateA // Descending order
    })

    res.json({
      success: true,
      data: userBookings
    })
  } catch (error) {
    console.error(' Error fetching user bookings:', error)
    console.error(' Error stack:', error.stack)
    console.error(' Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    })
    
    res.status(500).json({
      success: false,
      message: `Failed to fetch booking history: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export const cancelBookingReservation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const userId = req.user.userId || req.user.uid

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required'
    })
  }

  try {

    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get()

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const bookingData = bookingDoc.data()

    if (bookingData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: `Not authorized to cancel this booking. This booking belongs to user ${bookingData.userId} but you are ${userId}`
      })
    }

    if (bookingData.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      })
    }
    await firestore.collection('bookings').doc(bookingId).update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    try {

      const roomRef = firestore.collection('rooms').doc(bookingData.roomId)
      
      await firestore.runTransaction(async (transaction) => {
        const roomDoc = await transaction.get(roomRef)
        const roomData = roomDoc.data()
        const currentBookedDates = roomData.bookedDates || []
        
        const updatedBookedDates = currentBookedDates.filter(booking => 
          booking.bookingId !== bookingId
        )
        
        transaction.update(roomRef, { bookedDates: updatedBookedDates })

      })
    } catch (updateError) {
      console.error(' Failed to update room bookedDates during cancellation:', updateError)
    }

    try {
      cacheService.invalidateAvailabilityCache(bookingData.roomId)
    } catch (cacheError) {
      console.warn(' Cache invalidation failed (non-critical):', cacheError.message)
    }
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    })
  }
})

export const getBookingDetails = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const userId = req.user.userId || req.user.uid

  try {
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get()

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const bookingData = bookingDoc.data()

    if (bookingData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      })
    }

    res.json({
      success: true,
      data: {
        id: bookingDoc.id,
        ...bookingData
      }
    })
  } catch (error) {
    console.error('Error fetching booking details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details'
    })
  }
})

export const sendBookingEmail = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const { email } = req.body // Get validated email from request body
  const userId = req.user?.uid || req.user?.userId || req.user?.id
  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required'
    })
  }

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email address is required'
    })
  }

  try {
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get()
    
    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const bookingData = bookingDoc.data()
    
    if (bookingData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send email for this booking'
      })
    }

    const bookingDataWithValidatedEmail = {
      ...bookingData,
      guestInformation: {
        ...bookingData.guestInformation,
        email: email // Use validated email from modal
      }
    }

    const emailResult = await emailService.sendBookingConfirmation(bookingDataWithValidatedEmail)
    
    res.json({
      success: true,
      message: 'Booking confirmation email sent successfully',
      data: {
        messageId: emailResult.messageId,
        recipient: emailResult.recipient
      }
    })
  } catch (error) {
    console.error('Error sending booking email:', error)
    
    let errorMessage = 'Failed to send booking confirmation email'
    if (error.message.includes('Email service not initialized')) {
      errorMessage = 'Email service is not properly configured'
    } else if (error.message.includes('authentication')) {
      errorMessage = 'Email authentication failed. Please check email configuration.'
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})