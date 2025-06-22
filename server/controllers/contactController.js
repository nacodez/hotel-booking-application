import { asyncHandler } from '../middleware/errorHandler.js'
import emailService from '../services/emailService.js'

export const sendContactMessage = asyncHandler(async (req, res) => {
  
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required (name, email, message)'
    })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    })
  }

  if (message.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Message must be at least 10 characters long'
    })
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message must not exceed 1000 characters'
    })
  }

  try {
    
    const emailResult = await emailService.sendContactMessage({
      name: name.trim(),
      email: email.trim(),
      message: message.trim()
    })
    
    
    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: {
        messageId: emailResult.messageId
      }
    })
  } catch (error) {
    console.error(' Error sending contact message:', error)
    
    let errorMessage = 'Failed to send your message. Please try again later.'
    if (error.message.includes('Email service not initialized')) {
      errorMessage = 'Email service is currently unavailable. Please try again later.'
    } else if (error.message.includes('authentication')) {
      errorMessage = 'Email configuration error. Please contact support directly.'
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})