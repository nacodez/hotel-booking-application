import { getFirestoreAdmin, COLLECTIONS } from '../config/firebaseAdmin.js'
import { DatabaseService } from '../services/firestoreService.js'
import fs from 'fs/promises'
import path from 'path'

const firestore = getFirestoreAdmin()

// ===========================================
// BACKUP UTILITIES
// ===========================================

export class BackupService {
  constructor() {
    this.backupPath = process.env.BACKUP_STORAGE_PATH || 'backups/'
    this.maxRetentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupPath)
    } catch {
      await fs.mkdir(this.backupPath, { recursive: true })
    }
  }

  async createFullBackup() {
    try {
      await this.ensureBackupDirectory()
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupDir = path.join(this.backupPath, `full-backup-${timestamp}`)
      
      await fs.mkdir(backupDir, { recursive: true })
      
      const backupResults = {}
      
      for (const [collectionName, collectionPath] of Object.entries(COLLECTIONS)) {
        console.log(`Backing up collection: ${collectionName}`)
        
        try {
          const collectionData = await DatabaseService.backupCollection(collectionPath, 10000)
          const filePath = path.join(backupDir, `${collectionName}.json`)
          
          await fs.writeFile(filePath, JSON.stringify(collectionData, null, 2), 'utf8')
          
          backupResults[collectionName] = {
            success: true,
            documentCount: collectionData.documentCount,
            filePath
          }
        } catch (error) {
          backupResults[collectionName] = {
            success: false,
            error: error.message
          }
        }
      }
      
      // Create backup manifest
      const manifest = {
        type: 'full',
        timestamp: new Date(),
        collections: backupResults,
        version: '1.0.0'
      }
      
      await fs.writeFile(
        path.join(backupDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8'
      )
      
      console.log(`Full backup completed: ${backupDir}`)
      return manifest
      
    } catch (error) {
      console.error('Full backup failed:', error)
      throw error
    }
  }

  async createIncrementalBackup(since) {
    try {
      await this.ensureBackupDirectory()
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupDir = path.join(this.backupPath, `incremental-backup-${timestamp}`)
      
      await fs.mkdir(backupDir, { recursive: true })
      
      const sinceDate = new Date(since)
      const backupResults = {}
      
      for (const [collectionName, collectionPath] of Object.entries(COLLECTIONS)) {
        console.log(`Creating incremental backup for collection: ${collectionName}`)
        
        try {
          // Query documents modified since the specified date
          const querySnapshot = await firestore
            .collection(collectionPath)
            .where('updatedAt', '>=', sinceDate)
            .get()
          
          const documents = []
          querySnapshot.forEach(doc => {
            documents.push({
              id: doc.id,
              ...doc.data(),
              _lastSnapshot: doc.createTime,
              _updateTime: doc.updateTime
            })
          })
          
          const collectionData = {
            collection: collectionPath,
            documentCount: documents.length,
            since: sinceDate,
            data: documents,
            timestamp: new Date()
          }
          
          const filePath = path.join(backupDir, `${collectionName}.json`)
          await fs.writeFile(filePath, JSON.stringify(collectionData, null, 2), 'utf8')
          
          backupResults[collectionName] = {
            success: true,
            documentCount: documents.length,
            filePath
          }
        } catch (error) {
          backupResults[collectionName] = {
            success: false,
            error: error.message
          }
        }
      }
      
      // Create backup manifest
      const manifest = {
        type: 'incremental',
        timestamp: new Date(),
        since: sinceDate,
        collections: backupResults,
        version: '1.0.0'
      }
      
      await fs.writeFile(
        path.join(backupDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8'
      )
      
      console.log(`Incremental backup completed: ${backupDir}`)
      return manifest
      
    } catch (error) {
      console.error('Incremental backup failed:', error)
      throw error
    }
  }

  async restoreFromBackup(backupPath, options = {}) {
    try {
      const manifestPath = path.join(backupPath, 'manifest.json')
      const manifestContent = await fs.readFile(manifestPath, 'utf8')
      const manifest = JSON.parse(manifestContent)
      
      console.log(`Restoring ${manifest.type} backup from ${manifest.timestamp}`)
      
      const restoreResults = {}
      
      for (const [collectionName, collectionInfo] of Object.entries(manifest.collections)) {
        if (!collectionInfo.success) {
          console.log(`Skipping ${collectionName} - backup was not successful`)
          continue
        }
        
        try {
          const dataPath = path.join(backupPath, `${collectionName}.json`)
          const dataContent = await fs.readFile(dataPath, 'utf8')
          const collectionData = JSON.parse(dataContent)
          
          console.log(`Restoring collection: ${collectionName} (${collectionData.documentCount} documents)`)
          
          const batch = firestore.batch()
          let batchCount = 0
          
          for (const document of collectionData.data) {
            const { id, _lastSnapshot, _updateTime, ...docData } = document
            
            const docRef = firestore.collection(COLLECTIONS[collectionName]).doc(id)
            
            if (options.overwrite !== false) {
              batch.set(docRef, docData, { merge: true })
            } else {
              // Only restore if document doesn't exist
              const existingDoc = await docRef.get()
              if (!existingDoc.exists) {
                batch.set(docRef, docData)
              }
            }
            
            batchCount++
            
            // Firestore batch limit is 500 operations
            if (batchCount >= 450) {
              await batch.commit()
              batch = firestore.batch()
              batchCount = 0
            }
          }
          
          if (batchCount > 0) {
            await batch.commit()
          }
          
          restoreResults[collectionName] = {
            success: true,
            documentsRestored: collectionData.documentCount
          }
          
        } catch (error) {
          restoreResults[collectionName] = {
            success: false,
            error: error.message
          }
        }
      }
      
      console.log('Restore completed')
      return restoreResults
      
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  async cleanOldBackups() {
    try {
      const backupDirs = await fs.readdir(this.backupPath)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.maxRetentionDays)
      
      for (const dir of backupDirs) {
        const dirPath = path.join(this.backupPath, dir)
        const stats = await fs.stat(dirPath)
        
        if (stats.isDirectory() && stats.mtime < cutoffDate) {
          console.log(`Removing old backup: ${dir}`)
          await fs.rm(dirPath, { recursive: true, force: true })
        }
      }
      
      console.log('Old backup cleanup completed')
    } catch (error) {
      console.error('Backup cleanup failed:', error)
      throw error
    }
  }

  async listBackups() {
    try {
      await this.ensureBackupDirectory()
      const backupDirs = await fs.readdir(this.backupPath)
      const backups = []
      
      for (const dir of backupDirs) {
        const dirPath = path.join(this.backupPath, dir)
        const manifestPath = path.join(dirPath, 'manifest.json')
        
        try {
          const stats = await fs.stat(dirPath)
          if (stats.isDirectory()) {
            const manifestContent = await fs.readFile(manifestPath, 'utf8')
            const manifest = JSON.parse(manifestContent)
            
            backups.push({
              name: dir,
              path: dirPath,
              type: manifest.type,
              timestamp: manifest.timestamp,
              collections: Object.keys(manifest.collections),
              size: await this.getDirectorySize(dirPath)
            })
          }
        } catch (error) {
          // Skip directories without valid manifests
          continue
        }
      }
      
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } catch (error) {
      console.error('Failed to list backups:', error)
      throw error
    }
  }

  async getDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath)
      let totalSize = 0
      
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = await fs.stat(filePath)
        totalSize += stats.size
      }
      
      return totalSize
    } catch (error) {
      return 0
    }
  }
}

