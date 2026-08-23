import redisClient from "../config/redis.js";
import { memCache } from "../utils/memcache.js";
import { logger } from "../logger.js";

export const CACHE_TTL = {
  USER_PROFILE: 3600,
  MESSAGES: 300,
  CONVERSATIONS: 300,
  ONLINE_STATUS: 300,
};


export const CACHE_KEYS = {
  USER_PROFILE: (userId : string) => `user:profile:${userId.toString()}`,
  USER_CONVERSATIONS: (userId : string) => `user:conversations:${userId.toString()}`,
  CHAT_MESSAGES: (chatId : string) => `chat:messages:${chatId.toString()}:limit50`,
  ONLINE_STATUS: (userId : string) => `user:status:${userId.toString()}`,
  ONLINE_USERS_LIST: () => `online_users`,
};

class CacheService {

  isRedisAvailable() {
    return Boolean(redisClient && redisClient.isReady);
  }
  async get(key : string) {
    if (this.isRedisAvailable()) {
      try {
        const data = await redisClient.get(key);
        if (data !== null && data !== undefined) {
          logger.info(`[CACHE HIT - REDIS] Key: ${key}`);
          return JSON.parse(data);
        }
      } catch (err: any) {
        logger.warn(`Redis get error for key "${key}". Falling back to MemCache:`, err.message);
      }
    }
    const memData = memCache.get(key);
    if (memData !== null && memData !== undefined) {
      logger.info(`[CACHE HIT - MEMCACHE] Key: ${key}`);
      return memData;
    }

    logger.info(`[CACHE MISS] Key: ${key}`);
    return null;
  }


  async set<T>(key : string, value : T, ttlSeconds = CACHE_TTL.MESSAGES) {

    memCache.set(key, value, ttlSeconds);

    if (this.isRedisAvailable()) {
      try {
        const payload = JSON.stringify(value);
        await redisClient.set(key, payload, { EX: ttlSeconds });
      } catch (err: any) {
        logger.warn(`Redis set error for key "${key}":`, err.message);
      }
    }
  }

  async del(key : string) {
    memCache.del(key);

    if (this.isRedisAvailable()) {
      try {
        await redisClient.del(key);
      } catch (err : any) {
        logger.warn(`Redis del error for key "${key}":`, err.message);
      }
    }
  }



  async getOrSet<T>(key : string,  fetchFn: () => Promise<T>, ttlSeconds = CACHE_TTL.MESSAGES): Promise<T | null> {
    const cachedData = await this.get(key);
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData;
    }

    logger.info(`[FETCHING FROM MONGODB] Key: ${key}`);
    const freshData = await fetchFn();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }
    return freshData;
  }
  async invalidateUserProfile(userId : string) {
    if (!userId) return;
    await this.del(CACHE_KEYS.USER_PROFILE(userId));
  }

  async invalidateUserConversations(userId : string) {
    if (!userId) return;
    await this.del(CACHE_KEYS.USER_CONVERSATIONS(userId));
  }
  async invalidateChatMessages(chatId : string) {
    if (!chatId) return;
    await this.del(CACHE_KEYS.CHAT_MESSAGES(chatId));
  }

  async refreshChatMessages<T>(chatId : string, fetchFn:()=>Promise<T>) {
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
