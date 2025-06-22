// Data validation schemas for Firebase collections and API requests

import Joi from 'joi'

// ===========================================
// USER VALIDATION SCHEMAS
// ===========================================

export const userSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters and spaces',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters and spaces',
      'any.required': 'Last name is required'
    }),
  
  displayName: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  
  phoneNumber: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow(null)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  photoURL: Joi.string()
    .uri()
    .optional()
    .allow(null),
  
  emailVerified: Joi.boolean()
    .default(false),
  
  status: Joi.string()
    .valid('active', 'suspended', 'deactivated', 'deleted', 'pending-approval', 'rejected')
    .default('active'),
  
  roles: Joi.array()
    .items(Joi.string().valid('user', 'admin', 'hotel-owner'))
    .default(['user']),
  
  preferences: Joi.object({
    notifications: Joi.boolean().default(true),
    newsletter: Joi.boolean().default(false),
    language: Joi.string().valid('en', 'es', 'fr', 'de').default('en'),
    timezone: Joi.string().optional(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD')
  }).optional(),
  
  profile: Joi.object({
    dateOfBirth: Joi.date().max('now').optional().allow(null),
    address: Joi.object({
      street: Joi.string().max(100).optional(),
      city: Joi.string().max(50).optional(),
      state: Joi.string().max(50).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(50).optional()
    }).optional().allow(null),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional(),
      phone: Joi.string().optional(),
      relationship: Joi.string().max(50).optional()
    }).optional().allow(null)
  }).optional(),
  
  // Business information for hotel owners
  businessInfo: Joi.object({
    businessName: Joi.string().max(100).optional().allow(null),
    businessType: Joi.string().valid('hotel', 'resort', 'motel', 'inn', 'b&b', 'apartment', 'other').optional().allow(null),
    businessAddress: Joi.object({
      street: Joi.string().max(200).optional(),
      city: Joi.string().max(50).optional(),
      state: Joi.string().max(50).optional(),
      zipCode: Joi.string().max(20).optional(),
      country: Joi.string().max(50).optional()
    }).optional().allow(null),
    businessPhone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().allow(null),
    businessEmail: Joi.string().email().optional().allow(null),
    businessRegistrationNumber: Joi.string().max(50).optional().allow(null),
    taxId: Joi.string().max(50).optional().allow(null),
    website: Joi.string().uri().optional().allow(null),
    description: Joi.string().max(1000).optional().allow(null)
  }).optional().allow(null),
  
  // Approval fields for hotel owners
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  approvalDate: Joi.date().optional().allow(null),
  approvedBy: Joi.string().optional().allow(null),
  rejectionReason: Joi.string().max(200).optional().allow(null),
  
  loginHistory: Joi.array()
    .items(Joi.object({
      timestamp: Joi.date().required(),
      ip: Joi.string().ip().optional(),
      userAgent: Joi.string().max(500).optional(),
      success: Joi.boolean().required()
    }))
    .max(50)
    .default([]),
  
  lastLoginAt: Joi.date().optional().allow(null),
  lastLogoutAt: Joi.date().optional().allow(null),
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(() => new Date())
})

export const userRegistrationSchema = Joi.object({
  firstName: userSchema.extract('firstName'),
  lastName: userSchema.extract('lastName'),
  email: userSchema.extract('email'),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Password confirmation must match password',
      'any.required': 'Password confirmation is required'
    }),
  phoneNumber: userSchema.extract('phoneNumber')
})

export const userUpdateSchema = Joi.object({
  firstName: userSchema.extract('firstName').optional(),
  lastName: userSchema.extract('lastName').optional(),
  displayName: userSchema.extract('displayName'),
  phoneNumber: userSchema.extract('phoneNumber'),
  photoURL: userSchema.extract('photoURL'),
  preferences: userSchema.extract('preferences'),
  profile: userSchema.extract('profile')
})

// ===========================================
// ROOM VALIDATION SCHEMAS
// ===========================================

