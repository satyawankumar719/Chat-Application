import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import { memCache } from "../utils/memcache.js";
import { logger } from "../logger.js";

class SessionService {
  isRedisAvailable() {
    return Boolean(redisClient && redisClient.isReady);
  }

  /**
   * Store session in Redis and MemCache fallback upon successful login/token generation
   * @param {string} token - The signed JWT string
   * @param {string|object} userId - User ID to associate with the jti
   */
  async createSession(token, userId) {
    try {
      if (!token) return null;
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti) {
        logger.warn("createSession called without valid token or jti");
        return null;
      }

      const jti = decoded.jti;
      const uid = (userId || decoded.id || decoded._id)?.toString();
      const key = `session:${jti}`;

      const nowInSeconds = Math.floor(Date.now() / 1000);
      const ttlSeconds = decoded.exp
        ? Math.max(1, decoded.exp - nowInSeconds)
        : 7 * 24 * 60 * 60; // default 7 days fallback

      // Store in MemCache as secondary fallback
      memCache.set(key, uid, ttlSeconds);

      // Store in Redis primary store
      if (this.isRedisAvailable()) {
        try {
          await redisClient.set(key, uid, { EX: ttlSeconds });
          logger.info(`[SESSION CREATED - REDIS] Key: ${key} -> UserId: ${uid} (TTL: ${ttlSeconds}s)`);
        } catch (err) {
          logger.warn(`Redis set session error for key "${key}":`, err.message);
        }
      } else {
        logger.info(`[SESSION CREATED - MEMCACHE] Key: ${key} -> UserId: ${uid}`);
      }

      return { jti, userId: uid };
    } catch (error) {
      logger.error("Error creating session in sessionService:", error);
      return null;
    }
  }

  /**
   * Check if session is active in Redis (or MemCache)
   * @param {string} jti - Unique JWT ID
   * @returns {Promise<string|null>} - Returns userId if session exists, null otherwise
   */
  async getSession(jti) {
    if (!jti) return null;
    const key = `session:${jti}`;

    if (this.isRedisAvailable()) {
      try {
        const storedUserId = await redisClient.get(key);
        if (storedUserId !== null && storedUserId !== undefined) {
          logger.info(`[SESSION HIT - REDIS] Key: ${key}`);
          return storedUserId;
        }
      } catch (err) {
        logger.warn(`Redis get session error for key "${key}". Checking MemCache:`, err.message);
      }
    }

    const memUserId = memCache.get(key);
    if (memUserId !== null && memUserId !== undefined) {
      logger.info(`[SESSION HIT - MEMCACHE] Key: ${key}`);
      return memUserId;
    }

    logger.warn(`[SESSION EXPIRED / LOGGED OUT] Key: ${key}`);
    return null;
  }

  /**
   * Delete session on logout
   * @param {string} tokenOrJti - Raw JWT token or jti string
   */
  async deleteSession(tokenOrJti) {
    if (!tokenOrJti) return;

    let jti = tokenOrJti;
    if (tokenOrJti.includes(".")) {
      const decoded = jwt.decode(tokenOrJti);
      jti = decoded?.jti || tokenOrJti;
    }

    const key = `session:${jti}`;

    // Remove from MemCache
    memCache.del(key);

    // Remove from Redis
    if (this.isRedisAvailable()) {
      try {
        await redisClient.del(key);
        logger.info(`[SESSION DELETED - REDIS] Key: ${key}`);
      } catch (err) {
        logger.warn(`Redis del session error for key "${key}":`, err.message);
      }
    } else {
      logger.info(`[SESSION DELETED - MEMCACHE] Key: ${key}`);
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;
