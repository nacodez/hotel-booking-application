import emailService from '../services/emailService.js'
import { body, validationResult } from 'express-validator'

class EmailController {
  async sendBookingConfirmation(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        })
      }

      const {
        guestInformation,
        bookingDetails,
        confirmationNumber,
        bookingId,
        totalAmount,
        pricePerNight
      } = req.body

      if (!guestInformation || !guestInformation.email) {
        return res.status(400).json({
          success: false,
          message: 'Guest email is required'
        })
      }

      if (!bookingDetails || !confirmationNumber) {
        return res.status(400).json({
          success: false,
          message: 'Booking details and confirmation number are required'
        })
      }

      const bookingData = {
        guestInformation,
        bookingDetails,
        confirmationNumber,
        bookingId,
        totalAmount,
        pricePerNight
      }

      const result = await emailService.sendBookingConfirmation(bookingData)
      res.status(200).json({
        success: true,
        message: 'Booking confirmation email sent successfully',
        data: {
          emailSent: true,
          recipient: guestInformation.email,
          confirmationNumber,
          messageId: result.messageId,
          ...(result.previewUrl && { previewUrl: result.previewUrl })
        }
      })

    } catch (error) {
      console.error(' Error sending booking confirmation email:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to send booking confirmation email',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  }

  async testEmailConnection(req, res) {
    try {
      const result = await emailService.verifyConnection()
      
      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Email service is working correctly',
          data: result
        })
      } else {
        res.status(500).json({
          success: false,
          message: 'Email service connection failed',
          error: result.error
        })
      }
    } catch (error) {
      console.error(' Error testing email connection:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to test email connection',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  }

  async sendTestEmail(req, res) {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email address is required'
        })
      }

      const testBookingData = {
        guestInformation: {
          title: 'Mr.',
          firstName: 'John',
          lastName: 'Doe',
          email: email,
          phoneNumber: '+65 1234 5678',
          specialRequests: 'This is a test booking email'
        },
        bookingDetails: {
          roomName: 'Deluxe Ocean View Room',
          checkInDate: new Date().toISOString(),
          checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          guestCount: 2
        },
        confirmationNumber: 'TEST' + Date.now(),
        bookingId: 'test-booking-id',
        totalAmount: 250.00,
        pricePerNight: 125.00
      }

      const result = await emailService.sendBookingConfirmation(testBookingData)

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          recipient: email,
          messageId: result.messageId,
          ...(result.previewUrl && { previewUrl: result.previewUrl })
        }
      })

    } catch (error) {
      console.error(' Error sending test email:', error)
      
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      })
    }
  }
}

const validateBookingConfirmation = [
  body('guestInformation.email')
    .isEmail()
    .withMessage('Valid email address is required'),
  body('guestInformation.firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('guestInformation.lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('confirmationNumber')
    .notEmpty()
    .withMessage('Confirmation number is required'),
  body('bookingDetails.checkInDate')
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  body('bookingDetails.checkOutDate')
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  body('totalAmount')
    .isNumeric()
    .withMessage('Total amount must be a number'),
  body('pricePerNight')
    .isNumeric()
    .withMessage('Price per night must be a number')
]

const validateTestEmail = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
]

const emailController = new EmailController()
export { emailController as EmailController, validateBookingConfirmation, validateTestEmail }