import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    
    this.cache.set(key, item);
    logger.debug(`Cache set for key: ${key}`);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    logger.debug(`Cache hit for key: ${key}`);
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired items
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired items`);
    }

    return cleaned;
  }
}

// Global cache instances
export const serviceMetadataCache = new Cache<any>(10 * 60 * 1000); // 10 minutes
export const entityDataCache = new Cache<any>(2 * 60 * 1000); // 2 minutes
export const openaiCache = new Cache<any>(30 * 60 * 1000); // 30 minutes

// Periodic cleanup
setInterval(() => {
  serviceMetadataCache.cleanup();
  entityDataCache.cleanup();
  openaiCache.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes

