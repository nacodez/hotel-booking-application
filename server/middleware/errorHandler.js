export const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  })

  const isDevelopment = process.env.NODE_ENV === 'development'

  let statusCode = err.statusCode || err.status || 500
  let message = err.message || 'Internal server error'
  let errors = null

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation failed'
    errors = Object.values(err.errors || {}).map(e => e.message)
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Unauthorized access'
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid resource ID'
  } else if (err.code === 11000) {
    // Duplicate key error
    statusCode = 400
    message = 'Duplicate resource'
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400
    message = 'Invalid JSON payload'
  } else if (err.code === 'EBADCSRFTOKEN') {
    statusCode = 403
    message = 'Invalid CSRF token'
  } else if (err.type === 'entity.too.large') {
    statusCode = 413
    message = 'Payload too large'
  }

  // Firebase specific errors
  if (err.code?.startsWith('auth/')) {
    statusCode = 400
    switch (err.code) {
      case 'auth/user-not-found':
        message = 'User not found'
        break
      case 'auth/wrong-password':
        message = 'Invalid credentials'
        break
      case 'auth/email-already-in-use':
        message = 'Email already registered'
        break
      case 'auth/weak-password':
        message = 'Password too weak'
        break
      case 'auth/invalid-email':
        message = 'Invalid email format'
        break
      default:
        message = 'Authentication error'
    }
  }

  const errorResponse = {
    success: false,
    message,
    statusCode,
    ...(errors && { errors }),
    ...(isDevelopment && { 
      stack: err.stack,
      details: err.details || null
    })
  }

  res.status(statusCode).json(errorResponse)
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400)
    this.errors = errors
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409)
  }
}