import express from 'express'
import { body, query, param } from 'express-validator'
import { 
  submitHotelApplication,
  getMyHotelApplications,
  getMyHotels,
  updateMyHotel,
  getMyHotelRooms,
  // Admin functions
  getAllHotelApplications,
  approveHotelApplication,
  rejectHotelApplication,
  getAllHotels,
  toggleHotelStatus
} from '../controllers/hotelController.js'
import { verifyJWTToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const validateHotelApplication = [
  body('hotelName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hotel name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),
  body('address')
    .isObject()
    .withMessage('Address is required'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('phoneNumber')
    .trim()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('starRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Star rating must be between 1 and 5'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  body('bankingInfo')
    .isObject()
    .withMessage('Banking information is required'),
  body('bankingInfo.accountName')
    .trim()
    .notEmpty()
    .withMessage('Account name is required'),
  body('bankingInfo.accountNumber')
    .trim()
    .notEmpty()
    .withMessage('Account number is required'),
  body('bankingInfo.bankName')
    .trim()
    .notEmpty()
    .withMessage('Bank name is required')
]

const validateHotelUpdate = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),
  body('contactInfo')
    .optional()
    .isObject()
    .withMessage('Contact info must be an object'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  body('starRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Star rating must be between 1 and 5')
]

const validateApplicationApproval = [
  param('applicationId')
    .notEmpty()
    .withMessage('Application ID is required'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
]

const validateApplicationRejection = [
  param('applicationId')
    .notEmpty()
    .withMessage('Application ID is required'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Rejection reason is required and cannot exceed 200 characters'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
]

const validateHotelStatusToggle = [
  param('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required'),
  body('activate')
    .isBoolean()
    .withMessage('Activate must be a boolean'),
  body('reason')
    .if(body('activate').equals(false))
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Suspension reason is required when deactivating hotel')
]

// ==========================================
// HOTEL OWNER ROUTES
// ==========================================

// Submit hotel application
router.post('/application', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  validateHotelApplication, 
  submitHotelApplication
)

router.get('/my-applications', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  getMyHotelApplications
)

router.get('/my-hotels', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  getMyHotels
)

router.put('/my-hotels/:hotelId', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  validateHotelUpdate, 
  updateMyHotel
)

router.get('/my-hotels/:hotelId/rooms', 
  verifyJWTToken, 
  requireRole(['hotel-owner']), 
  getMyHotelRooms
)

// ==========================================
// ADMIN ROUTES
// ==========================================

router.get('/admin/applications', 
  verifyJWTToken, 
  requireRole(['admin']), 
  [
    query('status').optional().isIn(['pending-review', 'approved', 'rejected']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim()
  ],
  getAllHotelApplications
)

router.post('/admin/applications/:applicationId/approve', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateApplicationApproval, 
  approveHotelApplication
)

router.post('/admin/applications/:applicationId/reject', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateApplicationRejection, 
  rejectHotelApplication
)

router.get('/admin/hotels', 
  verifyJWTToken, 
  requireRole(['admin']), 
  [
    query('status').optional().isIn(['active', 'suspended']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim(),
    query('city').optional().trim()
  ],
  getAllHotels
)

router.put('/admin/hotels/:hotelId/status', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateHotelStatusToggle, 
  toggleHotelStatus
)

// ==========================================
// PUBLIC ROUTES (for regular users browsing)
// ==========================================

router.get('/public', 
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('city').optional().trim(),
    query('search').optional().trim()
  ],
  async (req, res, next) => {
    // Override status to only show active hotels for public
    req.query.status = 'active'
    next()
  },
  getAllHotels
)

export default router