import nodemailer from 'nodemailer'
import { getDocument, COLLECTIONS } from '../config/firebaseAdmin.js'

class EmailService {
  constructor() {
    this.transporter = null
    this.initialize()
  }

  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })
      
    } catch (error) {
      console.error(' Email service initialization failed:', error)
    }
  }

  generateBookingConfirmationEmail(bookingData, roomData) {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatPrice = (price) => {
      return `S$${price.toFixed(2)}`
    }

    const calculateNights = () => {
      const checkIn = new Date(bookingData.checkInDate)
      const checkOut = new Date(bookingData.checkOutDate)
      return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    }

    const nights = calculateNights()

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: #f5f5f5;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background-color: #1a1a1a; 
                color: white; 
                padding: 30px; 
                text-align: center;
            }
            .header h1 { 
                margin: 0; 
                font-size: 24px;
            }
            .content { 
                padding: 30px;
            }
            .confirmation-number {
                background-color: #f8f9fa;
                border: 2px solid #2c5282;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                margin: 20px 0;
            }
            .confirmation-number h2 {
                color: #2c5282;
                margin: 0;
                font-size: 20px;
            }
            .booking-details {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: bold;
                color: #4a5568;
            }
            .detail-value {
                color: #1a1a1a;
            }
            .total-row {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-top: 10px;
            }
            .total-row .detail-label,
            .total-row .detail-value {
                font-size: 18px;
                font-weight: bold;
                color: #2c5282;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #718096;
                font-size: 14px;
            }
            @media only screen and (max-width: 600px) {
                .container { margin: 0; border-radius: 0; }
                .content { padding: 20px; }
                .header { padding: 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1> Hotel Booking Confirmation</h1>
                <p style="margin: 10px 0 0 0;">Thank you for choosing our hotel!</p>
            </div>
            
            <div class="content">
                <div class="confirmation-number">
                    <h2>Confirmation Number</h2>
                    <div style="font-size: 24px; font-weight: bold; color: #1a1a1a; margin-top: 10px;">
                        ${bookingData.confirmationNumber}
                    </div>
                </div>

                <h3 style="color: #1a1a1a; margin-bottom: 15px;">Booking Details</h3>
                <div class="booking-details">
                    <div class="detail-row">
                        <span class="detail-label">Guest Name:</span>
                        <span class="detail-value">${bookingData.guestInformation.firstName} ${bookingData.guestInformation.lastName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${bookingData.guestInformation.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${bookingData.guestInformation.phoneNumber}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Room:</span>
                        <span class="detail-value">${roomData?.name || bookingData.roomName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Check-in:</span>
                        <span class="detail-value">${formatDate(bookingData.checkInDate)} at 3:00 PM</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Check-out:</span>
                        <span class="detail-value">${formatDate(bookingData.checkOutDate)} at 11:00 AM</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Guests:</span>
                        <span class="detail-value">${bookingData.guestCount} ${bookingData.guestCount === 1 ? 'guest' : 'guests'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Nights:</span>
                        <span class="detail-value">${nights} ${nights === 1 ? 'night' : 'nights'}</span>
                    </div>
                </div>

                <h3 style="color: #1a1a1a; margin-bottom: 15px;">Price Breakdown</h3>
                <div class="booking-details">
                    <div class="detail-row">
                        <span class="detail-label">Room Rate (${nights} ${nights === 1 ? 'night' : 'nights'}):</span>
                        <span class="detail-value">${formatPrice(bookingData.totalAmount)}</span>
                    </div>
                    <div class="total-row">
                        <div class="detail-row">
                            <span class="detail-label">Total Amount:</span>
                            <span class="detail-value">${formatPrice(bookingData.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                <div style="background-color: #e6fffa; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #22543d;">Important Information</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #22543d;">
                        <li>Please bring a valid photo ID for check-in</li>
                        <li>Check-in time: 3:00 PM | Check-out time: 11:00 AM</li>
                        <li>Cancellation policy: Free cancellation until 24 hours before check-in</li>
                        <li>For any changes or inquiries, please contact us with your confirmation number</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p><strong>Hotel Booking System</strong></p>
                <p>Email: support@bookingsuite.com | Phone: +65 6789 1234</p>
                <p>Thank you for choosing our hotel. We look forward to welcoming you!</p>
            </div>
        </div>
    </body>
    </html>
    `

    return {
      subject: `Booking Confirmation - ${bookingData.confirmationNumber}`,
      html: htmlContent,
      text: `
Booking Confirmation

Confirmation Number: ${bookingData.confirmationNumber}

Guest: ${bookingData.guestInformation.firstName} ${bookingData.guestInformation.lastName}
Email: ${bookingData.guestInformation.email}
Phone: ${bookingData.guestInformation.phoneNumber}

Room: ${roomData?.name || bookingData.roomName}
Check-in: ${formatDate(bookingData.checkInDate)} at 3:00 PM
Check-out: ${formatDate(bookingData.checkOutDate)} at 11:00 AM
Guests: ${bookingData.guestCount}
Nights: ${nights}

Total Amount: ${formatPrice(bookingData.totalAmount)}

Please save this confirmation for your records.
Thank you for choosing our hotel!
      `
    }
  }

  async sendBookingConfirmation(bookingIdOrData) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized')
      }

      let bookingData, roomData = null

      if (typeof bookingIdOrData === 'string') {
        bookingData = await getDocument(COLLECTIONS.BOOKINGS, bookingIdOrData)
        if (!bookingData) {
          throw new Error('Booking not found')
        }

        try {
          roomData = await getDocument(COLLECTIONS.ROOMS, bookingData.roomId)
        } catch (error) {
        }
      } else {
        bookingData = bookingIdOrData
        
        // Try to fetch room data if roomId is available
        if (bookingData.bookingDetails?.roomId) {
          try {
            roomData = await getDocument(COLLECTIONS.ROOMS, bookingData.bookingDetails.roomId)
          } catch (error) {
          }
        }
      }

      const emailContent = this.generateBookingConfirmationEmail(bookingData, roomData)

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: bookingData.guestInformation.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
      const result = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: bookingData.guestInformation.email
      }
    } catch (error) {
      console.error(' Failed to send booking confirmation email:', error.message)
      throw error
    }
  }

  async testEmailConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized')
      }
      
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error(' Gmail SMTP connection failed:', error.message)
      return false
    }
  }

  generateContactMessageEmail(contactData) {
    const { name, email, message } = contactData
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Message</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background-color: #f5f5f5;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
                background-color: #2c5282; 
                color: white; 
                padding: 30px; 
                text-align: center;
            }
            .header h1 { 
                margin: 0; 
                font-size: 24px;
            }
            .content { 
                padding: 30px;
            }
            .contact-details {
                background-color: #f8f9fa;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: bold;
                color: #4a5568;
                min-width: 100px;
            }
            .detail-value {
                color: #1a1a1a;
                flex: 1;
                margin-left: 20px;
            }
            .message-section {
                background-color: #fff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .message-content {
                color: #1a1a1a;
                line-height: 1.6;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #718096;
                font-size: 14px;
            }
            .timestamp {
                color: #718096;
                font-size: 14px;
                text-align: center;
                margin-top: 20px;
            }
            @media only screen and (max-width: 600px) {
                .container { margin: 0; border-radius: 0; }
                .content { padding: 20px; }
                .header { padding: 20px; }
                .detail-row { flex-direction: column; }
                .detail-value { margin-left: 0; margin-top: 5px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1> New Contact Form Message</h1>
                <p style="margin: 10px 0 0 0;">Hotel Booking System</p>
            </div>
            
            <div class="content">
                <h3 style="color: #1a1a1a; margin-bottom: 15px;">Contact Details</h3>
                <div class="contact-details">
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Received:</span>
                        <span class="detail-value">${timestamp}</span>
                    </div>
                </div>

                <h3 style="color: #1a1a1a; margin-bottom: 15px;">Message</h3>
                <div class="message-section">
                    <div class="message-content">${message}</div>
                </div>

                <div style="background-color: #e6fffa; border-left: 4px solid #48bb78; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #22543d;">Quick Actions</h4>
                    <p style="margin: 0; color: #22543d;">
                        Reply directly to this email to respond to <strong>${name}</strong> at <strong>${email}</strong>
                    </p>
                </div>
            </div>

            <div class="footer">
                <p><strong>Hotel Booking System - Admin Notification</strong></p>
                <p>This message was sent through the contact form on your website.</p>
            </div>
        </div>
    </body>
    </html>
    `

    return {
      subject: `New Contact Form Message from ${name}`,
      html: htmlContent,
      text: `
New Contact Form Message

From: ${name}
Email: ${email}
Received: ${timestamp}

Message:
${message}

---
Reply to this email to respond directly to the sender.
Hotel Booking System - Admin Notification
      `
    }
  }

  async sendContactMessage(contactData) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized')
      }

      const { name, email, message } = contactData

      if (!name || !email || !message) {
        throw new Error('Missing required contact information')
      }

      const adminEmail = process.env.EMAIL_USER || 'nacodezz@gmail.com'

      const emailContent = this.generateContactMessageEmail(contactData)

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: adminEmail,
        replyTo: email, // Allow admin to reply directly to sender
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      }
      const result = await this.transporter.sendMail(mailOptions)
      
      return {
        success: true,
        messageId: result.messageId,
        recipient: adminEmail
      }
    } catch (error) {
      console.error(' Failed to send contact message:', error.message)
      throw error
    }
  }

  // Alias for existing EmailController compatibility
  async verifyConnection() {
    try {
      const isConnected = await this.testEmailConnection()
      return {
        success: isConnected,
        message: isConnected ? 'Gmail SMTP connection verified' : 'Gmail SMTP connection failed',
        error: isConnected ? null : 'Connection test failed'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Gmail SMTP connection failed',
        error: error.message
      }
    }
  }
}

export default new EmailService()