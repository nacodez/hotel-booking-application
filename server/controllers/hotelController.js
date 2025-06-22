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

// ==========================================
// HOTEL OWNER FUNCTIONS
// ==========================================

export const submitHotelApplication = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid
  const userData = req.user.userData

  if (!userData?.roles?.includes('hotel-owner')) {
    throw new AuthorizationError('Only hotel owners can submit hotel applications')
  }

  if (userData.status !== 'active') {
    throw new AuthorizationError('Your hotel owner account must be approved before submitting hotel applications')
  }

  const {
    hotelName,
    description,
    address,
    city,
    state,
    country,
    postalCode,
    phoneNumber,
    email,
    website,
    starRating,
    amenities,
    policies,
    images,
    bankingInfo
  } = req.body

  const existingHotels = await queryDocuments(COLLECTIONS.HOTEL_APPLICATIONS, [
    { field: 'hotelName', operator: '==', value: hotelName.trim() },
    { field: 'city', operator: '==', value: city.toLowerCase().trim() }
  ])

  if (existingHotels.length > 0) {
    throw new ConflictError('A hotel with this name already exists in this city')
  }

  const applicationData = {
    ownerId: userId,
    ownerEmail: userData.email,
    ownerName: `${userData.firstName} ${userData.lastName}`,
    hotelName: hotelName.trim(),
    description: description.trim(),
    address: {
      street: address.street?.trim(),
      city: city.toLowerCase().trim(),
      state: state?.trim(),
      country: country.trim(),
      postalCode: postalCode?.trim(),
      coordinates: address.coordinates || null
    },
    contactInfo: {
      phoneNumber: phoneNumber.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || null
    },
    starRating: parseInt(starRating) || 0,
    amenities: amenities || [],
    policies: {
      checkIn: policies?.checkIn || '15:00',
      checkOut: policies?.checkOut || '11:00',
      cancellation: policies?.cancellation || 'Free cancellation 24 hours before check-in',
      pets: policies?.pets || false,
      smoking: policies?.smoking || false,
      ageRestriction: policies?.ageRestriction || 18
    },
    images: images || [],
    bankingInfo: {
      accountName: bankingInfo?.accountName?.trim(),
      accountNumber: bankingInfo?.accountNumber?.trim(),
      bankName: bankingInfo?.bankName?.trim(),
      routingNumber: bankingInfo?.routingNumber?.trim(),
      swiftCode: bankingInfo?.swiftCode?.trim()
    },
    status: 'pending-review',
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    approvalComments: null
  }

  const applicationId = await createDocument(COLLECTIONS.HOTEL_APPLICATIONS, applicationData)

  res.status(201).json({
    success: true,
    message: 'Hotel application submitted successfully. It will be reviewed by our team.',
    data: {
      applicationId,
      submittedAt: applicationData.submittedAt
    }
  })
})

export const getMyHotelApplications = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  const applications = await queryDocuments(COLLECTIONS.HOTEL_APPLICATIONS, [
    { field: 'ownerId', operator: '==', value: userId }
  ], { field: 'submittedAt', direction: 'desc' })

  res.json({
    success: true,
    data: {
      applications,
      count: applications.length
    }
  })
})

export const getMyHotels = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  const hotels = await queryDocuments(COLLECTIONS.HOTELS, [
    { field: 'ownerId', operator: '==', value: userId }
  ], { field: 'createdAt', direction: 'desc' })

  res.json({
    success: true,
    data: {
      hotels,
      count: hotels.length
    }
  })
})

export const updateMyHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const userId = req.user.userId || req.user.uid
  const updates = req.body

  const hotel = await getDocument(COLLECTIONS.HOTELS, hotelId)
  if (!hotel) {
    throw new NotFoundError('Hotel not found')
  }

  if (hotel.ownerId !== userId) {
    throw new AuthorizationError('You can only update your own hotels')
  }

  const allowedFields = [
    'description', 'contactInfo', 'amenities', 'policies', 
    'images', 'starRating', 'bankingInfo'
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

  await updateDocument(COLLECTIONS.HOTELS, hotelId, filteredUpdates)

  res.json({
    success: true,
    message: 'Hotel updated successfully'
  })
})

export const getMyHotelRooms = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const userId = req.user.userId || req.user.uid

  const hotel = await getDocument(COLLECTIONS.HOTELS, hotelId)
  if (!hotel || hotel.ownerId !== userId) {
    throw new AuthorizationError('You can only view rooms for your own hotels')
  }

  const rooms = await queryDocuments(COLLECTIONS.ROOMS, [
    { field: 'hotelId', operator: '==', value: hotelId }
  ], { field: 'createdAt', direction: 'desc' })

  res.json({
    success: true,
    data: {
      rooms,
      count: rooms.length
    }
  })
})

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

