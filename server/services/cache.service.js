import redisClient from "../config/redis.js";
import { memCache } from "../utils/memcache.js";
import { logger } from "../logger.js";

/**
 * Cache TTL Constants
 * US-13 Acceptance Criteria:
 * - 1 hour for user profiles
 * - 5 minutes for messages (and conversations/status)
 */
export const CACHE_TTL = {
  USER_PROFILE: 3600,   // 1 hour in seconds
  MESSAGES: 300,        // 5 minutes in seconds
  CONVERSATIONS: 300,   // 5 minutes in seconds
  ONLINE_STATUS: 300,   // 5 minutes in seconds
};

/**
 * Standardized Cache Key Generators
 */
export const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId.toString()}`,
  USER_CONVERSATIONS: (userId) => `user:conversations:${userId.toString()}`,
  CHAT_MESSAGES: (chatId) => `chat:messages:${chatId.toString()}:limit50`,
  ONLINE_STATUS: (userId) => `user:status:${userId.toString()}`,
  ONLINE_USERS_LIST: () => `online_users`,
};

class CacheService {
  /**
   * Helper to check if Redis is currently connected and operational.
   * @returns {boolean}
   */
  isRedisAvailable() {
    return Boolean(redisClient && redisClient.isReady);
  }

  /**
   * Retrieve cached value by key.
   * Tries Redis first (Primary Cache). If Redis misses, fails, or is offline,
   * falls back to MemCache (Fallback Layer).
   * @param {string} key
   * @returns {Promise<*|null>}
   */
  async get(key) {
    if (this.isRedisAvailable()) {
      try {
        const data = await redisClient.get(key);
        if (data !== null && data !== undefined) {
          logger.info(`[CACHE HIT - REDIS] Key: ${key}`);
          return JSON.parse(data);
        }
      } catch (err) {
        logger.warn(`Redis get error for key "${key}". Falling back to MemCache:`, err.message);
      }
    }

    // MemCache fallback
    const memData = memCache.get(key);
    if (memData !== null && memData !== undefined) {
      logger.info(`[CACHE HIT - MEMCACHE] Key: ${key}`);
      return memData;
    }

    logger.info(`[CACHE MISS] Key: ${key}`);
    return null;
  }

  /**
   * Store key-value pair in cache with specified TTL in seconds.
   * Sets value in MemCache fallback layer and Redis (Primary Cache).
   * @param {string} key
   * @param {*} value
   * @param {number} ttlSeconds
   * @returns {Promise<void>}
   */
  async set(key, value, ttlSeconds = CACHE_TTL.MESSAGES) {
    // Populate MemCache (fallback layer)
    memCache.set(key, value, ttlSeconds);

    // Populate Redis (primary layer)
    if (this.isRedisAvailable()) {
      try {
        const payload = JSON.stringify(value);
        await redisClient.set(key, payload, { EX: ttlSeconds });
      } catch (err) {
        logger.warn(`Redis set error for key "${key}":`, err.message);
      }
    }
  }

  /**
   * Remove key from both MemCache and Redis.
   * @param {string} key
   * @returns {Promise<void>}
   */
  async del(key) {
    memCache.del(key);

    if (this.isRedisAvailable()) {
      try {
        await redisClient.del(key);
      } catch (err) {
        logger.warn(`Redis del error for key "${key}":`, err.message);
      }
    }
  }

  /**
   * Remove keys matching a pattern from both MemCache and Redis.
   * @param {string} pattern E.g. "user:conversations:*"
   * @returns {Promise<void>}
   */
  async delPattern(pattern) {
    memCache.delPattern(pattern);

    if (this.isRedisAvailable()) {
      try {
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await redisClient.del(keys);
        }
      } catch (err) {
        logger.warn(`Redis delPattern error for pattern "${pattern}":`, err.message);
      }
    }
  }

  /**
   * Cache-Aside Helper:
   * Returns cached value if present. On cache miss, fetches fresh data from MongoDB via fetchFn,
   * stores the result in cache with specified TTL, and returns it.
   * @param {string} key
   * @param {Function} fetchFn Async function fetching data from MongoDB on cache miss
   * @param {number} ttlSeconds
   * @returns {Promise<*>}
   */
  async getOrSet(key, fetchFn, ttlSeconds = CACHE_TTL.MESSAGES) {
    const cachedData = await this.get(key);
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData;
    }

    // Cache Miss -> Fetch from MongoDB
    logger.info(`[FETCHING FROM MONGODB] Key: ${key}`);
    const freshData = await fetchFn();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }

  // --- Specific Domain Helpers ---

  /**
   * Invalidate user profile cache entry.
   * @param {string} userId
   */
  async invalidateUserProfile(userId) {
    if (!userId) return;
    await this.del(CACHE_KEYS.USER_PROFILE(userId));
  }

  /**
   * Invalidate user conversation list cache entry.
   * @param {string} userId
   */
  async invalidateUserConversations(userId) {
    if (!userId) return;
    await this.del(CACHE_KEYS.USER_CONVERSATIONS(userId));
  }

  /**
   * Invalidate recent messages cache entry for a chat.
   * @param {string} chatId
   */
  async invalidateChatMessages(chatId) {
    if (!chatId) return;
    await this.del(CACHE_KEYS.CHAT_MESSAGES(chatId));
  }

  /**
   * Invalidate and refresh recent messages cache entry for a chat.
   * Requirement US-13: "On new message, the relevant cache entry is invalidated and refreshed."
   * @param {string} chatId
   * @param {Function} fetchFn Async function returning recent messages from DB
   */
  async refreshChatMessages(chatId, fetchFn) {
    if (!chatId) return;
    const cacheKey = CACHE_KEYS.CHAT_MESSAGES(chatId);
    await this.del(cacheKey);

    if (typeof fetchFn === "function") {
      try {
        const freshData = await fetchFn();
        if (freshData) {
          await this.set(cacheKey, freshData, CACHE_TTL.MESSAGES);
        }
      } catch (err) {
        logger.error(`Error refreshing chat messages cache for chat "${chatId}":`, err);
      }
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
