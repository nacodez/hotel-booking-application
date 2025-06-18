import express from 'express'
import { EmailController, validateBookingConfirmation, validateTestEmail } from '../controllers/emailController.js'
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply authentication middleware to all email routes
router.use(optionalAuth)

/**
 * @route   POST /api/email/booking-confirmation
 * @desc    Send booking confirmation email
 * @access  Private (Authenticated users only)
 */
router.post('/booking-confirmation', 
  requireAuth,
  validateBookingConfirmation,
  EmailController.sendBookingConfirmation
)

/**
 * @route   GET /api/email/test-connection
 * @desc    Test email service connection
 * @access  Private (Authenticated users only)
 */
router.get('/test-connection',
  requireAuth,
  EmailController.testEmailConnection
)

/**
 * @route   POST /api/email/test
 * @desc    Send test email (for development/testing)
 * @access  Private (Authenticated users only)
 */
router.post('/test',
  requireAuth,
  validateTestEmail,
  EmailController.sendTestEmail
)

export default router