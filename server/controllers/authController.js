import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { 
  getAuthAdmin, 
  getFirestoreAdmin, 
  createDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments, 
  COLLECTIONS 
} from '../config/firebaseAdmin.js'
import { 
  asyncHandler, 
  AuthenticationError, 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../middleware/errorHandler.js'

const authAdmin = getAuthAdmin()
const firestore = getFirestoreAdmin()

// JWT Token generation
const generateJWTToken = (userId, email) => {
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'access' 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'hotel-booking-api',
      audience: 'hotel-booking-client'
    }
  )
}

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { 
      userId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      issuer: 'hotel-booking-api',
      audience: 'hotel-booking-client'
    }
  )
}

const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  return await bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

export const register = asyncHandler(async (req, res) => {
  const { 
    firstName, 
    lastName, 
    email, 
    password, 
    role = 'user',
    phoneNumber,
    businessInfo // For hotel owners
  } = req.body

  const validRoles = ['user', 'hotel-owner', 'admin']
  if (!validRoles.includes(role)) {
    throw new ValidationError('Invalid role specified')
  }

  const existingUsers = await queryDocuments(COLLECTIONS.USERS, [
    { field: 'email', operator: '==', value: email.toLowerCase() }
  ])

  if (existingUsers.length > 0) {
    throw new ConflictError('User with this email already exists')
  }

  const hashedPassword = await hashPassword(password)

  const userStatus = role === 'hotel-owner' ? 'pending-approval' : 'active'
  const userRoles = [role]

  const userData = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    emailVerified: false,
    status: userStatus,
    roles: userRoles,
    phoneNumber: phoneNumber?.trim() || null,
    preferences: {
      newsletter: false,
      notifications: true
    },
    profile: {
      phone: phoneNumber?.trim() || null,
      dateOfBirth: null,
      address: null
    },
    loginHistory: [],
    lastLoginAt: null,
    registrationDate: new Date()
  }

  if (role === 'hotel-owner') {
    userData.businessInfo = {
      businessName: businessInfo?.businessName?.trim() || null,
      businessType: businessInfo?.businessType || null,
      businessAddress: businessInfo?.businessAddress || null,
      businessPhone: businessInfo?.businessPhone?.trim() || null,
      businessEmail: businessInfo?.businessEmail?.toLowerCase().trim() || null,
      businessRegistrationNumber: businessInfo?.businessRegistrationNumber?.trim() || null,
      taxId: businessInfo?.taxId?.trim() || null,
      website: businessInfo?.website?.trim() || null,
      description: businessInfo?.description?.trim() || null
    }
    userData.approvalStatus = 'pending'
    userData.approvalDate = null
    userData.approvedBy = null
    userData.rejectionReason = null
  }

  const userId = await createDocument(COLLECTIONS.USERS, userData)

  if (role === 'hotel-owner') {
    res.status(201).json({
      success: true,
      message: 'Hotel owner registration submitted successfully. Your account will be reviewed and you will be notified once approved.',
      data: {
        user: {
          id: userId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          emailVerified: userData.emailVerified,
          status: userData.status,
          roles: userData.roles,
          approvalStatus: userData.approvalStatus
        },
        requiresApproval: true
      }
    })
    return
  }

  const accessToken = generateJWTToken(userId, email)
  const refreshToken = generateRefreshToken(userId)

  await updateDocument(COLLECTIONS.USERS, userId, {
    refreshToken: refreshToken,
    lastLoginAt: new Date()
  })

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        emailVerified: userData.emailVerified,
        status: userData.status,
        roles: userData.roles
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    }
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const users = await queryDocuments(COLLECTIONS.USERS, [
    { field: 'email', operator: '==', value: email.toLowerCase() }
  ])

  if (users.length === 0) {
    throw new AuthenticationError('Invalid email or password')
  }

  const user = users[0]

  if (user.status === 'deactivated') {
    throw new AuthenticationError('Account has been deactivated')
  }

  if (user.status === 'suspended') {
    throw new AuthenticationError('Account has been suspended')
  }

  if (user.status === 'pending-approval') {
    throw new AuthenticationError('Account is pending approval. You will be notified once your registration is reviewed.')
  }

  if (user.status === 'rejected') {
    const reason = user.rejectionReason || 'No specific reason provided'
    throw new AuthenticationError(`Account registration was rejected. Reason: ${reason}`)
  }

  const isPasswordValid = await verifyPassword(password, user.password)
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password')
  }

  const accessToken = generateJWTToken(user.id, user.email)
  const refreshToken = generateRefreshToken(user.id)

  const loginEntry = {
    timestamp: new Date(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    success: true
  }

  const loginHistory = [...(user.loginHistory || []), loginEntry].slice(-10) // Keep last 10 logins

  await updateDocument(COLLECTIONS.USERS, user.id, {
    refreshToken: refreshToken,
    lastLoginAt: new Date(),
    loginHistory
  })

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    }
  })
})

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  await updateDocument(COLLECTIONS.USERS, userId, {
    refreshToken: null,
    lastLogoutAt: new Date()
  })

  res.json({
    success: true,
    message: 'Logout successful'
  })
})

