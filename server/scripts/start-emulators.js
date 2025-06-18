#!/usr/bin/env node

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
  return new Promise((resolve) => {
    const firebase = spawn('firebase', ['--version'], { stdio: 'ignore' })
    firebase.on('close', (code) => {
      resolve(code === 0)
    })
    firebase.on('error', () => {
      resolve(false)
    })
  })
}

// Install Firebase CLI if not present
async function installFirebaseCLI() {
  console.log('Installing Firebase CLI...')
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install', '-g', 'firebase-tools'], { 
      stdio: 'inherit',
      cwd: projectRoot 
    })
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('Firebase CLI installed successfully')
        resolve()
      } else {
        reject(new Error('Failed to install Firebase CLI'))
      }
    })
    
    npm.on('error', (error) => {
      reject(error)
    })
  })
}

// Start Firebase emulators
function startEmulators() {
  console.log('Starting Firebase emulators...')
  
  const emulators = spawn('firebase', ['emulators:start'], {
    stdio: 'inherit',
    cwd: projectRoot
  })
  
  emulators.on('close', (code) => {
    console.log(`Firebase emulators stopped with code ${code}`)
  })
  
  emulators.on('error', (error) => {
    console.error('Failed to start Firebase emulators:', error)
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('Stopping Firebase emulators...')
    emulators.kill('SIGINT')
  })
  
  process.on('SIGTERM', () => {
    console.log('Stopping Firebase emulators...')
    emulators.kill('SIGTERM')
  })
}

// Check if Firebase project is configured
function checkFirebaseConfig() {
  const firebaserc = join(projectRoot, '.firebaserc')
  const firebaseJson = join(projectRoot, 'firebase.json')
  
  if (!fs.existsSync(firebaserc)) {
    console.error('Error: .firebaserc not found. Please configure your Firebase project.')
    console.log('Run: firebase use --add')
    process.exit(1)
  }
  
  if (!fs.existsSync(firebaseJson)) {
    console.error('Error: firebase.json not found.')
    process.exit(1)
  }
  
  return true
}

// Main function
async function main() {
  try {
    console.log('🔥 Hotel Booking System - Firebase Emulator Setup')
    console.log('================================================')
    
    // Check if Firebase CLI is installed
    const hasFirebaseCLI = await checkFirebaseCLI()
    
    if (!hasFirebaseCLI) {
      await installFirebaseCLI()
    }
    
    // Check Firebase configuration
    checkFirebaseConfig()
    
    // Start emulators
    console.log('\\n📡 Starting Firebase Emulators...')
    console.log('Auth Emulator: http://localhost:9099')
    console.log('Firestore Emulator: http://localhost:8080')
    console.log('Emulator UI: http://localhost:4000')
    console.log('\\nPress Ctrl+C to stop the emulators\\n')
    
    startEmulators()
    
  } catch (error) {
    console.error('Error starting Firebase emulators:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default {
  checkFirebaseCLI,
  installFirebaseCLI,
  startEmulators,
  checkFirebaseConfig,
  main
}