export const roomSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.min': 'Room title must be at least 5 characters',
      'string.max': 'Room title cannot exceed 100 characters',
      'any.required': 'Room title is required'
    }),
  
  description: Joi.string()
    .min(20)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Room description must be at least 20 characters',
      'string.max': 'Room description cannot exceed 1000 characters',
      'any.required': 'Room description is required'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'Room price must be a positive number',
      'any.required': 'Room price is required'
    }),
  
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required()
    .messages({
      'number.integer': 'Room capacity must be a whole number',
      'number.min': 'Room capacity must be at least 1',
      'number.max': 'Room capacity cannot exceed 10',
      'any.required': 'Room capacity is required'
    }),
  
  roomType: Joi.string()
    .valid('standard', 'deluxe', 'suite', 'executive', 'presidential')
    .default('standard'),
  
  amenities: Joi.array()
    .items(Joi.string().valid(
      'wifi', 'ac', 'tv', 'minibar', 'balcony', 'oceanview', 'cityview',
      'kitchenette', 'jacuzzi', 'fireplace', 'workspace', 'safe',
      'hairdryer', 'iron', 'coffee-maker', 'room-service', 'concierge'
    ))
    .unique()
    .default([]),
  
  images: Joi.array()
    .items(Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().max(200).optional(),
      isPrimary: Joi.boolean().default(false),
      order: Joi.number().integer().min(0).optional()
    }))
    .max(10)
    .default([]),
  
  features: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .default([]),
  
  policies: Joi.object({
    cancellation: Joi.string().max(500).default('Free cancellation 24 hours before check-in'),
    pets: Joi.boolean().default(false),
    smoking: Joi.boolean().default(false),
    checkin: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('15:00'),
    checkout: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('11:00'),
    extraBed: Joi.boolean().default(false),
    extraBedPrice: Joi.number().min(0).optional()
  }).default({}),
  
  location: Joi.object({
    floor: Joi.number().integer().min(1).max(50).optional().allow(null),
    wing: Joi.string().valid('north', 'south', 'east', 'west', 'central').optional().allow(null),
    viewType: Joi.string().valid('ocean', 'city', 'garden', 'pool', 'mountain').optional().allow(null),
    accessibility: Joi.boolean().default(false)
  }).default({}),
  
  status: Joi.string()
    .valid('available', 'occupied', 'maintenance', 'cleaning')
    .default('available'),
  
  rating: Joi.number()
    .min(0)
    .max(5)
    .precision(1)
    .default(0),
  
  reviewCount: Joi.number()
    .integer()
    .min(0)
    .default(0),
  
  isActive: Joi.boolean()
    .default(true),
  
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(() => new Date())
})

export const roomUpdateSchema = roomSchema.fork(
  ['title', 'description', 'price', 'capacity'],
  (schema) => schema.optional()
)

export const roomSearchSchema = Joi.object({
  checkInDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Check-in date cannot be in the past',
      'any.required': 'Check-in date is required'
    }),
  
  checkOutDate: Joi.date()
    .greater(Joi.ref('checkInDate'))
    .required()
    .messages({
      'date.greater': 'Check-out date must be after check-in date',
      'any.required': 'Check-out date is required'
    }),
  
  guestCount: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(1),
  
  roomType: Joi.string()
    .valid('standard', 'deluxe', 'suite', 'executive', 'presidential')
    .optional(),
  
  minPrice: Joi.number()
    .min(0)
    .optional(),
  
  maxPrice: Joi.number()
    .min(Joi.ref('minPrice'))
    .optional(),
  
  amenities: Joi.array()
    .items(Joi.string())
    .optional(),
  
  sortBy: Joi.string()
    .valid('price', 'rating', 'capacity', 'createdAt')
    .default('rating'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
})

// ===========================================
// BOOKING VALIDATION SCHEMAS
// ===========================================

export const guestInfoSchema = Joi.object({
  title: Joi.string()
    .valid('Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.')
    .default('Mr.'),
  
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s\-']+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  
  email: Joi.string()
    .email()
    .required(),
  
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  dateOfBirth: Joi.date()
    .max('now')
    .optional(),
  
  nationality: Joi.string()
    .max(50)
    .optional(),
  
  passportNumber: Joi.string()
    .max(20)
    .optional(),
  
  specialRequests: Joi.string()
    .max(500)
    .optional()
})

export const bookingSchema = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  
  roomId: Joi.string()
    .required()
    .messages({
      'any.required': 'Room ID is required'
    }),
  
  checkInDate: Joi.date()
    .min('now')
    .required()
    .messages({
      'date.min': 'Check-in date cannot be in the past',
      'any.required': 'Check-in date is required'
    }),
  
  checkOutDate: Joi.date()
    .greater(Joi.ref('checkInDate'))
    .required()
    .messages({
      'date.greater': 'Check-out date must be after check-in date',
      'any.required': 'Check-out date is required'
    }),
  
  guestCount: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required()
    .messages({
      'number.min': 'Guest count must be at least 1',
      'number.max': 'Guest count cannot exceed 10',
      'any.required': 'Guest count is required'
    }),
  
  guestInfo: guestInfoSchema.required(),
  
  specialRequests: Joi.string()
    .max(500)
    .allow('')
    .default(''),
  
  bookingSource: Joi.string()
    .valid('website', 'mobile', 'phone', 'email', 'walk-in')
    .default('website'),
  
  promocode: Joi.string()
    .max(20)
    .optional(),
  
  agreesToTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must agree to the terms and conditions'
    })
})

export const bookingUpdateSchema = Joi.object({
  guestInfo: guestInfoSchema.optional(),
  specialRequests: Joi.string().max(500).optional(),
  status: Joi.string()
    .valid('pending', 'confirmed', 'cancelled', 'completed', 'no-show')
    .optional(),
  paymentStatus: Joi.string()
    .valid('pending', 'paid', 'refunded', 'failed')
    .optional()
})

// ===========================================
// AUTHENTICATION SCHEMAS
// ===========================================

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),
  
  rememberMe: Joi.boolean()
    .default(false)
})

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation must match new password',
      'any.required': 'Password confirmation is required'
    })
})

export const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
})

// ===========================================
// UTILITY VALIDATION SCHEMAS
// ===========================================

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'price', 'rating', 'name')
    .default('createdAt'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
})

export const idSchema = Joi.object({
  id: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'ID is required',
      'string.min': 'ID cannot be empty',
      'string.max': 'ID is too long'
    })
})

// ===========================================
// VALIDATION HELPER FUNCTIONS
// ===========================================

export const validateSchema = (schema, data, options = {}) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options
  })
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }))
    
    throw new ValidationError('Validation failed', errorDetails)
  }
  
  return value
}

export const createValidationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source]
      req[source] = validateSchema(schema, data)
      next()
    } catch (error) {
      next(error)
    }
  }
}

// ===========================================
// HOTEL VALIDATION SCHEMAS
// ===========================================

export const hotelApplicationSchema = Joi.object({
  hotelName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Hotel name must be at least 2 characters',
      'string.max': 'Hotel name cannot exceed 100 characters',
      'any.required': 'Hotel name is required'
    }),
  
  description: Joi.string()
    .min(20)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Description must be at least 20 characters',
      'string.max': 'Description cannot exceed 1000 characters',
      'any.required': 'Description is required'
    }),
  
  address: Joi.object({
    street: Joi.string().max(200).required(),
    city: Joi.string().max(50).required(),
    state: Joi.string().max(50).optional(),
    country: Joi.string().max(50).required(),
    postalCode: Joi.string().max(20).optional(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).optional(),
      longitude: Joi.number().min(-180).max(180).optional()
    }).optional()
  }).required(),
  
  contactInfo: Joi.object({
    phoneNumber: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    email: Joi.string().email().required(),
    website: Joi.string().uri().optional()
  }).required(),
  
  starRating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .default(3),
  
  amenities: Joi.array()
    .items(Joi.string().valid(
      'wifi', 'parking', 'pool', 'gym', 'spa', 'restaurant', 'bar',
      'room-service', 'concierge', 'laundry', 'business-center',
      'conference-rooms', 'airport-shuttle', 'pet-friendly'
    ))
    .unique()
    .default([]),
  
  policies: Joi.object({
    checkIn: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('15:00'),
    checkOut: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).default('11:00'),
    cancellation: Joi.string().max(500).default('Free cancellation 24 hours before check-in'),
    pets: Joi.boolean().default(false),
    smoking: Joi.boolean().default(false),
    ageRestriction: Joi.number().integer().min(0).max(21).default(18)
  }).default({}),
  
  images: Joi.array()
    .items(Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().max(200).optional(),
      isPrimary: Joi.boolean().default(false),
      order: Joi.number().integer().min(0).optional()
    }))
    .max(20)
    .default([]),
  
  bankingInfo: Joi.object({
    accountName: Joi.string().max(100).required(),
    accountNumber: Joi.string().max(50).required(),
    bankName: Joi.string().max(100).required(),
    routingNumber: Joi.string().max(20).optional(),
    swiftCode: Joi.string().max(20).optional()
  }).required()
})

export const hotelSchema = Joi.object({
  ownerId: Joi.string().required(),
  ownerEmail: Joi.string().email().required(),
  ownerName: Joi.string().max(100).required(),
  hotelName: hotelApplicationSchema.extract('hotelName'),
  description: hotelApplicationSchema.extract('description'),
  address: hotelApplicationSchema.extract('address'),
  contactInfo: hotelApplicationSchema.extract('contactInfo'),
  starRating: hotelApplicationSchema.extract('starRating'),
  amenities: hotelApplicationSchema.extract('amenities'),
  policies: hotelApplicationSchema.extract('policies'),
  images: hotelApplicationSchema.extract('images'),
  bankingInfo: hotelApplicationSchema.extract('bankingInfo'),
  
  status: Joi.string()
    .valid('active', 'suspended', 'pending-verification')
    .default('active'),
  
  isVerified: Joi.boolean().default(true),
  totalRooms: Joi.number().integer().min(0).default(0),
  averageRating: Joi.number().min(0).max(5).default(0),
  totalReviews: Joi.number().integer().min(0).default(0),
  
  applicationId: Joi.string().optional(),
  approvedAt: Joi.date().default(() => new Date()),
  approvedBy: Joi.string().required(),
  
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(() => new Date())
})

export const hotelUpdateSchema = hotelSchema.fork(
  ['ownerId', 'ownerEmail', 'ownerName', 'hotelName', 'approvedAt', 'approvedBy'],
  (schema) => schema.optional()
)

// Custom validation error class
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
    this.statusCode = 400
  }
}

export default {
  userSchema,
  userRegistrationSchema,
  userUpdateSchema,
  roomSchema,
  roomUpdateSchema,
  roomSearchSchema,
  bookingSchema,
  bookingUpdateSchema,
  guestInfoSchema,
  hotelApplicationSchema,
  hotelSchema,
  hotelUpdateSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordSchema,
  paginationSchema,
  idSchema,
  validateSchema,
  createValidationMiddleware,
  ValidationError
}