// ===========================================
// MIGRATION UTILITIES
// ===========================================

export class MigrationService {
  constructor() {
    this.migrationsPath = 'migrations/'
  }

  async runMigration(migrationName, direction = 'up') {
    try {
      const migrationPath = path.join(this.migrationsPath, `${migrationName}.js`)
      const migration = await import(migrationPath)
      
      if (direction === 'up' && migration.up) {
        console.log(`Running migration: ${migrationName} (up)`)
        await migration.up(firestore)
      } else if (direction === 'down' && migration.down) {
        console.log(`Running migration: ${migrationName} (down)`)
        await migration.down(firestore)
      } else {
        throw new Error(`Migration ${migrationName} does not support direction: ${direction}`)
      }
      
      // Record migration in database
      await this.recordMigration(migrationName, direction)
      
      console.log(`Migration ${migrationName} completed successfully`)
    } catch (error) {
      console.error(`Migration ${migrationName} failed:`, error)
      throw error
    }
  }

  async recordMigration(migrationName, direction) {
    const migrationRecord = {
      name: migrationName,
      direction,
      timestamp: new Date(),
      version: '1.0.0'
    }
    
    if (direction === 'up') {
      await firestore.collection('_migrations').doc(migrationName).set(migrationRecord)
    } else {
      await firestore.collection('_migrations').doc(migrationName).delete()
    }
  }

  async getPendingMigrations() {
    try {
      const migrationsDir = await fs.readdir(this.migrationsPath)
      const migrationFiles = migrationsDir
        .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''))
        .sort()
      
      const completedMigrations = await firestore.collection('_migrations').get()
      const completedNames = new Set()
      
      completedMigrations.forEach(doc => {
        completedNames.add(doc.id)
      })
      
      return migrationFiles.filter(name => !completedNames.has(name))
    } catch (error) {
      console.error('Failed to get pending migrations:', error)
      return []
    }
  }

  async runPendingMigrations() {
    const pendingMigrations = await this.getPendingMigrations()
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations')
      return
    }
    
    console.log(`Running ${pendingMigrations.length} pending migrations`)
    
    for (const migration of pendingMigrations) {
      await this.runMigration(migration, 'up')
    }
    
    console.log('All pending migrations completed')
  }
}

// ===========================================
// DATA SEEDING UTILITIES
// ===========================================

export class SeedService {
  async seedDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database seeding is not allowed in production')
    }
    
    console.log('Starting database seeding...')
    
    try {
      await this.seedRooms()
      await this.seedUsers()
      console.log('Database seeding completed successfully')
    } catch (error) {
      console.error('Database seeding failed:', error)
      throw error
    }
  }

  async seedRooms() {
    const sampleRooms = [
      {
        title: 'Deluxe Ocean View Suite',
        description: 'Spacious suite with breathtaking ocean views, private balcony, and luxury amenities.',
        price: 299.99,
        capacity: 4,
        roomType: 'deluxe',
        amenities: ['wifi', 'ac', 'tv', 'minibar', 'balcony', 'oceanview'],
        images: [
          {
            url: 'https://example.com/room1.jpg',
            alt: 'Deluxe Ocean View Suite',
            isPrimary: true,
            order: 0
          }
        ],
        location: {
          floor: 10,
          wing: 'east',
          viewType: 'ocean'
        }
      },
      {
        title: 'Standard City Room',
        description: 'Comfortable room with modern amenities and city views.',
        price: 149.99,
        capacity: 2,
        roomType: 'standard',
        amenities: ['wifi', 'ac', 'tv'],
        images: [
          {
            url: 'https://example.com/room2.jpg',
            alt: 'Standard City Room',
            isPrimary: true,
            order: 0
          }
        ],
        location: {
          floor: 5,
          wing: 'west',
          viewType: 'city'
        }
      }
    ]
    
    for (const room of sampleRooms) {
      await firestore.collection(COLLECTIONS.ROOMS).add({
        ...room,
        status: 'available',
        rating: 4.5,
        reviewCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    console.log(`Seeded ${sampleRooms.length} rooms`)
  }

  async seedUsers() {
    const sampleUsers = [
      {
        email: 'admin@hotel.com',
        firstName: 'Hotel',
        lastName: 'Administrator',
        roles: ['admin'],
        status: 'active',
        emailVerified: true
      }
    ]
    
    for (const user of sampleUsers) {
      await firestore.collection(COLLECTIONS.USERS).add({
        ...user,
        preferences: {
          notifications: true,
          newsletter: false,
          language: 'en'
        },
        profile: {},
        loginHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
    
    console.log(`Seeded ${sampleUsers.length} users`)
  }

  async clearDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database clearing is not allowed in production')
    }
    
    console.log('Clearing database...')
    
    for (const [collectionName, collectionPath] of Object.entries(COLLECTIONS)) {
      const snapshot = await firestore.collection(collectionPath).get()
      const batch = firestore.batch()
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      console.log(`Cleared collection: ${collectionName}`)
    }
    
    console.log('Database cleared successfully')
  }
}

export default {
  BackupService,
  MigrationService,
  SeedService
}