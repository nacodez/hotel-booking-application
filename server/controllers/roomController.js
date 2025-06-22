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
import cacheService from '../services/cacheService.js'

const firestore = getFirestoreAdmin()

const datesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)
  
  return s1 < e2 && e1 > s2
}

const isRoomAvailableForDates = (room, checkInDate, checkOutDate) => {
  const bookedDates = room.bookedDates || []
  
  for (const booking of bookedDates) {

    if (datesOverlap(checkInDate, checkOutDate, booking.checkIn, booking.checkOut)) {

      return false
    } else {

    }
  }
  return true
}

const checkBatchRoomAvailability = async (roomIds, checkInDate, checkOutDate) => {
  try {

    
    if (roomIds.length === 0) return {}
    
    const cachedResults = cacheService.getCachedAvailability(roomIds, checkInDate, checkOutDate)
    if (cachedResults) {

      return cachedResults
    }
    
    const bookingsRef = firestore.collection('bookings')
    const bookingsQuery = bookingsRef
      .where('roomId', 'in', roomIds)
      .where('status', 'in', ['confirmed', 'checked-in']) // Only active bookings
    
    const bookingsSnapshot = await bookingsQuery.get()
    
    const roomBookings = {}
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data()
      if (!roomBookings[booking.roomId]) {
        roomBookings[booking.roomId] = []
      }
      roomBookings[booking.roomId].push(booking)
    })
    
    const availabilityResults = {}
    roomIds.forEach(roomId => {
      const bookings = roomBookings[roomId] || []
      let hasConflict = false
      
      for (const booking of bookings) {
        if (datesOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)) {

          hasConflict = true
          break
        }
      }
      
      availabilityResults[roomId] = !hasConflict
      if (!hasConflict) {

      }
    })
    
    cacheService.cacheAvailability(roomIds, checkInDate, checkOutDate, availabilityResults)
    
    return availabilityResults
  } catch (error) {
    console.error('Error in batch availability check:', error)
    const errorResults = {}
    roomIds.forEach(roomId => {
      errorResults[roomId] = false
    })
    return errorResults
  }
}

