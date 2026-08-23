interface CacheEntry<T = any> {
  value: T;
  expireAt: number | null;
}

class MemCacheStore {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cache = new Map<string, CacheEntry>();
    this.cleanupInterval = setInterval(() => this.cleanExpired(), 60000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  set<T = any>(key: string, value: T, ttlSeconds: number | null = null): void {
    const expireAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, {
      value,
      expireAt,
    });
  }

  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  delPattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string"
      ? new RegExp("^" + pattern.replace(/\*/g, ".*") + "$")
      : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  flush(): void {
    this.cache.clear();
  }

  cleanExpired(): void {
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
