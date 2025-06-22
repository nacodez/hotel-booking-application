import { body, param, query, validationResult } from 'express-validator'
import { ValidationError } from './errorHandler.js'

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg)
    throw new ValidationError('Validation failed', errorMessages)
  }
  next()
}

export const validateRegister = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password')
      }
      return true
    }),

  handleValidationErrors
]

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
]

export const validateAvailableRoomsQuery = [
  query('checkInDate')
    .isISO8601()
    .withMessage('Check-in date must be a valid date')
    .custom((value) => {
      const checkInDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (checkInDate < today) {
        throw new Error('Check-in date cannot be in the past')
      }
      return true
    }),
  
  query('checkOutDate')
    .isISO8601()
    .withMessage('Check-out date must be a valid date')
    .custom((value, { req }) => {
      const checkInDate = new Date(req.query.checkInDate)
      const checkOutDate = new Date(value)
      
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date')
      }
      
      const maxStay = new Date(checkInDate)
      maxStay.setDate(maxStay.getDate() + 30)
      
      if (checkOutDate > maxStay) {
        throw new Error('Maximum stay is 30 days')
      }
      
      return true
    }),
  
  query('guestCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guest count must be between 1 and 10'),
  
  query('roomType')
    .optional()
    .isIn(['standard', 'deluxe', 'suite', 'executive'])
    .withMessage('Invalid room type'),

  handleValidationErrors
]

export const validateRoomId = [
  param('id')
    .notEmpty()
    .withMessage('Room ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid room ID format'),

  handleValidationErrors
]

export const validateCreateBooking = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required'),
  
  body('checkInDate')
    .isISO8601()
    .withMessage('Check-in date must be a valid date')
    .custom((value) => {
      const checkInDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (checkInDate < today) {
        throw new Error('Check-in date cannot be in the past')
      }
      return true
    }),
  
  body('checkOutDate')
    .isISO8601()
    .withMessage('Check-out date must be a valid date')
    .custom((value, { req }) => {
      const checkInDate = new Date(req.body.checkInDate)
      const checkOutDate = new Date(value)
      
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date')
      }
      return true
    }),
  
  body('guestCount')
    .isInt({ min: 1, max: 10 })
    .withMessage('Guest count must be between 1 and 10'),
  
  body('contactInfo.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('contactInfo.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('contactInfo.phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),

  handleValidationErrors
]

export const validateBookingId = [
  param('id')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid booking ID format'),

  handleValidationErrors
]

export const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid user ID format'),

  handleValidationErrors
]

export const validateCancelBooking = [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Cancellation reason cannot exceed 500 characters'),

  handleValidationErrors
]

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
]

export const validateSorting = [
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'price', 'rating', 'name'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),

  handleValidationErrors
]

export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str
    
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .trim()
  }

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return sanitizeString(obj)
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }

    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }

  req.body = sanitizeObject(req.body)
  req.query = sanitizeObject(req.query)
  req.params = sanitizeObject(req.params)

  next()
}

export const isValidDateRange = (checkInDate, checkOutDate) => {
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    checkIn >= today &&
    checkOut > checkIn &&
    (checkOut - checkIn) / (1000 * 60 * 60 * 24) <= 30
  )
}

export const isValidGuestCount = (count) => {
  return Number.isInteger(count) && count >= 1 && count <= 10
}

export const isValidRoomType = (type) => {
  const validTypes = ['standard', 'deluxe', 'suite', 'executive']
  return validTypes.includes(type)
}