
class MemCacheStore {
  constructor() {
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanExpired(), 60000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  set(key, value, ttlSeconds = null) {
    const expireAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, {
      value,
      expireAt,
    });
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  del(key) {
    this.cache.delete(key);
  }

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

  flush() {
    this.cache.clear();
  }

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
