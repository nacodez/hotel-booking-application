import { getAuthAdmin } from '../config/firebaseAdmin.js'
import { UserService } from './firestoreService.js'
import { AuthenticationError, ConflictError } from '../middleware/errorHandler.js'

const auth = getAuthAdmin()

export class FirebaseAuthService {
  // Create a Firebase user
  static async createFirebaseUser(userData) {
    try {
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`,
        emailVerified: false,
        disabled: false
      })

      // Create corresponding Firestore document
      await UserService.createUser({
        ...userData,
        uid: userRecord.uid,
        provider: 'firebase'
      })

      return userRecord
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictError('Email already exists')
      }
      throw new AuthenticationError(`Failed to create user: ${error.message}`)
    }
  }

  // Get Firebase user by UID
  static async getFirebaseUser(uid) {
    try {
      const userRecord = await auth.getUser(uid)
      return userRecord
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        throw new AuthenticationError('User not found')
      }
      throw new AuthenticationError(`Failed to get user: ${error.message}`)
    }
  }

  // Get Firebase user by email
  static async getFirebaseUserByEmail(email) {
    try {
      const userRecord = await auth.getUserByEmail(email)
      return userRecord
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null
      }
      throw new AuthenticationError(`Failed to get user: ${error.message}`)
    }
  }

  // Update Firebase user
  static async updateFirebaseUser(uid, updates) {
    try {
      const userRecord = await auth.updateUser(uid, updates)
      return userRecord
    } catch (error) {
      throw new AuthenticationError(`Failed to update user: ${error.message}`)
    }
  }

  // Delete Firebase user
  static async deleteFirebaseUser(uid) {
    try {
      await auth.deleteUser(uid)
      return true
    } catch (error) {
      throw new AuthenticationError(`Failed to delete user: ${error.message}`)
    }
  }

  // Verify ID token
  static async verifyIdToken(idToken, checkRevoked = false) {
    try {
      const decodedToken = await auth.verifyIdToken(idToken, checkRevoked)
      return decodedToken
    } catch (error) {
      if (error.code === 'auth/id-token-expired') {
        throw new AuthenticationError('Token expired')
      } else if (error.code === 'auth/id-token-revoked') {
        throw new AuthenticationError('Token revoked')
      } else if (error.code === 'auth/invalid-id-token') {
        throw new AuthenticationError('Invalid token')
      }
      throw new AuthenticationError('Authentication failed')
    }
  }

  // Generate custom token
  static async createCustomToken(uid, additionalClaims = {}) {
    try {
      const customToken = await auth.createCustomToken(uid, additionalClaims)
      return customToken
    } catch (error) {
      throw new AuthenticationError(`Failed to create custom token: ${error.message}`)
    }
  }

  // Set custom user claims (for role-based access)
  static async setCustomUserClaims(uid, customClaims) {
    try {
      await auth.setCustomUserClaims(uid, customClaims)
      return true
    } catch (error) {
      throw new AuthenticationError(`Failed to set custom claims: ${error.message}`)
    }
  }

  // Revoke refresh tokens
  static async revokeRefreshTokens(uid) {
    try {
      await auth.revokeRefreshTokens(uid)
      return true
    } catch (error) {
      throw new AuthenticationError(`Failed to revoke tokens: ${error.message}`)
    }
  }

  // Generate password reset link
  static async generatePasswordResetLink(email, actionCodeSettings = {}) {
    try {
      const link = await auth.generatePasswordResetLink(email, actionCodeSettings)
      return link
    } catch (error) {
      throw new AuthenticationError(`Failed to generate reset link: ${error.message}`)
    }
  }

  // Generate email verification link
  static async generateEmailVerificationLink(email, actionCodeSettings = {}) {
    try {
      const link = await auth.generateEmailVerificationLink(email, actionCodeSettings)
      return link
    } catch (error) {
      throw new AuthenticationError(`Failed to generate verification link: ${error.message}`)
    }
  }

  // List users with pagination
  static async listUsers(maxResults = 1000, pageToken = undefined) {
    try {
      const listUsersResult = await auth.listUsers(maxResults, pageToken)
      return {
        users: listUsersResult.users,
        pageToken: listUsersResult.pageToken
      }
    } catch (error) {
      throw new AuthenticationError(`Failed to list users: ${error.message}`)
    }
  }

  // Import users (bulk operation)
  static async importUsers(users, options = {}) {
    try {
      const result = await auth.importUsers(users, options)
      return result
    } catch (error) {
      throw new AuthenticationError(`Failed to import users: ${error.message}`)
    }
  }

  // Create session cookie
  static async createSessionCookie(idToken, expiresIn) {
    try {
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })
      return sessionCookie
    } catch (error) {
      throw new AuthenticationError(`Failed to create session cookie: ${error.message}`)
    }
  }

  // Verify session cookie
  static async verifySessionCookie(sessionCookie, checkRevoked = false) {
    try {
      const decodedClaims = await auth.verifySessionCookie(sessionCookie, checkRevoked)
      return decodedClaims
    } catch (error) {
      throw new AuthenticationError('Invalid session')
    }
  }

  // Disable user account
  static async disableUser(uid) {
    try {
      await auth.updateUser(uid, { disabled: true })
      
      // Update Firestore user status
      await UserService.updateUserStatus(uid, 'suspended')
      
      return true
    } catch (error) {
      throw new AuthenticationError(`Failed to disable user: ${error.message}`)
    }
  }

  // Enable user account
  static async enableUser(uid) {
    try {
      await auth.updateUser(uid, { disabled: false })
      
      // Update Firestore user status
      await UserService.updateUserStatus(uid, 'active')
      
      return true
    } catch (error) {
      throw new AuthenticationError(`Failed to enable user: ${error.message}`)
    }
  }

  // Get user activity data
  static async getUserActivity(uid) {
    try {
      const userRecord = await auth.getUser(uid)
      const userData = await UserService.getUserById(uid)
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        metadata: {
          creationTime: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          lastRefreshTime: userRecord.metadata.lastRefreshTime
        },
        customClaims: userRecord.customClaims,
        firestoreData: userData
      }
    } catch (error) {
      throw new AuthenticationError(`Failed to get user activity: ${error.message}`)
    }
  }
}

// Enhanced authentication service with additional features
export class AuthenticationService {
  // Comprehensive user registration
  static async registerUser(userData) {
    const { email, password, firstName, lastName, phoneNumber } = userData

    // Check if user already exists in Firestore
    const existingUser = await UserService.getUserByEmail(email)
    if (existingUser) {
      throw new ConflictError('User already exists')
    }

    // Create Firebase user
    const firebaseUser = await FirebaseAuthService.createFirebaseUser({
      email,
      password,
      firstName,
      lastName,
      phoneNumber
    })

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      emailVerified: firebaseUser.emailVerified
    }
  }

  // Enhanced login with activity tracking
  static async loginUser(idToken) {
    // Verify the ID token
    const decodedToken = await FirebaseAuthService.verifyIdToken(idToken)
    
    // Get or create user in Firestore
    let userData = await UserService.getUserById(decodedToken.uid).catch(() => null)
    
    if (!userData) {
      // Create user document for existing Firebase users
      const firebaseUser = await FirebaseAuthService.getFirebaseUser(decodedToken.uid)
      
      userData = await UserService.createUser({
        uid: decodedToken.uid,
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
        emailVerified: decodedToken.email_verified,
        phoneNumber: decodedToken.phone_number,
        photoURL: decodedToken.picture,
        provider: 'firebase'
      })
    }

    // Update last login time
    await UserService.updateUser(decodedToken.uid, {
      lastLoginAt: new Date()
    })

    return {
      user: userData,
      token: decodedToken
    }
  }

  // Logout with token revocation
  static async logoutUser(uid) {
    try {
      // Revoke all refresh tokens
      await FirebaseAuthService.revokeRefreshTokens(uid)
      
      // Update last logout time
      await UserService.updateUser(uid, {
        lastLogoutAt: new Date()
      })

      return true
    } catch (error) {
      throw new AuthenticationError(`Logout failed: ${error.message}`)
    }
  }

  // Password reset flow
  static async initiatePasswordReset(email) {
    const user = await UserService.getUserByEmail(email)
    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: 'If the email exists, a reset link has been sent' }
    }

    const resetLink = await FirebaseAuthService.generatePasswordResetLink(email, {
      url: `${process.env.CLIENT_URL}/auth/reset-password`,
      handleCodeInApp: false
    })

    return {
      success: true,
      resetLink,
      message: 'Password reset link generated'
    }
  }

  // Email verification flow
  static async sendEmailVerification(uid) {
    const firebaseUser = await FirebaseAuthService.getFirebaseUser(uid)
    
    if (firebaseUser.emailVerified) {
      throw new ValidationError('Email is already verified')
    }

    const verificationLink = await FirebaseAuthService.generateEmailVerificationLink(
      firebaseUser.email,
      {
        url: `${process.env.CLIENT_URL}/auth/verify-email`,
        handleCodeInApp: false
      }
    )

    return {
      success: true,
      verificationLink,
      message: 'Email verification link generated'
    }
  }

  // Change user password
  static async changePassword(uid, newPassword) {
    await FirebaseAuthService.updateFirebaseUser(uid, {
      password: newPassword
    })

    // Revoke all existing tokens to force re-authentication
    await FirebaseAuthService.revokeRefreshTokens(uid)

    return { success: true, message: 'Password changed successfully' }
  }

  // Update user profile
  static async updateProfile(uid, updates) {
    const { email, displayName, phoneNumber, photoURL, ...firestoreUpdates } = updates

    // Update Firebase Auth user
    const firebaseUpdates = {}
    if (email) firebaseUpdates.email = email
    if (displayName) firebaseUpdates.displayName = displayName
    if (phoneNumber) firebaseUpdates.phoneNumber = phoneNumber
    if (photoURL) firebaseUpdates.photoURL = photoURL

    if (Object.keys(firebaseUpdates).length > 0) {
      await FirebaseAuthService.updateFirebaseUser(uid, firebaseUpdates)
    }

    // Update Firestore user document
    if (Object.keys(firestoreUpdates).length > 0) {
      await UserService.updateUser(uid, firestoreUpdates)
    }

    return { success: true, message: 'Profile updated successfully' }
  }

  // Delete user account
  static async deleteAccount(uid) {
    // Cancel active bookings
    const activeBookings = await BookingService.getUserBookings(uid, {
      status: ['confirmed', 'pending']
    })

    for (const booking of activeBookings) {
      await BookingService.cancelBooking(booking.id, 'Account deleted')
    }

    // Soft delete in Firestore
    await UserService.deleteUser(uid)

    // Delete Firebase Auth user
    await FirebaseAuthService.deleteFirebaseUser(uid)

    return { success: true, message: 'Account deleted successfully' }
  }

  // Admin functions
  static async setUserRole(uid, roles) {
    // Update custom claims
    await FirebaseAuthService.setCustomUserClaims(uid, { roles })
    
    // Update Firestore document
    await UserService.updateUser(uid, { roles })

    return { success: true, message: 'User roles updated' }
  }

  static async suspendUser(uid, reason = '') {
    await FirebaseAuthService.disableUser(uid)
    
    await UserService.updateUser(uid, {
      suspensionReason: reason,
      suspendedAt: new Date()
    })

    return { success: true, message: 'User suspended' }
  }

  static async unsuspendUser(uid) {
    await FirebaseAuthService.enableUser(uid)
    
    await UserService.updateUser(uid, {
      suspensionReason: null,
      suspendedAt: null,
      reactivatedAt: new Date()
    })

    return { success: true, message: 'User reactivated' }
  }
}

export default {
  FirebaseAuthService,
  AuthenticationService
}