// src/utils/requestDeduplication.js
// Request deduplication manager to prevent duplicate API calls

class RequestDeduplicationManager {
  constructor() {
    this.cache = new Map();
    this.ttl = 1000; // 1 second TTL for deduplication
  }

  /**
   * Generate a cache key from request parameters
   */
  generateKey(endpoint, params) {
    // Sort keys for consistent serialization
    const sortedParams = params
      ? JSON.stringify(params, Object.keys(params).sort())
      : '';
    return `${endpoint}:${sortedParams}`;
  }

  /**
   * Get an in-flight request if it exists and hasn't expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      // Expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.promise;
  }

  /**
   * Store an in-flight request
   */
  set(key, promise) {
    this.cache.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Auto-cleanup after promise resolves or rejects
    promise
      .finally(() => {
        // Wait a bit before clearing to allow other callers to get the result
        setTimeout(() => {
          this.cache.delete(key);
        }, 100);
      });
  }

  /**
   * Clear a specific entry
   */
  clear(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const deduplicationManager = new RequestDeduplicationManager();

/**
 * Wrap an async function with deduplication
 * Multiple simultaneous calls with the same parameters will share the same promise
 */
export function withDeduplication(fn, endpoint) {
  return async function deduplicated(...args) {
    // Generate cache key from arguments
    const key = deduplicationManager.generateKey(endpoint, args[0]);

    // Check if there's an in-flight request
    const existingPromise = deduplicationManager.get(key);
    if (existingPromise) {
      console.log(`[Dedup] Reusing in-flight request for ${endpoint}`, args[0]);
      return existingPromise;
    }

    // Create new request
    const promise = fn(...args);
    deduplicationManager.set(key, promise);

    return promise;
  };
}

// Expose to window for debugging
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.deduplicationManager = deduplicationManager;
}