export const verifyToken = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid
  const userData = req.user.userData

  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: userId,
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        email: userData?.email || req.user.email,
        emailVerified: userData?.emailVerified || req.user.emailVerified,
        status: userData?.status || 'active'
      }
    }
  })
})

export const verifyFirebaseToken = asyncHandler(async (req, res) => {
  const { idToken } = req.body

  if (!idToken) {
    throw new AuthenticationError('ID token is required')
  }

  const decodedToken = await authAdmin.verifyIdToken(idToken)
  
  let userData = await getDocument(COLLECTIONS.USERS, decodedToken.uid)
  
  if (!userData) {
    const newUserData = {
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      firstName: decodedToken.name?.split(' ')[0] || '',
      lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
      status: 'active',
      roles: ['user'],
      provider: 'firebase',
      firebaseUid: decodedToken.uid
    }
    
    await createDocument(COLLECTIONS.USERS, newUserData)
    userData = { id: decodedToken.uid, ...newUserData }
  }

  await updateDocument(COLLECTIONS.USERS, decodedToken.uid, {
    lastLoginAt: new Date()
  })

  res.json({
    success: true,
    message: 'Firebase token verified successfully',
    data: {
      user: {
        id: decodedToken.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        emailVerified: userData.emailVerified,
        status: userData.status
      }
    }
  })
})

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token is required')
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type')
    }

    const userData = await getDocument(COLLECTIONS.USERS, decoded.userId)
    if (!userData || userData.refreshToken !== refreshToken) {
      throw new AuthenticationError('Invalid refresh token')
    }

    const newAccessToken = generateJWTToken(userData.id, userData.email)
    const newRefreshToken = generateRefreshToken(userData.id)

    await updateDocument(COLLECTIONS.USERS, userData.id, {
      refreshToken: newRefreshToken
    })

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      }
    })
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token')
  }
})

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.userId || req.user.uid

  const userData = await getDocument(COLLECTIONS.USERS, userId)
  if (!userData) {
    throw new NotFoundError('User not found')
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, userData.password)
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect')
  }

  const hashedNewPassword = await hashPassword(newPassword)

  await updateDocument(COLLECTIONS.USERS, userId, {
    password: hashedNewPassword,
    refreshToken: null,
    passwordChangedAt: new Date()
  })

  res.json({
    success: true,
    message: 'Password changed successfully'
  })
})

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  const userData = await getDocument(COLLECTIONS.USERS, userId)
  if (!userData) {
    throw new NotFoundError('User profile not found')
  }

  const { password, refreshToken, ...safeUserData } = userData

  res.json({
    success: true,
    data: {
      user: {
        id: userId,
        ...safeUserData
      }
    }
  })
})

export const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid
  const updates = req.body

  const { password, email, roles, status, refreshToken, ...allowedUpdates } = updates

  if (Object.keys(allowedUpdates).length === 0) {
    throw new ValidationError('No valid fields to update')
  }

  await updateDocument(COLLECTIONS.USERS, userId, allowedUpdates)

  res.json({
    success: true,
    message: 'Profile updated successfully'
  })
})

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  const activeBookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
    { field: 'userId', operator: '==', value: userId },
    { field: 'status', operator: 'in', value: ['confirmed', 'pending'] }
  ])

  for (const booking of activeBookings) {
    await updateDocument(COLLECTIONS.BOOKINGS, booking.id, {
      status: 'cancelled',
      cancellationReason: 'Account deleted',
      cancelledAt: new Date()
    })
  }

  await updateDocument(COLLECTIONS.USERS, userId, {
    status: 'deleted',
    deletedAt: new Date(),
    email: `deleted_${Date.now()}_${userId}@deleted.com`, // Anonymize email
    refreshToken: null
  })

  res.json({
    success: true,
    message: 'Account deleted successfully'
  })
})

// ==========================================
// ADMIN FUNCTIONS FOR USER MANAGEMENT
// ==========================================

export const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await queryDocuments(COLLECTIONS.USERS, [
    { field: 'status', operator: '==', value: 'pending-approval' }
  ])

  const safeUsers = pendingUsers.map(user => {
    const { password, refreshToken, ...safeUser } = user
    return safeUser
  })

  res.json({
    success: true,
    data: {
      users: safeUsers,
      count: safeUsers.length
    }
  })
})

