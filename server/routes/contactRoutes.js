import express from 'express'
import rateLimit from 'express-rate-limit'
import { sendContactMessage } from '../controllers/contactController.js'

const router = express.Router()

// Rate limiting for contact form - prevent spam
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 contact form submissions per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

router.use(contactRateLimit)

// POST /api/contact/send-message - Send contact form message
router.post('/send-message', sendContactMessage)

export default router