export const searchAvailableRooms = asyncHandler(async (req, res) => {
  const { destinationCity, checkInDate, checkOutDate, guestCount, roomCount, page = 1, limit = 10 } = req.body
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum

  if (!destinationCity || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      success: false,
      message: 'Missing required search parameters'
    })
  }

  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkIn < today) {
    return res.status(400).json({
      success: false,
      message: 'Check-in date cannot be in the past'
    })
  }

  if (checkOut <= checkIn) {
    return res.status(400).json({
      success: false,
      message: 'Check-out date must be after check-in date'
    })
  }

  try {
    const hasSearchCriteria = destinationCity && checkInDate && checkOutDate
    if (hasSearchCriteria) {
      const cachedSearch = cacheService.getCachedSearchResults(
        { destinationCity, checkInDate, checkOutDate, guestCount, roomCount },
        pageNum,
        limitNum
      )
      if (cachedSearch) {

        return res.json({
          success: true,
          data: cachedSearch.data,
          pagination: cachedSearch.pagination,
          searchCriteria: {
            destinationCity,
            checkInDate,
            checkOutDate,
            guestCount,
            roomCount
          }
        })
      }
    }

    
    const roomsRef = firestore.collection('rooms')
    const allRoomsSnapshot = await roomsRef.get()

    
    const roomStatusAnalysis = {}
    const availabilityAnalysis = {}
    const roomsWithIssues = []
    
    allRoomsSnapshot.forEach(doc => {
      const roomData = doc.data()
      const roomId = doc.id
      
      const status = roomData.roomStatus || 'undefined'
      roomStatusAnalysis[status] = (roomStatusAnalysis[status] || 0) + 1
      
      const available = roomData.available === true ? 'true' : (roomData.available === false ? 'false' : 'undefined')
      availabilityAnalysis[available] = (availabilityAnalysis[available] || 0) + 1
      
      if (roomData.available !== true || roomData.roomStatus !== 'available') {
        roomsWithIssues.push({
          id: roomId,
          name: roomData.name || 'Unknown',
          roomNumber: roomData.roomNumber || 'Unknown',
          available: roomData.available,
          roomStatus: roomData.roomStatus,
          reason: roomData.available !== true ? 'available flag is false/missing' : 'roomStatus is not available'
        })
      }
    })

    
    let baseQuery = roomsRef
      .where('available', '==', true)
      .where('roomStatus', '==', 'available')
    const roomSnapshot = await baseQuery.get()
    const availableRooms = []
    const filteredOutRooms = {
      capacity: [],
      dateConflict: [],
      other: []
    }
    
    roomSnapshot.forEach(doc => {
      const roomData = doc.data()
      const roomId = doc.id
      
      if (guestCount && roomData.capacity < parseInt(guestCount)) {

        filteredOutRooms.capacity.push({
          id: roomId,
          name: roomData.name,
          roomNumber: roomData.roomNumber,
          capacity: roomData.capacity,
          required: parseInt(guestCount)
        })
        return
      }
      
      if (checkInDate && checkOutDate) {
        if (!isRoomAvailableForDates(roomData, checkInDate, checkOutDate)) {
          filteredOutRooms.dateConflict.push({
            id: roomId,
            name: roomData.name,
            roomNumber: roomData.roomNumber,
            bookedDates: roomData.bookedDates || [],
            searchDates: { checkInDate, checkOutDate }
          })
          return
        }
      }
      
      const nights = checkInDate && checkOutDate ? Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)) : 1
      const totalPrice = roomData.price * nights
      
      availableRooms.push({
        id: roomId,
        title: roomData.name,
        subtitle: `${roomData.type.charAt(0).toUpperCase() + roomData.type.slice(1)} Room`,
        description: roomData.description,
        image: roomData.images?.[0] || '/placeholder-room.jpg',
        price: totalPrice,
        pricePerNight: roomData.price,
        nights: nights,
        amenities: roomData.amenities || [],
        roomType: roomData.type,
        capacity: roomData.capacity,
        maxOccupancy: roomData.maxOccupancy || roomData.capacity,
        bedType: roomData.bedType,
        roomNumber: roomData.roomNumber,
        hotelId: roomData.hotelId
      })
    })
    
    if (filteredOutRooms.capacity.length > 0) {

    }
    
    if (filteredOutRooms.dateConflict.length > 0) {

    }
    
    const expectedTotal = 30
    const actualTotal = availableRooms.length
    const missingCount = expectedTotal - actualTotal
    
    if (missingCount > 0) {
    }

    const totalCount = availableRooms.length
    const totalPages = Math.ceil(totalCount / limitNum)
    const startIndex = offset
    const endIndex = startIndex + limitNum
    const paginatedRooms = availableRooms.slice(startIndex, endIndex)

    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    const paginationData = {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage,
      hasPrevPage
    }

    const responseData = {
      success: true,
      data: paginatedRooms,
      pagination: paginationData,
      searchCriteria: {
        destinationCity,
        checkInDate,
        checkOutDate,
        guestCount,
        roomCount
      }
    }

    if (hasSearchCriteria) {
      cacheService.cacheSearchResults(
        { destinationCity, checkInDate, checkOutDate, guestCount, roomCount },
        pageNum,
        limitNum,
        paginatedRooms,
        paginationData
      )
    }

    res.json(responseData)
  } catch (error) {
    console.error(' Error searching rooms:', error)
    console.error(' Error details:', error.message)
    console.error(' Error stack:', error.stack)
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
  const { page = 1, limit = 10 } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum
  
  try {
    const cachedRoomData = cacheService.getCachedRoomData(pageNum, limitNum, false)
    if (cachedRoomData) {

      return res.json({
        success: true,
        data: cachedRoomData.data,
        pagination: cachedRoomData.pagination
      })
    }
    const roomsRef = firestore.collection('rooms')
    
    let baseQuery = roomsRef
      .where('available', '==', true)
      .where('roomStatus', '==', 'available')
    
    let totalCount = cacheService.getCachedTotalCount(false)
    if (!totalCount) {

      const totalSnapshot = await baseQuery.select().get() // Only get document IDs, not full data
      totalCount = totalSnapshot.size

      
      cacheService.cacheTotalCount(totalCount, false)
    } else {

    }
    
    const roomSnapshot = await baseQuery
      .limit(limitNum)
      .offset(offset)
      .get()

    const rooms = []
    roomSnapshot.forEach(doc => {
      const roomData = doc.data()
      
      rooms.push({
        id: doc.id,
        title: roomData.name || roomData.title,
        subtitle: `${roomData.type ? roomData.type.charAt(0).toUpperCase() + roomData.type.slice(1) : 'Standard'} Room`,
        description: roomData.description,
        image: roomData.images?.[0] || '/placeholder-room.jpg',
        price: roomData.price,
        amenities: roomData.amenities || [],
        roomType: roomData.type,
        capacity: roomData.capacity,
        maxOccupancy: roomData.maxOccupancy || roomData.capacity,
        bedType: roomData.bedType,
        roomNumber: roomData.roomNumber,
        hotelId: roomData.hotelId
      })
    })

    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    const paginationData = {
      currentPage: pageNum,
      totalPages,
      totalCount,
      limit: limitNum,
      hasNextPage,
      hasPrevPage
    }

    const responseData = {
      success: true,
      data: rooms,
      pagination: paginationData
    }

    cacheService.cacheRoomData(pageNum, limitNum, rooms, paginationData, false)

    res.json(responseData)
  } catch (error) {
    console.error('Error fetching all rooms:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    })
  }
})


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

  const hotel = await getDocument(COLLECTIONS.HOTELS, hotelId)
  if (!hotel || hotel.ownerId !== userId) {
    throw new AuthorizationError('You can only create rooms for your own hotels')
  }

  if (hotel.status !== 'active') {
    throw new ValidationError('Hotel must be active to add rooms')
  }

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

  await updateDocument(COLLECTIONS.HOTELS, hotelId, {
    totalRooms: (hotel.totalRooms || 0) + 1
  })

  cacheService.invalidateRoomCaches()

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

  if (filteredUpdates.price) {
    filteredUpdates.basePrice = parseFloat(filteredUpdates.price)
  }

  if (filteredUpdates.capacity) {
    filteredUpdates.maxOccupancy = parseInt(filteredUpdates.capacity)
  }

  await updateDocument(COLLECTIONS.ROOMS, roomId, filteredUpdates)

  cacheService.invalidateRoomCaches()

  res.json({
    success: true,
    message: 'Room updated successfully'
  })
})

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

  const activeBookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
    { field: 'roomId', operator: '==', value: roomId },
    { field: 'status', operator: 'in', value: ['confirmed', 'pending'] }
  ])

  if (activeBookings.length > 0) {
    throw new ValidationError('Cannot delete room with active bookings')
  }

  await updateDocument(COLLECTIONS.ROOMS, roomId, {
    isActive: false,
    deletedAt: new Date()
  })

  const hotel = await getDocument(COLLECTIONS.HOTELS, room.hotelId)
  if (hotel) {
    await updateDocument(COLLECTIONS.HOTELS, room.hotelId, {
      totalRooms: Math.max((hotel.totalRooms || 1) - 1, 0)
    })
  }

  cacheService.invalidateRoomCaches()

  res.json({
    success: true,
    message: 'Room deleted successfully'
  })
})

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

  cacheService.invalidateRoomCaches()

  res.json({
    success: true,
    message: `Room marked as ${newStatus}`,
    data: {
      roomId,
      status: newStatus
    }
  })
})