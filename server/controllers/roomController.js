import { 
  getFirestoreAdmin, 
  createDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments, 
  deleteDocument,
  COLLECTIONS 
} from '../config/firebaseAdmin.js'
import { 
  asyncHandler, 
  AuthenticationError, 
  AuthorizationError,
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../middleware/errorHandler.js'

const firestore = getFirestoreAdmin()

export const searchAvailableRooms = asyncHandler(async (req, res) => {
  const { destinationCity, checkInDate, checkOutDate, guestCount, roomCount } = req.body

  console.log('🔍 Room search request:', { destinationCity, checkInDate, checkOutDate, guestCount, roomCount })

  if (!destinationCity || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      success: false,
      message: 'Missing required search parameters'
    })
  }

  try {
    console.log('📊 Querying rooms collection...')
    const roomsRef = firestore.collection('rooms')
    
    // Simplified query - just get all available rooms for now
    let roomQuery = roomsRef.where('available', '==', true)
    
    console.log('🔥 Executing Firestore query...')
    const roomSnapshot = await roomQuery.get()
    console.log(`📋 Found ${roomSnapshot.size} rooms`)

    const availableRooms = []
    
    roomSnapshot.forEach(doc => {
      const roomData = doc.data()
      console.log(`🏠 Room data:`, { id: doc.id, name: roomData.name, capacity: roomData.capacity })
      
      // Filter by capacity if needed
      if (!guestCount || roomData.capacity >= guestCount) {
        availableRooms.push({
          id: doc.id,
          ...roomData
        })
      }
    })

    console.log(`✅ Returning ${availableRooms.length} available rooms`)

    res.json({
      success: true,
      data: availableRooms,
      searchCriteria: {
        destinationCity,
        checkInDate,
        checkOutDate,
        guestCount,
        roomCount
      }
    })
  } catch (error) {
    console.error('❌ Error searching rooms:', error)
    console.error('❌ Error details:', error.message)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Failed to search available rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export const getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params

  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: 'Room ID is required'
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

    const roomData = roomDoc.data()

    res.json({
      success: true,
      data: {
        id: roomDoc.id,
        ...roomData
      }
    })
  } catch (error) {
    console.error('Error fetching room details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room details'
    })
  }
})

export const getAllRooms = asyncHandler(async (req, res) => {
  try {
    const roomsRef = firestore.collection('rooms')
    const roomSnapshot = await roomsRef.where('available', '==', true).get()

    const rooms = []
    roomSnapshot.forEach(doc => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      })
    })

    res.json({
      success: true,
      data: rooms
    })
  } catch (error) {
    console.error('Error fetching all rooms:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    })
  }
})

// ==========================================
// HOTEL OWNER ROOM MANAGEMENT FUNCTIONS
// ==========================================

// Create room (hotel owner only)
export const createRoom = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid
  const {
    hotelId,
    roomNumber,
    roomType,
    title,
    description,
    price,
    capacity,
    bedType,
    bathrooms,
    size,
    amenities,
    images,
    features,
    policies
  } = req.body

  // Verify hotel ownership
  const hotel = await getDocument(COLLECTIONS.HOTELS, hotelId)
  if (!hotel || hotel.ownerId !== userId) {
    throw new AuthorizationError('You can only create rooms for your own hotels')
  }

  if (hotel.status !== 'active') {
    throw new ValidationError('Hotel must be active to add rooms')
  }

  // Check if room number already exists in this hotel
  const existingRooms = await queryDocuments(COLLECTIONS.ROOMS, [
    { field: 'hotelId', operator: '==', value: hotelId },
    { field: 'roomNumber', operator: '==', value: roomNumber }
  ])

  if (existingRooms.length > 0) {
    throw new ConflictError('Room number already exists in this hotel')
  }

  const roomData = {
    hotelId,
    hotelName: hotel.hotelName,
    ownerId: userId,
    roomNumber: roomNumber.toString(),
    roomType: roomType || 'standard',
    title: title.trim(),
    description: description.trim(),
    price: parseFloat(price),
    capacity: parseInt(capacity),
    bedType: bedType || 'queen',
    bathrooms: parseInt(bathrooms) || 1,
    size: size ? parseFloat(size) : null,
    amenities: amenities || [],
    images: images || [],
    features: features || [],
    policies: {
      smoking: policies?.smoking || false,
      pets: policies?.pets || false,
      extraBed: policies?.extraBed || false,
      extraBedPrice: policies?.extraBedPrice ? parseFloat(policies.extraBedPrice) : 0,
      cancellation: policies?.cancellation || 'Free cancellation 24 hours before check-in',
      checkin: policies?.checkin || '15:00',
      checkout: policies?.checkout || '11:00'
    },
    location: {
      city: hotel.address.city,
      state: hotel.address.state,
      country: hotel.address.country,
      floor: null,
      wing: null,
      viewType: null
    },
    status: 'available',
    isActive: true,
    rating: 0,
    reviewCount: 0,
    maxOccupancy: parseInt(capacity),
    basePrice: parseFloat(price)
  }

  const roomId = await createDocument(COLLECTIONS.ROOMS, roomData)

  // Update hotel's total rooms count
  await updateDocument(COLLECTIONS.HOTELS, hotelId, {
    totalRooms: (hotel.totalRooms || 0) + 1
  })

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: {
      roomId,
      roomNumber,
      hotelId
    }
  })
})