export const getAllHotelApplications = asyncHandler(async (req, res) => {
  const { 
    status = 'pending-review', 
    page = 1, 
    limit = 20, 
    search 
  } = req.query

  let filters = []
  
  if (status) {
    filters.push({ field: 'status', operator: '==', value: status })
  }

  const allApplications = await queryDocuments(COLLECTIONS.HOTEL_APPLICATIONS, filters, 
    { field: 'submittedAt', direction: 'desc' })

  let filteredApplications = allApplications
  if (search) {
    const searchLower = search.toLowerCase()
    filteredApplications = allApplications.filter(app => 
      app.hotelName?.toLowerCase().includes(searchLower) ||
      app.ownerName?.toLowerCase().includes(searchLower) ||
      app.address?.city?.toLowerCase().includes(searchLower) ||
      app.ownerEmail?.toLowerCase().includes(searchLower)
    )
  }

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedApplications = filteredApplications.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      applications: paginatedApplications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredApplications.length / limit),
        totalApplications: filteredApplications.length,
        applicationsPerPage: parseInt(limit)
      }
    }
  })
})

export const approveHotelApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params
  const { comments } = req.body
  const adminUserId = req.user.userId || req.user.uid

  const application = await getDocument(COLLECTIONS.HOTEL_APPLICATIONS, applicationId)
  if (!application) {
    throw new NotFoundError('Hotel application not found')
  }

  if (application.status !== 'pending-review') {
    throw new ValidationError('Application is not pending review')
  }

  const hotelData = {
    ownerId: application.ownerId,
    ownerEmail: application.ownerEmail,
    ownerName: application.ownerName,
    hotelName: application.hotelName,
    description: application.description,
    address: application.address,
    contactInfo: application.contactInfo,
    starRating: application.starRating,
    amenities: application.amenities,
    policies: application.policies,
    images: application.images,
    bankingInfo: application.bankingInfo,
    status: 'active',
    isVerified: true,
    totalRooms: 0,
    averageRating: 0,
    totalReviews: 0,
    applicationId: applicationId,
    approvedAt: new Date(),
    approvedBy: adminUserId
  }

  const hotelId = await createDocument(COLLECTIONS.HOTELS, hotelData)

  await updateDocument(COLLECTIONS.HOTEL_APPLICATIONS, applicationId, {
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: adminUserId,
    approvalComments: comments || null,
    hotelId: hotelId
  })

  res.json({
    success: true,
    message: 'Hotel application approved successfully',
    data: {
      applicationId,
      hotelId,
      approvedAt: new Date()
    }
  })
})

export const rejectHotelApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params
  const { reason, comments } = req.body
  const adminUserId = req.user.userId || req.user.uid

  if (!reason) {
    throw new ValidationError('Rejection reason is required')
  }

  const application = await getDocument(COLLECTIONS.HOTEL_APPLICATIONS, applicationId)
  if (!application) {
    throw new NotFoundError('Hotel application not found')
  }

  if (application.status !== 'pending-review') {
    throw new ValidationError('Application is not pending review')
  }

  await updateDocument(COLLECTIONS.HOTEL_APPLICATIONS, applicationId, {
    status: 'rejected',
    reviewedAt: new Date(),
    reviewedBy: adminUserId,
    rejectionReason: reason,
    approvalComments: comments || null
  })

  res.json({
    success: true,
    message: 'Hotel application rejected',
    data: {
      applicationId,
      rejectedAt: new Date(),
      reason
    }
  })
})

export const getAllHotels = asyncHandler(async (req, res) => {
  const { 
    status = 'active', 
    page = 1, 
    limit = 20, 
    search,
    city 
  } = req.query

  let filters = []
  
  if (status) {
    filters.push({ field: 'status', operator: '==', value: status })
  }

  if (city) {
    filters.push({ field: 'address.city', operator: '==', value: city.toLowerCase() })
  }

  const allHotels = await queryDocuments(COLLECTIONS.HOTELS, filters, 
    { field: 'createdAt', direction: 'desc' })

  let filteredHotels = allHotels
  if (search) {
    const searchLower = search.toLowerCase()
    filteredHotels = allHotels.filter(hotel => 
      hotel.hotelName?.toLowerCase().includes(searchLower) ||
      hotel.ownerName?.toLowerCase().includes(searchLower) ||
      hotel.address?.city?.toLowerCase().includes(searchLower) ||
      hotel.description?.toLowerCase().includes(searchLower)
    )
  }

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedHotels = filteredHotels.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      hotels: paginatedHotels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredHotels.length / limit),
        totalHotels: filteredHotels.length,
        hotelsPerPage: parseInt(limit)
      }
    }
  })
})

export const toggleHotelStatus = asyncHandler(async (req, res) => {
  const { hotelId } = req.params
  const { activate = true, reason } = req.body
  const adminUserId = req.user.userId || req.user.uid

  const hotel = await getDocument(COLLECTIONS.HOTELS, hotelId)
  if (!hotel) {
    throw new NotFoundError('Hotel not found')
  }

  if (!activate && !reason) {
    throw new ValidationError('Suspension reason is required when deactivating hotel')
  }

  const newStatus = activate ? 'active' : 'suspended'
  const updateData = {
    status: newStatus,
    statusModifiedBy: adminUserId,
    statusModifiedAt: new Date()
  }

  if (!activate) {
    updateData.suspensionReason = reason
    updateData.suspendedAt = new Date()
  } else {
    updateData.suspensionReason = null
    updateData.suspendedAt = null
    updateData.reactivatedAt = new Date()
  }

  await updateDocument(COLLECTIONS.HOTELS, hotelId, updateData)

  res.json({
    success: true,
    message: `Hotel ${activate ? 'activated' : 'suspended'} successfully`,
    data: {
      hotelId,
      status: newStatus,
      modifiedAt: new Date()
    }
  })
})