import { connectRedis, default as redisClient } from "../config/redis.js";
import { connectDB } from "../config/dbConfig.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "../services/cache.service.js";
import User from "../models/User.js";

async function proveRedisCaching() {
  console.log("\n=======================================================");
  console.log("PROVING DATA RETRIEVAL FROM REDIS PRIMARY CACHE");
  console.log("=======================================================\n");

  try {
    await connectDB();
    await connectRedis();

    await new Promise((r) => setTimeout(r, 1000));

    const isRedisReady = redisClient.isReady;
    console.log(`[STATUS] Is Redis Connected & Ready? -> ${isRedisReady ? "YES (Redis Server Active)" : "NO (Using MemCache Fallback)"}`);

    if (!isRedisReady) {
      console.log("\n[NOTE] Redis server is not currently running on redis://localhost:6379.");
      console.log("Start Redis server locally (`redis-server`) to see live Redis key retrieval.\n");
      process.exit(0);
    }

    const testUser = await User.findOne({});
    if (!testUser) {
      console.log("No user found in database for test.");
      process.exit(0);
    }

    const userId = testUser._id.toString();
    const cacheKey = CACHE_KEYS.USER_PROFILE(userId);

    await redisClient.del(cacheKey);
    console.log(`[CLEARED REDIS KEY] ${cacheKey}`);

    console.log("\n--- CALL 1: Requesting User Profile ---");
    const t0 = performance.now();
    const profile1 = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await User.findById(userId).select("-password").lean();
      },
      CACHE_TTL.USER_PROFILE
    );
    const t1 = performance.now();
    console.log(`Call 1 Response Time: ${(t1 - t0).toFixed(2)} ms (Fetched from MongoDB & saved to Redis)`);

    console.log("\n--- DIRECT REDIS STORAGE VERIFICATION ---");
    const rawRedisData = await redisClient.get(cacheKey);
    const redisTtl = await redisClient.ttl(cacheKey);
    console.log(`Raw Key in Redis: "${cacheKey}"`);
    console.log(`Value stored in Redis: ${rawRedisData ? rawRedisData.substring(0, 120) : ""}...`);
    console.log(`TTL remaining in Redis: ${redisTtl} seconds (~1 hour)`);

    console.log("\n--- CALL 2: Requesting Same User Profile Again ---");
    const t2 = performance.now();
    const profile2 = await cacheService.get(cacheKey);
    const t3 = performance.now();
    console.log(`Call 2 Response Time: ${(t3 - t2).toFixed(2)} ms (Served DIRECTLY from Redis Cache!)`);

    console.log("\n=======================================================");
    console.log("PROOF SUMMARY:");
    console.log(`1. Key "${cacheKey}" exists in Redis: ${Boolean(rawRedisData)}`);
    console.log(`2. MongoDB Call Time: ${(t1 - t0).toFixed(2)} ms`);
    console.log(`3. Redis Cache Hit Time: ${(t3 - t2).toFixed(2)} ms (Speedup: ${((t1 - t0) / Math.max(0.01, t3 - t2)).toFixed(1)}x faster!)`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error in Redis proof test:", error);
    process.exit(1);
  }
}

proveRedisCaching();