export const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { comments } = req.body
  const adminUserId = req.user.userId || req.user.uid

  const userData = await getDocument(COLLECTIONS.USERS, userId)
  if (!userData) {
    throw new NotFoundError('User not found')
  }

  if (userData.status !== 'pending-approval') {
    throw new ValidationError('User is not pending approval')
  }

  await updateDocument(COLLECTIONS.USERS, userId, {
    status: 'active',
    approvalStatus: 'approved',
    approvalDate: new Date(),
    approvedBy: adminUserId,
    approvalComments: comments || null
  })

  res.json({
    success: true,
    message: 'User approved successfully',
    data: {
      userId,
      approvedAt: new Date()
    }
  })
})

export const rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { reason, comments } = req.body
  const adminUserId = req.user.userId || req.user.uid

  if (!reason) {
    throw new ValidationError('Rejection reason is required')
  }

  const userData = await getDocument(COLLECTIONS.USERS, userId)
  if (!userData) {
    throw new NotFoundError('User not found')
  }

  if (userData.status !== 'pending-approval') {
    throw new ValidationError('User is not pending approval')
  }

  await updateDocument(COLLECTIONS.USERS, userId, {
    status: 'rejected',
    approvalStatus: 'rejected',
    approvalDate: new Date(),
    approvedBy: adminUserId,
    rejectionReason: reason,
    approvalComments: comments || null
  })

  res.json({
    success: true,
    message: 'User registration rejected',
    data: {
      userId,
      rejectedAt: new Date(),
      reason
    }
  })
})

export const getAllUsers = asyncHandler(async (req, res) => {
  const { 
    status, 
    role, 
    page = 1, 
    limit = 20, 
    search 
  } = req.query

  let filters = []
  
  if (status) {
    filters.push({ field: 'status', operator: '==', value: status })
  }
  
  if (role) {
    filters.push({ field: 'roles', operator: 'array-contains', value: role })
  }

  const allUsers = await queryDocuments(COLLECTIONS.USERS, filters, 
    { field: 'registrationDate', direction: 'desc' })

  let filteredUsers = allUsers
  if (search) {
    const searchLower = search.toLowerCase()
    filteredUsers = allUsers.filter(user => 
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.businessInfo?.businessName?.toLowerCase().includes(searchLower)
    )
  }

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const safeUsers = paginatedUsers.map(user => {
    const { password, refreshToken, ...safeUser } = user
    return safeUser
  })

  res.json({
    success: true,
    data: {
      users: safeUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredUsers.length / limit),
        totalUsers: filteredUsers.length,
        usersPerPage: parseInt(limit)
      }
    }
  })
})

export const updateUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { roles } = req.body
  const adminUserId = req.user.userId || req.user.uid

  if (!Array.isArray(roles) || roles.length === 0) {
    throw new ValidationError('Valid roles array is required')
  }

  const validRoles = ['user', 'hotel-owner', 'admin']
  const invalidRoles = roles.filter(role => !validRoles.includes(role))
  
  if (invalidRoles.length > 0) {
    throw new ValidationError(`Invalid roles: ${invalidRoles.join(', ')}`)
  }

  const userData = await getDocument(COLLECTIONS.USERS, userId)
  if (!userData) {
    throw new NotFoundError('User not found')
  }

  await updateDocument(COLLECTIONS.USERS, userId, {
    roles,
    roleUpdatedBy: adminUserId,
    roleUpdatedAt: new Date()
  })

  res.json({
    success: true,
    message: 'User roles updated successfully',
    data: {
      userId,
      newRoles: roles,
      updatedAt: new Date()
    }
  })
})

export const toggleUserSuspension = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { reason, suspend = true } = req.body
  const adminUserId = req.user.userId || req.user.uid

  const userData = await getDocument(COLLECTIONS.USERS, userId)
  if (!userData) {
    throw new NotFoundError('User not found')
  }

  if (suspend && !reason) {
    throw new ValidationError('Suspension reason is required')
  }

  const newStatus = suspend ? 'suspended' : 'active'
  const updateData = {
    status: newStatus,
    suspensionModifiedBy: adminUserId,
    suspensionModifiedAt: new Date()
  }

  if (suspend) {
    updateData.suspensionReason = reason
    updateData.suspendedAt = new Date()
  } else {
    updateData.suspensionReason = null
    updateData.suspendedAt = null
    updateData.reactivatedAt = new Date()
  }

  await updateDocument(COLLECTIONS.USERS, userId, updateData)

  res.json({
    success: true,
    message: `User ${suspend ? 'suspended' : 'reactivated'} successfully`,
    data: {
      userId,
      status: newStatus,
      modifiedAt: new Date()
    }
  })
})