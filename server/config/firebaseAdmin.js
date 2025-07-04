import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

let db = null
let firebaseAdminInitialized = false

export const initializeFirebaseAdmin = () => {
  if (firebaseAdminInitialized) {
    return admin
  }

  const isDemoMode = process.env.FIREBASE_PROJECT_ID === 'demo-project' || 
                     process.env.USE_EMULATOR === 'true'

  try {
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized')
      db = admin.firestore()
      firebaseAdminInitialized = true
      return admin
    }

    if (isDemoMode) {
      console.log('Initializing Firebase Admin in emulator mode')
      
      admin.initializeApp({
        projectId: 'demo-project',
        databaseURL: 'https://demo-project-default-rtdb.firebaseio.com'
      })

      db = admin.firestore()
      
      if (process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV === 'development') {
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
          process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
        }
        console.log(' Using Firestore emulator at:', process.env.FIRESTORE_EMULATOR_HOST)
      }

      firebaseAdminInitialized = true
      console.log(' Firebase Admin initialized in emulator mode')
      
    } else {
      console.log(' Initializing Firebase Admin in production mode...')
      
      // Prevent Firebase from looking for default credentials
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS
      delete process.env.GCLOUD_PROJECT
      
      const requiredFields = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']
      for (const field of requiredFields) {
        if (!process.env[field]) {
          throw new Error(`Missing required Firebase credential: ${field}`)
        }
      }

      console.log(' Firebase credentials check:', {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n') || false
      })
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY
      if (privateKey) {
        console.log(' Raw private key preview:', privateKey.substring(0, 100) + '...')
        
        // Replace literal \n with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n')
        
        // Try to parse as JSON first (in case it's encoded as JSON string)
        try {
          if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = JSON.parse(privateKey)
            privateKey = privateKey.replace(/\\n/g, '\n')
          }
        } catch (e) {
          // Not JSON, continue with original
        }
        
        // If it doesn't start with BEGIN, it might be base64 encoded
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          console.log(' Private key appears to be base64 encoded, attempting to decode...')
          try {
            privateKey = Buffer.from(privateKey, 'base64').toString('utf8')
          } catch (e) {
            console.log(' Base64 decode failed, treating as raw string')
          }
        }
        
        // Ensure proper PEM format
        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
          console.error(' Private key format error. Key should start with -----BEGIN PRIVATE KEY-----')
          console.error(' Actual start:', privateKey.substring(0, 50))
          throw new Error('Invalid private key format - must start with -----BEGIN PRIVATE KEY-----')
        }
        
        if (!privateKey.endsWith('-----END PRIVATE KEY-----\n')) {
          if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
            privateKey += '\n-----END PRIVATE KEY-----'
          }
          privateKey += '\n'
        }
        
        console.log(' Private key format validated successfully')
      }

      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      }

      console.log(' Service account config:', {
        project_id: serviceAccount.project_id,
        client_email: serviceAccount.client_email,
        private_key_preview: serviceAccount.private_key?.substring(0, 50) + '...',
        private_key_valid: serviceAccount.private_key?.includes('-----BEGIN PRIVATE KEY-----') && serviceAccount.private_key?.includes('-----END PRIVATE KEY-----')
      })

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      })

      db = admin.firestore()
      
      // Configure Firestore settings for production
      const settings = {
        timestampsInSnapshots: true,
        ignoreUndefinedProperties: true
      }
      
      if (process.env.NODE_ENV === 'production') {
        settings.ssl = true
        settings.preferRest = true // Use REST API instead of gRPC in production
      }
      
      db.settings(settings)

      firebaseAdminInitialized = true
      console.log(' Firebase Admin initialized in production mode')
    }

  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    
    if (!isDemoMode) {
      console.log('Falling back to emulator mode...')
      try {
        admin.initializeApp({
          projectId: 'demo-project',
          databaseURL: 'https://demo-project-default-rtdb.firebaseio.com'
        })
        
        db = admin.firestore()
        process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
        console.log(' Using Firestore emulator at:', process.env.FIRESTORE_EMULATOR_HOST)
        
        firebaseAdminInitialized = true
        console.log(' Firebase Admin initialized in emulator fallback mode')
        return admin
      } catch (fallbackError) {
        console.error('Fallback to emulator also failed:', fallbackError)
      }
    }
    
    throw new Error('Failed to initialize Firebase Admin SDK')
  }

  return admin
}

export const getFirestoreAdmin = () => {
  if (!firebaseAdminInitialized) {
    initializeFirebaseAdmin()
  }
  if (!db) {
    db = admin.firestore()
  }
  return db
}

export const getAuthAdmin = () => {
  if (!firebaseAdminInitialized) {
    initializeFirebaseAdmin()
  }
  return admin.auth()
}

export const COLLECTIONS = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  ROOMS: 'rooms',
  ROOM_TYPES: 'roomTypes',
  HOTELS: 'hotels',
  HOTEL_APPLICATIONS: 'hotel_applications'
}

export const createDocument = async (collection, data) => {
  try {
    const firestore = getFirestoreAdmin()
    const docRef = await firestore.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error(`Error creating document in ${collection}:`, error)
    throw error
  }
}

export const updateDocument = async (collection, docId, data) => {
  try {
    const firestore = getFirestoreAdmin()
    await firestore.collection(collection).doc(docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return true
  } catch (error) {
    console.error(`Error updating document in ${collection}:`, error)
    throw error
  }
}

export const getDocument = async (collection, docId) => {
  try {
    const firestore = getFirestoreAdmin()
    const doc = await firestore.collection(collection).doc(docId).get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error(`Error getting document from ${collection}:`, error)
    throw error
  }
}

export const queryDocuments = async (collection, filters = [], orderBy = null, limit = null) => {
  try {
    const firestore = getFirestoreAdmin()
    let query = firestore.collection(collection)

    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value)
    })

    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc')
    }

    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Error querying documents from ${collection}:`, error)
    throw error
  }
}

export const deleteDocument = async (collection, docId) => {
  try {
    const firestore = getFirestoreAdmin()
    await firestore.collection(collection).doc(docId).delete()
    return true
  } catch (error) {
    console.error(`Error deleting document from ${collection}:`, error)
    throw error
  }
}