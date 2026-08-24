import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import { memCache } from "../utils/memcache.js";
import { logger } from "../logger.js";
import type { Types } from "mongoose";

type UserId = string | Types.ObjectId;

class SessionService {
  isRedisAvailable(): boolean {
    return Boolean(redisClient && (redisClient as any).isReady);
  }

  async storeRefreshToken(
    userId: UserId,
    jti: string,
    ttlSeconds: number = 7 * 24 * 60 * 60
  ): Promise<boolean> {
    try {
      if (!userId || !jti) return false;
      const key = `refresh_token:${userId}:${jti}`;
      const uid = userId.toString();

      memCache.set(key, uid, ttlSeconds);

      if (this.isRedisAvailable()) {
        try {
          await redisClient.set(key, uid, { EX: ttlSeconds });
          logger.info(`[REFRESH TOKEN STORED - REDIS] Key: ${key} (TTL: ${ttlSeconds}s)`);
        } catch (err: any) {
          logger.warn(`Redis set refresh token error for key "${key}":`, err.message);
        }
      } else {
        logger.info(`[REFRESH TOKEN STORED - MEMCACHE] Key: ${key}`);
      }

      return true;
    } catch (error) {
      logger.error("Error storing refresh token in sessionService:", error);
      return false;
    }
  }

  async isRefreshTokenValid(userId: UserId, jti: string): Promise<boolean> {
    if (!userId || !jti) return false;
    const key = `refresh_token:${userId}:${jti}`;

    if (this.isRedisAvailable()) {
      try {
        const storedUserId = await redisClient.get(key);
        if (storedUserId !== null && storedUserId !== undefined) {
          logger.info(`[REFRESH TOKEN HIT - REDIS] Key: ${key}`);
          return true;
        }
      } catch (err: any) {
        logger.warn(`Redis get refresh token error for key "${key}". Checking MemCache:`, err.message);
      }
    }

    const memUserId = memCache.get(key);
    if (memUserId !== null && memUserId !== undefined) {
      logger.info(`[REFRESH TOKEN HIT - MEMCACHE] Key: ${key}`);
      return true;
    }

    logger.warn(`[REFRESH TOKEN INVALID / LOGGED OUT] Key: ${key}`);
    return false;
  }

  async revokeRefreshToken(userId: UserId, jti: string): Promise<void> {
    if (!userId || !jti) return;
    const key = `refresh_token:${userId}:${jti}`;

    memCache.del(key);

    if (this.isRedisAvailable()) {
      try {
        await redisClient.del(key);
        logger.info(`[REFRESH TOKEN REVOKED - REDIS] Key: ${key}`);
      } catch (err: any) {
        logger.warn(`Redis del refresh token error for key "${key}":`, err.message);
      }
    } else {
      logger.info(`[REFRESH TOKEN REVOKED - MEMCACHE] Key: ${key}`);
    }
  }

  async createSession(token: string, userId?: UserId): Promise<{ jti: string; userId: string } | null> {
    if (!token) return null;
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.jti) return null;
    const uid = (userId || decoded.id || decoded._id)?.toString();
    if (!uid) return null;
    await this.storeRefreshToken(uid, decoded.jti);
    return { jti: decoded.jti, userId: uid };
  }

  async getSession(jti: string): Promise<boolean> {
    return true; 
  }

  async deleteSession(tokenOrJti: string): Promise<void> {
    if (!tokenOrJti) return;
    if (tokenOrJti.includes(".")) {
      const decoded = jwt.decode(tokenOrJti) as any;
      if (decoded?.id && decoded?.jti) {
        await this.revokeRefreshToken(decoded.id, decoded.jti);
      }
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;
