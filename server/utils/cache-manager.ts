import { log } from "../vite";

/**
 * Cache entry with metadata for intelligent cache management
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  source: string;
}

/**
 * Cache configuration options
 */
interface CacheOptions {
  /**
   * Time to live in milliseconds (default: 24 hours)
   */
  ttl?: number;
  
  /**
   * Maximum entries to keep in cache (default: 100)
   */
  maxEntries?: number;
  
  /**
   * If true, entries won't be automatically removed when expired (default: false)
   */
  keepExpired?: boolean;
  
  /**
   * Source identifier for the cache entry (for logging/metrics)
   */
  source?: string;
  
  /**
   * Purge strategy for when cache limit is reached (default: 'lru')
   */
  purgeStrategy?: 'lru' | 'lfu' | 'fifo';
}

/**
 * Enhanced Cache Manager for API responses and data caching
 * with intelligent cache management, metrics tracking, and purging strategies
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number;
  private defaultTtl: number;
  private keepExpired: boolean;
  private defaultPurgeStrategy: 'lru' | 'lfu' | 'fifo';
  private defaultSource: string;
  
  // Statistics for monitoring
  private hits: number = 0;
  private misses: number = 0;
  private staleHits: number = 0;
  private evictions: number = 0;
  
  /**
   * Create a new CacheManager instance
   */
  constructor({
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    maxEntries = 100,
    keepExpired = false,
    purgeStrategy = 'lru',
    source = 'generic'
  }: CacheOptions = {}) {
    this.defaultTtl = ttl;
    this.maxEntries = maxEntries;
    this.keepExpired = keepExpired;
    this.defaultPurgeStrategy = purgeStrategy;
    this.defaultSource = source;
    
    // Start automatic cleanup job to run every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }
  
  /**
   * Set a value in the cache
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    // Apply default options
    const ttl = options.ttl ?? this.defaultTtl;
    const source = options.source ?? this.defaultSource;
    
    // Check if we need to purge entries
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.purge(options.purgeStrategy ?? this.defaultPurgeStrategy);
    }
    
    // Create and store the cache entry
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: now + ttl,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      source
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key The cache key
   * @param includeMetadata If true, returns the full cache entry including metadata
   * @returns The cached value, or undefined if not found or expired
   */
  get<T>(key: string, includeMetadata = false): T | CacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return undefined;
    }
    
    const now = Date.now();
    const isExpired = now > entry.expiresAt;
    
    // Update cache statistics
    entry.lastAccessed = now;
    entry.accessCount++;
    
    // Handle expired entries
    if (isExpired && !this.keepExpired) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }
    
    // Track stale hits vs fresh hits
    if (isExpired) {
      this.staleHits++;
    } else {
      this.hits++;
    }
    
    return includeMetadata ? entry : entry.data;
  }
  
  /**
   * Get or set a value in the cache
   * 
   * @param key The cache key
   * @param fallbackFn Function to generate the value if not in cache
   * @param options Cache options
   * @returns The cached or generated value
   */
  async getOrSet<T>(
    key: string, 
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const value = this.get<T>(key);
    
    // Return if found
    if (value !== undefined) {
      return value;
    }
    
    try {
      // Generate the value
      const newValue = await fallbackFn();
      
      // Cache the result
      this.set(key, newValue, options);
      
      return newValue;
    } catch (error) {
      // Log the error but don't cache it
      log(`Cache fallback error for key ${key}: ${error}`, "cache");
      throw error;
    }
  }
  
  /**
   * Remove an item from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Check if a key exists in the cache (includes expired items)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      staleHits: this.staleHits,
      evictions: this.evictions,
      hitRate: this.calculateHitRate(),
    };
  }
  
  /**
   * Calculate the cache hit rate
   */
  private calculateHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    log("Cache cleared", "cache");
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    let removedCount = 0;
    const now = Date.now();
    
    // Delete expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt && !this.keepExpired) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      log(`Cleaned up ${removedCount} expired cache entries`, "cache");
    }
  }
  
  /**
   * Purge cache entries based on strategy when maxEntries is reached
   */
  private purge(strategy: 'lru' | 'lfu' | 'fifo'): void {
    if (this.cache.size === 0) return;
    
    let keyToPurge: string | null = null;
    
    // Find the entry to purge based on the selected strategy
    switch (strategy) {
      case 'lru': // Least Recently Used
        keyToPurge = this.findLRUKey();
        break;
        
      case 'lfu': // Least Frequently Used
        keyToPurge = this.findLFUKey();
        break;
        
      case 'fifo': // First In First Out
        keyToPurge = this.findFIFOKey();
        break;
    }
    
    // Delete the entry if one was found
    if (keyToPurge) {
      this.cache.delete(keyToPurge);
      this.evictions++;
      log(`Purged cache entry "${keyToPurge}" using strategy "${strategy}"`, "cache");
    }
  }
  
  /**
   * Find the least recently used entry
   */
  private findLRUKey(): string | null {
    let oldestAccess = Infinity;
    let oldestKey: string | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
  
  /**
   * Find the least frequently used entry
   */
  private findLFUKey(): string | null {
    let lowestCount = Infinity;
    let leastUsedKey: string | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lowestCount) {
        lowestCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }
  
  /**
   * Find the oldest entry (First In First Out)
   */
  private findFIFOKey(): string | null {
    let oldestCreation = Infinity;
    let oldestKey: string | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestCreation) {
        oldestCreation = entry.createdAt;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }
}

// Create and export default cache instances for various use cases
export const apiCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxEntries: 50,
  purgeStrategy: 'lru',
  source: 'api'
});

export const longTermCache = new CacheManager({
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxEntries: 100,
  keepExpired: true, // Keep expired entries as fallback
  purgeStrategy: 'lfu',
  source: 'long-term'
});

export const userDataCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxEntries: 200,
  purgeStrategy: 'lru',
  source: 'user-data'
});