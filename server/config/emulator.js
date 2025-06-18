// Firebase Emulator Configuration for Development
import { getApps, initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

// Firebase configuration for client-side emulator connection
const firebaseConfig = {
  apiKey: process.env.FIREBASE_WEB_API_KEY || 'demo-key',
  authDomain: process.env.FIREBASE_WEB_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.FIREBASE_WEB_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.FIREBASE_WEB_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_WEB_APP_ID || 'demo-app-id'
}

// Emulator configuration
const EMULATOR_CONFIG = {
  auth: {
    host: 'localhost',
    port: 9099
  },
  firestore: {
    host: 'localhost',
    port: 8080
  },
  functions: {
    host: 'localhost',
    port: 5001
  },
  ui: {
    host: 'localhost',
    port: 4000
  }
}

let app
let auth
let firestore
let functions

// Initialize Firebase app for emulator use
export function initializeFirebaseEmulator() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }

  // Initialize services
  auth = getAuth(app)
  firestore = getFirestore(app)
  functions = getFunctions(app)

  // Connect to emulators if in development mode
  if (process.env.NODE_ENV === 'development' || process.env.USE_EMULATOR === 'true') {
    connectToEmulators()
  }

  return { app, auth, firestore, functions }
}

// Connect to Firebase emulators
function connectToEmulators() {
  try {
    // Connect Auth emulator
    if (!auth._delegate._config.emulator) {
      connectAuthEmulator(auth, `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`, {
        disableWarnings: true
      })
      console.log('🔥 Connected to Auth Emulator')
    }

    // Connect Firestore emulator
    if (!firestore._delegate._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(firestore, EMULATOR_CONFIG.firestore.host, EMULATOR_CONFIG.firestore.port)
      console.log('🔥 Connected to Firestore Emulator')
    }

    // Connect Functions emulator
    if (!functions._delegate._config?.emulator) {
      connectFunctionsEmulator(functions, EMULATOR_CONFIG.functions.host, EMULATOR_CONFIG.functions.port)
      console.log('🔥 Connected to Functions Emulator')
    }

    console.log('🚀 Firebase Emulators ready!')
    console.log(`📊 Emulator UI: http://${EMULATOR_CONFIG.ui.host}:${EMULATOR_CONFIG.ui.port}`)

  } catch (error) {
    console.warn('⚠️ Could not connect to Firebase emulators:', error.message)
    console.log('Make sure emulators are running: npm run emulators:start')
  }
}

// Utility function to check if running in emulator mode
export function isEmulatorMode() {
  return process.env.NODE_ENV === 'development' || process.env.USE_EMULATOR === 'true'
}

// Get emulator endpoints for testing
export function getEmulatorEndpoints() {
  if (!isEmulatorMode()) {
    return null
  }

  return {
    auth: `http://${EMULATOR_CONFIG.auth.host}:${EMULATOR_CONFIG.auth.port}`,
    firestore: `http://${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}`,
    functions: `http://${EMULATOR_CONFIG.functions.host}:${EMULATOR_CONFIG.functions.port}`,
    ui: `http://${EMULATOR_CONFIG.ui.host}:${EMULATOR_CONFIG.ui.port}`
  }
}

// Helper function to seed emulator data
export async function seedEmulatorData() {
  if (!isEmulatorMode()) {
    console.warn('Cannot seed data - not in emulator mode')
    return
  }

  try {
    const { SeedService } = await import('../utils/backup.js')
    const seedService = new SeedService()
    
    console.log('🌱 Seeding emulator database...')
    await seedService.seedDatabase()
    console.log('✅ Emulator data seeded successfully')
    
  } catch (error) {
    console.error('❌ Failed to seed emulator data:', error)
  }
}

// Helper function to clear emulator data
export async function clearEmulatorData() {
  if (!isEmulatorMode()) {
    console.warn('Cannot clear data - not in emulator mode')
    return
  }

  try {
    const { SeedService } = await import('../utils/backup.js')
    const seedService = new SeedService()
    
    console.log('🧹 Clearing emulator database...')
    await seedService.clearDatabase()
    console.log('✅ Emulator data cleared successfully')
    
  } catch (error) {
    console.error('❌ Failed to clear emulator data:', error)
  }
}

// Test function to verify emulator connection
export async function testEmulatorConnection() {
  if (!isEmulatorMode()) {
    console.log('Not in emulator mode')
    return false
  }

  try {
    const { firestore } = initializeFirebaseEmulator()
    
    // Test Firestore connection
    const testDoc = await firestore.collection('_test').add({
      message: 'Hello from emulator!',
      timestamp: new Date()
    })
    
    await testDoc.delete()
    
    console.log('✅ Emulator connection test passed')
    return true
    
  } catch (error) {
    console.error('❌ Emulator connection test failed:', error)
    return false
  }
}

// Export emulator utilities
export default {
  initializeFirebaseEmulator,
  connectToEmulators,
  isEmulatorMode,
  getEmulatorEndpoints,
  seedEmulatorData,
  clearEmulatorData,
  testEmulatorConnection,
  EMULATOR_CONFIG
}