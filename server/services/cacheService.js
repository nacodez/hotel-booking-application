// Simple in-memory cache service for room data and availability
class CacheService {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })

    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)
    
    this.timers.set(key, timer)
    
  }

  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    return entry.value
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    
    const deleted = this.cache.delete(key)
    if (deleted) {
    }
    return deleted
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.getMemoryUsage()
    }
  }

  getMemoryUsage() {
    let size = 0
    this.cache.forEach((value, key) => {
      size += key.length * 2 // approximate string size
      size += JSON.stringify(value.value).length * 2 // approximate object size
    })
    return size
  }

  getRoomAvailabilityKey(roomIds, checkInDate, checkOutDate) {
    const sortedIds = Array.isArray(roomIds) ? roomIds.sort().join(',') : roomIds
    return `availability:${sortedIds}:${checkInDate}:${checkOutDate}`
  }

  getRoomDataKey(page, limit, hasSearchCriteria = false) {
    return `rooms:${hasSearchCriteria ? 'search' : 'browse'}:${page}:${limit}`
  }

  getTotalCountKey(hasSearchCriteria = false) {
    return `count:${hasSearchCriteria ? 'search' : 'browse'}`
  }

  getSearchResultsKey(criteria, page, limit) {
    const criteriaStr = JSON.stringify({
      destinationCity: criteria.destinationCity,
      checkInDate: criteria.checkInDate,
      checkOutDate: criteria.checkOutDate,
      guestCount: criteria.guestCount,
      roomCount: criteria.roomCount
    })
    return `search:${Buffer.from(criteriaStr).toString('base64')}:${page}:${limit}`
  }

  cacheAvailability(roomIds, checkInDate, checkOutDate, results) {
    const key = this.getRoomAvailabilityKey(roomIds, checkInDate, checkOutDate)
    this.set(key, results, 2 * 60 * 1000)
  }

  getCachedAvailability(roomIds, checkInDate, checkOutDate) {
    const key = this.getRoomAvailabilityKey(roomIds, checkInDate, checkOutDate)
    return this.get(key)
  }

  cacheRoomData(page, limit, data, pagination, hasSearchCriteria = false) {
    const key = this.getRoomDataKey(page, limit, hasSearchCriteria)
    this.set(key, { data, pagination }, 3 * 60 * 1000) // 3 minutes for room data
  }

  getCachedRoomData(page, limit, hasSearchCriteria = false) {
    const key = this.getRoomDataKey(page, limit, hasSearchCriteria)
    return this.get(key)
  }

  cacheSearchResults(criteria, page, limit, data, pagination) {
    const key = this.getSearchResultsKey(criteria, page, limit)
    this.set(key, { data, pagination }, 1 * 60 * 1000)
  }

  getCachedSearchResults(criteria, page, limit) {
    const key = this.getSearchResultsKey(criteria, page, limit)
    return this.get(key)
  }

  cacheTotalCount(count, hasSearchCriteria = false) {
    const key = this.getTotalCountKey(hasSearchCriteria)
    this.set(key, count, 5 * 60 * 1000) // 5 minutes for total count
  }

  getCachedTotalCount(hasSearchCriteria = false) {
    const key = this.getTotalCountKey(hasSearchCriteria)
    return this.get(key)
  }

  // Invalidate cache when rooms are modified
  invalidateRoomCaches() {
    const keysToDelete = []
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('rooms:') || key.startsWith('count:') || 
          key.startsWith('search:') || key.startsWith('availability:')) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.delete(key))
  }

  // Invalidate specific availability cache when bookings change
  invalidateAvailabilityCache(roomId) {
    const keysToDelete = []
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('availability:') && key.includes(roomId)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.delete(key))
  }
}

const cacheService = new CacheService()

export default cacheService