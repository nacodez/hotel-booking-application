import { 
  getFirestoreAdmin, 
  createDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments, 
  deleteDocument,
  COLLECTIONS 
} from '../config/firebaseAdmin.js'
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js'

const firestore = getFirestoreAdmin()

// ===========================================
// USERS COLLECTION SERVICE
// ===========================================

export class UserService {
  static async createUser(userData) {
    const requiredFields = ['email', 'firstName', 'lastName']
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new ValidationError(`${field} is required`)
      }
    }

    const userDoc = {
      email: userData.email.toLowerCase().trim(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      displayName: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
      emailVerified: userData.emailVerified || false,
      phoneNumber: userData.phoneNumber || null,
      photoURL: userData.photoURL || null,
      status: userData.status || 'active',
      roles: userData.roles || ['user'],
      preferences: userData.preferences || {
        notifications: true,
        newsletter: false,
        language: 'en'
      },
      profile: userData.profile || {
        dateOfBirth: null,
        address: null,
        emergencyContact: null
      },
      loginHistory: [],
      lastLoginAt: null,
      ...userData
    }

    return await createDocument(COLLECTIONS.USERS, userDoc)
  }

  static async getUserById(userId) {
    const user = await getDocument(COLLECTIONS.USERS, userId)
    if (!user) {
      throw new NotFoundError('User not found')
    }
    
    // Remove sensitive information
    const { password, refreshToken, ...safeUser } = user
    return safeUser
  }

  static async getUserByEmail(email) {
    const users = await queryDocuments(COLLECTIONS.USERS, [
      { field: 'email', operator: '==', value: email.toLowerCase() }
    ])
    
    if (users.length === 0) {
      return null
    }
    
    return users[0]
  }

  static async updateUser(userId, updates) {
    const allowedFields = [
      'firstName', 'lastName', 'displayName', 'phoneNumber', 
      'photoURL', 'preferences', 'profile', 'lastLoginAt', 
      'loginHistory', 'emailVerified'
    ]
    
    const filteredUpdates = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw new ValidationError('No valid fields to update')
    }

    return await updateDocument(COLLECTIONS.USERS, userId, filteredUpdates)
  }

  static async updateUserStatus(userId, status) {
    const validStatuses = ['active', 'suspended', 'deactivated', 'deleted']
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status')
    }

    return await updateDocument(COLLECTIONS.USERS, userId, { 
      status,
      statusUpdatedAt: new Date()
    })
  }

  static async deleteUser(userId) {
    // Soft delete - mark as deleted instead of removing
    return await updateDocument(COLLECTIONS.USERS, userId, {
      status: 'deleted',
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${userId}@deleted.com`
    })
  }

  static async searchUsers(searchTerm, filters = {}, pagination = {}) {
    const queryFilters = []
    
    if (filters.status) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status })
    }
    
    if (filters.role) {
      queryFilters.push({ field: 'roles', operator: 'array-contains', value: filters.role })
    }

    const orderBy = { field: 'createdAt', direction: 'desc' }
    const limit = pagination.limit || 20

    return await queryDocuments(COLLECTIONS.USERS, queryFilters, orderBy, limit)
  }
}

// ===========================================
// ROOMS COLLECTION SERVICE
// ===========================================

export class RoomService {
  static async createRoom(roomData) {
    const requiredFields = ['title', 'description', 'price', 'capacity']
    for (const field of requiredFields) {
      if (!roomData[field]) {
        throw new ValidationError(`${field} is required`)
      }
    }

    const roomDoc = {
      title: roomData.title.trim(),
      description: roomData.description.trim(),
      price: Number(roomData.price),
      capacity: Number(roomData.capacity),
      roomType: roomData.roomType || 'standard',
      amenities: roomData.amenities || [],
      images: roomData.images || [],
      features: roomData.features || [],
      policies: roomData.policies || {
        cancellation: 'Free cancellation 24 hours before check-in',
        pets: false,
        smoking: false,
        checkin: '15:00',
        checkout: '11:00'
      },
      location: roomData.location || {
        floor: null,
        wing: null,
        viewType: null
      },
      status: roomData.status || 'available',
      rating: roomData.rating || 0,
      reviewCount: roomData.reviewCount || 0,
      isActive: roomData.isActive !== false
    }

    return await createDocument(COLLECTIONS.ROOMS, roomDoc)
  }

  static async getRoomById(roomId) {
    const room = await getDocument(COLLECTIONS.ROOMS, roomId)
    if (!room || !room.isActive) {
      throw new NotFoundError('Room not found')
    }
    return room
  }

  static async updateRoom(roomId, updates) {
    const room = await getDocument(COLLECTIONS.ROOMS, roomId)
    if (!room) {
      throw new NotFoundError('Room not found')
    }

    const allowedFields = [
      'title', 'description', 'price', 'capacity', 'roomType',
      'amenities', 'images', 'features', 'policies', 'location',
      'status', 'rating', 'reviewCount', 'isActive'
    ]

    const filteredUpdates = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }

    return await updateDocument(COLLECTIONS.ROOMS, roomId, filteredUpdates)
  }

  static async deleteRoom(roomId) {
    // Soft delete - mark as inactive
    return await updateDocument(COLLECTIONS.ROOMS, roomId, {
      isActive: false,
      deletedAt: new Date()
    })
  }

  static async getAvailableRooms(checkInDate, checkOutDate, filters = {}) {
    const queryFilters = [
      { field: 'isActive', operator: '==', value: true },
      { field: 'status', operator: '==', value: 'available' }
    ]

    if (filters.roomType) {
      queryFilters.push({ field: 'roomType', operator: '==', value: filters.roomType })
    }

    if (filters.capacity) {
      queryFilters.push({ field: 'capacity', operator: '>=', value: Number(filters.capacity) })
    }

    if (filters.maxPrice) {
      queryFilters.push({ field: 'price', operator: '<=', value: Number(filters.maxPrice) })
    }

    if (filters.minPrice) {
      queryFilters.push({ field: 'price', operator: '>=', value: Number(filters.minPrice) })
    }

    const orderBy = filters.sortBy === 'price' 
      ? { field: 'price', direction: filters.sortOrder || 'asc' }
      : { field: 'createdAt', direction: 'desc' }

    const rooms = await queryDocuments(COLLECTIONS.ROOMS, queryFilters, orderBy)

    // Filter out rooms with overlapping bookings
    const availableRooms = []
    for (const room of rooms) {
      const isAvailable = await this.checkRoomAvailability(room.id, checkInDate, checkOutDate)
      if (isAvailable) {
        availableRooms.push(room)
      }
    }

    return availableRooms
  }

  static async checkRoomAvailability(roomId, checkInDate, checkOutDate) {
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)

    const overlappingBookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
      { field: 'roomId', operator: '==', value: roomId },
      { field: 'status', operator: 'in', value: ['confirmed', 'pending'] }
    ])

    for (const booking of overlappingBookings) {
      const bookingCheckIn = new Date(booking.checkInDate)
      const bookingCheckOut = new Date(booking.checkOutDate)

      // Check for date overlap
      if (checkIn < bookingCheckOut && checkOut > bookingCheckIn) {
        return false
      }
    }

    return true
  }

  static async searchRooms(searchTerm, filters = {}, pagination = {}) {
    let queryFilters = [
      { field: 'isActive', operator: '==', value: true }
    ]

    if (filters.roomType) {
      queryFilters.push({ field: 'roomType', operator: '==', value: filters.roomType })
    }

    if (filters.amenities && filters.amenities.length > 0) {
      queryFilters.push({ field: 'amenities', operator: 'array-contains-any', value: filters.amenities })
    }

    const orderBy = { field: 'rating', direction: 'desc' }
    const limit = pagination.limit || 20

    return await queryDocuments(COLLECTIONS.ROOMS, queryFilters, orderBy, limit)
  }
}

// ===========================================
// BOOKINGS COLLECTION SERVICE
// ===========================================

export class BookingService {
  static async createBooking(bookingData) {
    const requiredFields = ['userId', 'roomId', 'checkInDate', 'checkOutDate', 'guestCount']
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        throw new ValidationError(`${field} is required`)
      }
    }

    // Validate dates
    const checkIn = new Date(bookingData.checkInDate)
    const checkOut = new Date(bookingData.checkOutDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (checkIn < today) {
      throw new ValidationError('Check-in date cannot be in the past')
    }

    if (checkOut <= checkIn) {
      throw new ValidationError('Check-out date must be after check-in date')
    }

    // Check room availability
    const isAvailable = await RoomService.checkRoomAvailability(
      bookingData.roomId, 
      bookingData.checkInDate, 
      bookingData.checkOutDate
    )

    if (!isAvailable) {
      throw new ValidationError('Room is not available for the selected dates')
    }

    // Get room details for pricing
    const room = await RoomService.getRoomById(bookingData.roomId)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    const roomTotal = room.price * nights
    const taxAndService = roomTotal * 0.09 // 9% tax and service
    const totalPrice = roomTotal + taxAndService

    const bookingDoc = {
      userId: bookingData.userId,
      roomId: bookingData.roomId,
      roomDetails: {
        title: room.title,
        price: room.price,
        capacity: room.capacity
      },
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      guestCount: Number(bookingData.guestCount),
      nights: nights,
      guestInfo: {
        title: bookingData.guestInfo.title || 'Mr.',
        firstName: bookingData.guestInfo.firstName.trim(),
        lastName: bookingData.guestInfo.lastName.trim(),
        email: bookingData.guestInfo.email.toLowerCase().trim(),
        phone: bookingData.guestInfo.phone.trim()
      },
      pricing: {
        roomRate: roomTotal,
        taxAndService: taxAndService,
        totalPrice: totalPrice
      },
      totalPrice: totalPrice,
      status: bookingData.status || 'confirmed',
      specialRequests: bookingData.specialRequests || '',
      bookingSource: bookingData.bookingSource || 'website',
      confirmationNumber: this.generateConfirmationNumber(),
      paymentStatus: bookingData.paymentStatus || 'pending',
      checkedIn: false,
      checkedOut: false,
      cancellationPolicy: 'Free cancellation 24 hours before check-in'
    }

    return await createDocument(COLLECTIONS.BOOKINGS, bookingDoc)
  }

  static generateConfirmationNumber() {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `BK${timestamp.slice(-6)}${random}`
  }

  static async getBookingById(bookingId) {
    const booking = await getDocument(COLLECTIONS.BOOKINGS, bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }
    return booking
  }

  static async getUserBookings(userId, filters = {}) {
    const queryFilters = [
      { field: 'userId', operator: '==', value: userId }
    ]

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryFilters.push({ field: 'status', operator: 'in', value: filters.status })
      } else {
        queryFilters.push({ field: 'status', operator: '==', value: filters.status })
      }
    }

    const orderBy = { field: 'createdAt', direction: 'desc' }
    
    return await queryDocuments(COLLECTIONS.BOOKINGS, queryFilters, orderBy)
  }

  static async updateBooking(bookingId, updates) {
    const booking = await getDocument(COLLECTIONS.BOOKINGS, bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    const allowedFields = [
      'guestInfo', 'specialRequests', 'status', 'paymentStatus',
      'checkedIn', 'checkedOut', 'cancellationReason', 'cancelledAt'
    ]

    const filteredUpdates = {}
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value
      }
    }

    return await updateDocument(COLLECTIONS.BOOKINGS, bookingId, filteredUpdates)
  }

  static async cancelBooking(bookingId, reason = '') {
    const booking = await getDocument(COLLECTIONS.BOOKINGS, bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    if (!['confirmed', 'pending'].includes(booking.status)) {
      throw new ValidationError('Only confirmed or pending bookings can be cancelled')
    }

    // Calculate refund amount based on cancellation policy
    const checkInDate = new Date(booking.checkInDate)
    const now = new Date()
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60)
    
    let refundAmount = 0
    let refundPolicy = 'no-refund'
    
    if (hoursUntilCheckIn >= 24) {
      refundAmount = booking.totalPrice
      refundPolicy = 'full-refund'
    } else if (hoursUntilCheckIn >= 0) {
      refundAmount = booking.totalPrice * 0.5
      refundPolicy = 'partial-refund'
    }

    return await updateDocument(COLLECTIONS.BOOKINGS, bookingId, {
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date(),
      refundAmount,
      refundPolicy
    })
  }

  static async checkInGuest(bookingId) {
    const booking = await getDocument(COLLECTIONS.BOOKINGS, bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    if (booking.status !== 'confirmed') {
      throw new ValidationError('Only confirmed bookings can be checked in')
    }

    return await updateDocument(COLLECTIONS.BOOKINGS, bookingId, {
      checkedIn: true,
      checkInTime: new Date(),
      status: 'active'
    })
  }

  static async checkOutGuest(bookingId) {
    const booking = await getDocument(COLLECTIONS.BOOKINGS, bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    if (!booking.checkedIn) {
      throw new ValidationError('Guest must be checked in before checkout')
    }

    return await updateDocument(COLLECTIONS.BOOKINGS, bookingId, {
      checkedOut: true,
      checkOutTime: new Date(),
      status: 'completed'
    })
  }

  static async getBookingsByDateRange(startDate, endDate, filters = {}) {
    const queryFilters = []

    if (filters.status) {
      queryFilters.push({ field: 'status', operator: '==', value: filters.status })
    }

    if (filters.roomId) {
      queryFilters.push({ field: 'roomId', operator: '==', value: filters.roomId })
    }

    const bookings = await queryDocuments(COLLECTIONS.BOOKINGS, queryFilters)
    
    // Filter by date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return bookings.filter(booking => {
      const checkIn = new Date(booking.checkInDate)
      const checkOut = new Date(booking.checkOutDate)
      
      return (checkIn >= start && checkIn <= end) || 
             (checkOut >= start && checkOut <= end) ||
             (checkIn <= start && checkOut >= end)
    })
  }
}

// ===========================================
// GENERAL DATABASE UTILITIES
// ===========================================

export class DatabaseService {
  static async getCollectionStats() {
    const stats = {}
    
    for (const [name, collection] of Object.entries(COLLECTIONS)) {
      try {
        const docs = await queryDocuments(collection, [], null, 1000)
        stats[name] = {
          totalDocuments: docs.length,
          lastUpdated: new Date()
        }
      } catch (error) {
        stats[name] = {
          error: error.message,
          lastUpdated: new Date()
        }
      }
    }
    
    return stats
  }

  static async healthCheck() {
    try {
      // Test basic connectivity
      await firestore.listCollections()
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        version: 'v1.0.0'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  static async backupCollection(collectionName, limit = 1000) {
    try {
      const docs = await queryDocuments(collectionName, [], null, limit)
      return {
        collection: collectionName,
        documentCount: docs.length,
        data: docs,
        timestamp: new Date()
      }
    } catch (error) {
      throw new Error(`Failed to backup collection ${collectionName}: ${error.message}`)
    }
  }
}

export default {
  UserService,
  RoomService,
  BookingService,
  DatabaseService
}