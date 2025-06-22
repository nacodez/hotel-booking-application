import express from 'express'
import { body, query, param } from 'express-validator'
import { 
  register,
  login,
  logout,
  verifyToken, 
  updateUserProfile, 
  getUserProfile,
  deleteUserAccount,
  changePassword,
  refreshToken,
  // Admin functions
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  updateUserRole,
  toggleUserSuspension
} from '../controllers/authController.js'
import { verifyJWTToken, requireRole } from '../middleware/authMiddleware.js'

const router = express.Router()

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['user', 'hotel-owner', 'admin'])
    .withMessage('Invalid role specified'),
  body('phoneNumber')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  body('businessInfo')
    .optional()
    .isObject()
    .withMessage('Business info must be an object')
]

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

const validateTokenVerification = [
  body('idToken')
    .notEmpty()
    .withMessage('ID token is required')
]

const validateProfileUpdate = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name must be between 1 and 100 characters'),
  body('phoneNumber')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
]

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
]

const validateUserApproval = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
]

const validateUserRejection = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
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

const validateRoleUpdate = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('roles')
    .isArray({ min: 1 })
    .withMessage('Roles array is required')
    .custom((roles) => {
      const validRoles = ['user', 'hotel-owner', 'admin']
      const invalidRoles = roles.filter(role => !validRoles.includes(role))
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`)
      }
      return true
    })
]

const validateUserSuspension = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('suspend')
    .isBoolean()
    .withMessage('Suspend must be a boolean'),
  body('reason')
    .if(body('suspend').equals(true))
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Suspension reason is required when suspending user')
]

// ==========================================
// PUBLIC ROUTES
// ==========================================

// User registration
router.post('/register', validateRegistration, register)

// User login
router.post('/login', validateLogin, login)

// Token verification
router.post('/verify-token', validateTokenVerification, verifyToken)

// Refresh token
router.post('/refresh-token', refreshToken)

// ==========================================
// PROTECTED USER ROUTES
// ==========================================

// User logout
router.post('/logout', verifyJWTToken, logout)

router.get('/profile', verifyJWTToken, getUserProfile)

router.put('/profile', verifyJWTToken, validateProfileUpdate, updateUserProfile)

router.put('/change-password', verifyJWTToken, validatePasswordChange, changePassword)

router.delete('/account', verifyJWTToken, deleteUserAccount)

// ==========================================
// ADMIN ONLY ROUTES
// ==========================================

router.get('/admin/pending-users', 
  verifyJWTToken, 
  requireRole(['admin']), 
  getPendingUsers
)

router.get('/admin/users', 
  verifyJWTToken, 
  requireRole(['admin']), 
  [
    query('status').optional().isIn(['active', 'pending-approval', 'suspended', 'rejected', 'deleted']),
    query('role').optional().isIn(['user', 'hotel-owner', 'admin']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim()
  ],
  getAllUsers
)

router.post('/admin/users/:userId/approve', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateUserApproval, 
  approveUser
)

router.post('/admin/users/:userId/reject', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateUserRejection, 
  rejectUser
)

router.put('/admin/users/:userId/roles', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateRoleUpdate, 
  updateUserRole
)

router.put('/admin/users/:userId/suspension', 
  verifyJWTToken, 
  requireRole(['admin']), 
  validateUserSuspension, 
  toggleUserSuspension
)

export default router