// Update room (hotel owner only)
export const updateRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid
  const updates = req.body

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only update your own rooms')
  }

  // Fields that can be updated by hotel owner
  const allowedFields = [
    'title', 'description', 'price', 'capacity', 'bedType', 'bathrooms',
    'size', 'amenities', 'images', 'features', 'policies', 'status'
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

  // Update price-related fields if price is updated
  if (filteredUpdates.price) {
    filteredUpdates.basePrice = parseFloat(filteredUpdates.price)
  }

  // Update capacity-related fields if capacity is updated
  if (filteredUpdates.capacity) {
    filteredUpdates.maxOccupancy = parseInt(filteredUpdates.capacity)
  }

  await updateDocument(COLLECTIONS.ROOMS, roomId, filteredUpdates)

  res.json({
    success: true,
    message: 'Room updated successfully'
  })
})

// Delete room (hotel owner only)
export const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only delete your own rooms')
  }

  // Check for active bookings
  const activeBookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
    { field: 'roomId', operator: '==', value: roomId },
    { field: 'status', operator: 'in', value: ['confirmed', 'pending'] }
  ])

  if (activeBookings.length > 0) {
    throw new ValidationError('Cannot delete room with active bookings')
  }

  // Soft delete - mark as inactive
  await updateDocument(COLLECTIONS.ROOMS, roomId, {
    isActive: false,
    deletedAt: new Date()
  })

  // Update hotel's total rooms count
  const hotel = await getDocument(COLLECTIONS.HOTELS, room.hotelId)
  if (hotel) {
    await updateDocument(COLLECTIONS.HOTELS, room.hotelId, {
      totalRooms: Math.max((hotel.totalRooms || 1) - 1, 0)
    })
  }

  res.json({
    success: true,
    message: 'Room deleted successfully'
  })
})

// Get room booking history (hotel owner only)
export const getRoomBookings = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid
  const { status, page = 1, limit = 20 } = req.query

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only view bookings for your own rooms')
  }

  let filters = [
    { field: 'roomId', operator: '==', value: roomId }
  ]

  if (status) {
    filters.push({ field: 'status', operator: '==', value: status })
  }

  const allBookings = await queryDocuments(COLLECTIONS.BOOKINGS, filters, 
    { field: 'createdAt', direction: 'desc' })

  // Apply pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedBookings = allBookings.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      bookings: paginatedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allBookings.length / limit),
        totalBookings: allBookings.length,
        bookingsPerPage: parseInt(limit)
      }
    }
  })
})

// Toggle room availability
export const toggleRoomAvailability = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid
  const { available = true } = req.body

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only modify your own rooms')
  }

  const newStatus = available ? 'available' : 'maintenance'

  await updateDocument(COLLECTIONS.ROOMS, roomId, {
    status: newStatus,
    statusUpdatedAt: new Date()
  })

  res.json({
    success: true,
    message: `Room marked as ${newStatus}`,
    data: {
      roomId,
      status: newStatus
    }
  })
})