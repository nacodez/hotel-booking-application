import express from 'express'
import { body, query, param } from 'express-validator'
import { 
  searchAvailableRooms, 
  getRoomDetails, 
  getAllRooms,
  // Hotel owner functions
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomBookings,
  toggleRoomAvailability
} from '../controllers/roomController.js'
import { optionalAuth, verifyJWTToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const validateSearchCriteria = [
  body('destinationCity')
    .trim()
    .notEmpty()
    .withMessage('Destination city is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City name must be between 2 and 100 characters'),
  body('checkInDate')
    .isISO8601()
    .withMessage('Check-in date must be a valid date'),
  body('checkOutDate')
    .isISO8601()
    .withMessage('Check-out date must be a valid date')
    .custom((checkOutDate, { req }) => {
      if (new Date(checkOutDate) <= new Date(req.body.checkInDate)) {
        throw new Error('Check-out date must be after check-in date')
      }
      return true
    }),
  body('guestCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guest count must be between 1 and 10'),
  body('roomCount')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Room count must be between 1 and 5')
]

const validateRoomCreation = [
  body('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required'),
  body('roomNumber')
    .trim()
    .notEmpty()
    .withMessage('Room number is required'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Room title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Room description must be between 20 and 1000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('capacity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Capacity must be between 1 and 10'),
  body('roomType')
    .optional()
    .isIn(['standard', 'deluxe', 'suite', 'executive', 'presidential'])
    .withMessage('Invalid room type'),
  body('bedType')
    .optional()
    .isIn(['single', 'twin', 'double', 'queen', 'king'])
    .withMessage('Invalid bed type'),
  body('bathrooms')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Bathrooms must be between 1 and 5'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array')
]

const validateRoomUpdate = [
  param('roomId')
    .notEmpty()
    .withMessage('Room ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Room title must be between 5 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Room description must be between 20 and 1000 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Capacity must be between 1 and 10'),
  body('status')
    .optional()
    .isIn(['available', 'occupied', 'maintenance', 'cleaning'])
    .withMessage('Invalid room status')
]

const validateRoomAvailability = [
  param('roomId')
    .notEmpty()
    .withMessage('Room ID is required'),
  body('available')
    .isBoolean()
    .withMessage('Available must be a boolean')
]

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.post('/search', optionalAuth, validateSearchCriteria, searchAvailableRooms)

router.get('/all', optionalAuth, getAllRooms)

router.get('/:roomId', optionalAuth, getRoomDetails)

// ==========================================
// HOTEL OWNER ROUTES
// ==========================================

router.post('/create', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  validateRoomCreation, 
  createRoom
)

router.put('/:roomId', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  validateRoomUpdate, 
  updateRoom
)

router.delete('/:roomId', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  param('roomId').notEmpty().withMessage('Room ID is required'),
  deleteRoom
)

router.get('/:roomId/bookings', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  [
    param('roomId').notEmpty().withMessage('Room ID is required'),
    query('status').optional().isIn(['confirmed', 'pending', 'cancelled', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  getRoomBookings
)

router.put('/:roomId/availability', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  validateRoomAvailability, 
  toggleRoomAvailability
)

export default router