/**
 * MemCache Fallback Store
 * In-memory key-value cache implementation used as a fallback layer when Redis is unavailable.
 * Supports TTL (Time-To-Live) expiration, pattern deletion, and automatic periodic cleanup.
 */

class MemCacheStore {
  constructor() {
    this.cache = new Map();
    // Run garbage collection for expired keys every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanExpired(), 60000);
    // Unref interval so node process isn't kept alive during exit/tests
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Store a value in memory with optional TTL in seconds.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlSeconds]
   */
  set(key, value, ttlSeconds = null) {
    const expireAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, {
      value,
      expireAt,
    });
  }

  /**
   * Retrieve a value from memory. Returns null if key doesn't exist or is expired.
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Delete a key from memory.
   * @param {string} key
   */
  del(key) {
    this.cache.delete(key);
  }

  /**
   * Delete keys matching a pattern (e.g. "user:conversations:*" or regex string)
   * @param {string|RegExp} pattern
   */
  delPattern(pattern) {
    const regex = typeof pattern === "string"
      ? new RegExp("^" + pattern.replace(/\*/g, ".*") + "$")
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all stored keys.
   */
  flush() {
    this.cache.clear();
  }

  /**
   * Internal method to remove expired entries.
   */
  cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expireAt && entry.expireAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const memCache = new MemCacheStore();
export default memCache;
