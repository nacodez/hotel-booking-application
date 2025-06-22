// Client-side caching service for improved performance

class CacheService {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = new Map()
    this.defaultTTL = parseInt(import.meta.env.VITE_CACHE_TTL) || 300000 // 5 minutes default
    this.enabled = import.meta.env.VITE_CACHE_ENABLED === 'true'
  }

  /**
   * Generate a cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    return `${url}?${paramString}`
  }

  /**
   * Check if cache is enabled
   */
  isEnabled() {
    return this.enabled && typeof window !== 'undefined'
  }

  /**
   * Check if a cache entry is still valid
   */
  isValid(key) {
    if (!this.cacheExpiry.has(key)) {
      return false
    }
    
    const expiry = this.cacheExpiry.get(key)
    const now = Date.now()
    
    if (now > expiry) {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Get data from cache
   */
  get(key) {
    if (!this.isEnabled()) {
      return null
    }

    if (!this.isValid(key)) {
      return null
    }

    const data = this.cache.get(key)
    
    // Update access time for LRU-like behavior
    if (data) {
      this.cache.delete(key)
      this.cache.set(key, data)
    }

    return data
  }

  /**
   * Set data in cache
   */
  set(key, data, ttl = this.defaultTTL) {
    if (!this.isEnabled()) {
      return
    }

    // Implement simple LRU by removing oldest entries when cache is too large
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      this.cacheExpiry.delete(firstKey)
    }

    this.cache.set(key, data)
    this.cacheExpiry.set(key, Date.now() + ttl)
  }

  /**
   * Remove specific entry from cache
   */
  delete(key) {
    this.cache.delete(key)
    this.cacheExpiry.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear()
    this.cacheExpiry.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      enabled: this.enabled,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now()
    const expiredKeys = []

    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key)
      this.cacheExpiry.delete(key)
    })

    return expiredKeys.length
  }
}

// Memory cache for API responses
const memoryCache = new CacheService()

// Session storage cache for user data
class SessionCacheService {
  constructor() {
    this.enabled = typeof window !== 'undefined' && window.sessionStorage
  }

  get(key) {
    if (!this.enabled) return null

    try {
      const item = sessionStorage.getItem(key)
      if (!item) return null

      const { data, expiry } = JSON.parse(item)
      
      if (Date.now() > expiry) {
        sessionStorage.removeItem(key)
        return null
      }

      return data
    } catch (error) {
      console.warn('Session cache get error:', error)
      return null
    }
  }

  set(key, data, ttl = 1800000) { // 30 minutes default
    if (!this.enabled) return

    try {
      const item = {
        data,
        expiry: Date.now() + ttl
      }
      sessionStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.warn('Session cache set error:', error)
    }
  }

  delete(key) {
    if (!this.enabled) return
    sessionStorage.removeItem(key)
  }

  clear() {
    if (!this.enabled) return
    sessionStorage.clear()
  }
}

// Local storage cache for persistent data
class LocalCacheService {
  constructor() {
    this.enabled = typeof window !== 'undefined' && window.localStorage
    this.prefix = 'hotel_booking_'
  }

  get(key) {
    if (!this.enabled) return null

    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null

      const { data, expiry } = JSON.parse(item)
      
      if (Date.now() > expiry) {
        localStorage.removeItem(this.prefix + key)
        return null
      }

      return data
    } catch (error) {
      console.warn('Local cache get error:', error)
      return null
    }
  }

  set(key, data, ttl = 86400000) { // 24 hours default
    if (!this.enabled) return

    try {
      const item = {
        data,
        expiry: Date.now() + ttl
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.warn('Local cache set error:', error)
    }
  }

  delete(key) {
    if (!this.enabled) return
    localStorage.removeItem(this.prefix + key)
  }

  clear() {
    if (!this.enabled) return
    
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  cleanup() {
    if (!this.enabled) return 0

    let cleaned = 0
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const { expiry } = JSON.parse(item)
            if (Date.now() > expiry) {
              localStorage.removeItem(key)
              cleaned++
            }
          }
        } catch (error) {
          localStorage.removeItem(key)
          cleaned++
        }
      }
    })

    return cleaned
  }
}

// Create service instances
const sessionCache = new SessionCacheService()
const localCache = new LocalCacheService()

// Utility functions for cache management
export const cacheManager = {
  getMemory: (key) => memoryCache.get(key),
  setMemory: (key, data, ttl) => memoryCache.set(key, data, ttl),
  deleteMemory: (key) => memoryCache.delete(key),

  getSession: (key) => sessionCache.get(key),
  setSession: (key, data, ttl) => sessionCache.set(key, data, ttl),
  deleteSession: (key) => sessionCache.delete(key),

  getLocal: (key) => localCache.get(key),
  setLocal: (key, data, ttl) => localCache.set(key, data, ttl),
  deleteLocal: (key) => localCache.delete(key),

  clearAll: () => {
    memoryCache.clear()
    sessionCache.clear()
    localCache.clear()
  },

  cleanup: () => {
    const memoryCleaned = memoryCache.cleanup()
    const localCleaned = localCache.cleanup()
    return { memoryCleaned, localCleaned }
  },

  getStats: () => ({
    memory: memoryCache.getStats(),
    sessionEnabled: sessionCache.enabled,
    localEnabled: localCache.enabled
  })
}

export function withCache(fn, cacheType = 'memory', ttl) {
  return async function cachedFunction(...args) {
    const key = JSON.stringify(args)
    
    // Try to get from cache first
    let cachedResult
    switch (cacheType) {
      case 'session':
        cachedResult = cacheManager.getSession(key)
        break
      case 'local':
        cachedResult = cacheManager.getLocal(key)
        break
      default:
        cachedResult = cacheManager.getMemory(key)
    }

    if (cachedResult) {
      return cachedResult
    }

    // If not in cache, execute function and cache result
    try {
      const result = await fn(...args)
      
      if (result && !result.error) {
        switch (cacheType) {
          case 'session':
            cacheManager.setSession(key, result, ttl)
            break
          case 'local':
            cacheManager.setLocal(key, result, ttl)
            break
          default:
            cacheManager.setMemory(key, result, ttl)
        }
      }

      return result
    } catch (error) {
      throw error
    }
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    cacheManager.cleanup()
  }, 1000)

  // Periodic cleanup every 5 minutes
  setInterval(() => {
    cacheManager.cleanup()
  }, 300000)
}

export { memoryCache, sessionCache, localCache }
export default cacheManager