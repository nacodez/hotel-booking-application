import jwt from 'jsonwebtoken'
import { getAuthAdmin, getDocument, COLLECTIONS } from '../config/firebaseAdmin.js'
import { AuthenticationError, AuthorizationError } from './errorHandler.js'

export const verifyJWTToken = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware called')
    const authHeader = req.headers.authorization
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header')
      throw new AuthenticationError('No authorization token provided')
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('🔐 Token extracted:', token ? 'Yes' : 'No')
    
    try {
      // Verify JWT token
      console.log('🔐 Verifying JWT token...')
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log('🔐 JWT decoded:', JSON.stringify(decoded, null, 2))
      
      // Get user data from Firestore
      console.log('🔐 Getting user data for userId:', decoded.userId)
      const userData = await getDocument(COLLECTIONS.USERS, decoded.userId)
      if (!userData) {
        console.log('❌ User not found in Firestore')
        throw new AuthenticationError('User not found')
      }
      console.log('✅ User found in Firestore')

      // Check if user account is active
      if (userData.status === 'deactivated') {
        throw new AuthorizationError('Account deactivated')
      }

      req.user = {
        ...decoded,
        userData
      }
      console.log('✅ req.user set:', JSON.stringify(req.user, null, 2))
      
      next()
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired')
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token')
      } else {
        throw jwtError
      }
    }
  } catch (error) {
    next(error)
  }
}

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No authorization token provided')
    }

    const idToken = authHeader.split('Bearer ')[1]
    const authAdmin = getAuthAdmin()
    
    const decodedToken = await authAdmin.verifyIdToken(idToken, true)
    
    // Get additional user data from Firestore
    const userData = await getDocument(COLLECTIONS.USERS, decodedToken.uid)
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      ...decodedToken,
      userData
    }
    
    next()
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      next(new AuthenticationError('Token expired'))
    } else if (error.code === 'auth/id-token-revoked') {
      next(new AuthenticationError('Token revoked'))
    } else if (error.code === 'auth/invalid-id-token') {
      next(new AuthenticationError('Invalid token'))
    } else {
      next(new AuthenticationError('Authentication failed'))
    }
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1]
      
      // Try JWT first, then Firebase
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userData = await getDocument(COLLECTIONS.USERS, decoded.userId)
        
        if (userData && userData.status !== 'deactivated') {
          req.user = {
            ...decoded,
            userData
          }
        }
      } catch (jwtError) {
        // Try Firebase token
        try {
          const authAdmin = getAuthAdmin()
          const decodedToken = await authAdmin.verifyIdToken(token)
          const userData = await getDocument(COLLECTIONS.USERS, decodedToken.uid)
          
          req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            ...decodedToken,
            userData
          }
        } catch (firebaseError) {
          // Ignore errors for optional auth
        }
      }
    }
    
    next()
  } catch (error) {
    // Ignore errors for optional auth
    next()
  }
}

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required')
  }
  next()
}

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required')
    }

    const userRoles = req.user.userData?.roles || ['user']
    const hasRole = roles.some(role => userRoles.includes(role))

    if (!hasRole) {
      throw new AuthorizationError('Insufficient permissions')
    }

    next()
  }
}

export const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required')
  }

  if (!req.user.emailVerified) {
    throw new AuthorizationError('Email verification required')
  }

  next()
}

// Rate limiting per user
export const rateLimitPerUser = (maxRequests, windowMs) => {
  const userRequests = new Map()

  return (req, res, next) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.uid || req.user.userId
    const now = Date.now()
    const windowStart = now - windowMs

    if (!userRequests.has(userId)) {
      userRequests.set(userId, [])
    }

    const requests = userRequests.get(userId)
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    if (validRequests.length >= maxRequests) {
      throw new AuthorizationError('Rate limit exceeded')
    }

    validRequests.push(now)
    userRequests.set(userId, validRequests)

    next()
  }
}