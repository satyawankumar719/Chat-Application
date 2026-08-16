import { connectRedis, default as redisClient } from "../config/redis.js";
import { generateToken } from "../utils/index.js";
import sessionService from "../services/session.service.js";
import jwt from "jsonwebtoken";

async function verifySessionArchitecture() {
  console.log("\n=======================================================");
  console.log("VERIFYING REDIS SESSION MANAGEMENT (JTI STORE & DELETE)");
  console.log("=======================================================\n");

  try {
    await connectRedis();
    await new Promise((r) => setTimeout(r, 1000));

    const isRedisReady = redisClient.isReady;
    console.log(`[STATUS] Redis Active & Ready? -> ${isRedisReady ? "YES (Testing Redis session storage)" : "NO (Testing MemCache fallback session storage)"}\n`);

    const dummyUser = {
      id: "64a1b2c3d4e5f67890123456",
      name: "Test User",
      email: "testuser@example.com",
      isVerified: true,
    };

    // Step 1: LOGIN SIMULATION -> Generate JWT Token
    console.log("Step 1: User logs in -> Generating JWT Token...");
    const token = generateToken(dummyUser);
    const decoded = jwt.decode(token);
    const jti = decoded.jti;
    console.log(`- Generated JTI: ${jti}`);
    console.log(`- Token Payload contains id: ${decoded.id}, jti: ${jti}`);

    // Step 2: STORE SESSION IN REDIS (session:jti -> userId)
    console.log("\nStep 2: Storing active session in Redis (`session:${jti}`)...");
    await sessionService.createSession(token, dummyUser.id);

    // Verify session state before logout
    const storedSessionUserId = await sessionService.getSession(jti);
    console.log(`- Retrieved active session for JTI "${jti}": ${storedSessionUserId}`);

    if (isRedisReady) {
      const rawRedisVal = await redisClient.get(`session:${jti}`);
      const rawTtl = await redisClient.ttl(`session:${jti}`);
      console.log(`- Raw Redis key "session:${jti}" = "${rawRedisVal}" (TTL: ${rawTtl}s)`);
    }

    if (storedSessionUserId === dummyUser.id) {
      console.log("  -> SUCCESS: Session is active and properly stored!");
    } else {
      throw new Error("FAILED: Session userId mismatch or not found.");
    }

    // Step 3: LOGOUT SIMULATION -> Delete session from Redis
    console.log("\nStep 3: User logs out -> Deleting session (`DEL session:${jti}`)...");
    await sessionService.deleteSession(token);

    // Step 4: TRY USING OLD COPIED TOKEN AFTER LOGOUT
    console.log("\nStep 4: Attempting to verify session using old copied token...");
    const sessionAfterLogout = await sessionService.getSession(jti);
    console.log(`- Session status after logout for JTI "${jti}": ${sessionAfterLogout}`);

    if (sessionAfterLogout === null) {
      console.log("  -> SUCCESS: Session is DELETED. Old copied token cannot access account!");
    } else {
      throw new Error("FAILED: Session still exists after logout!");
    }

    console.log("\n=======================================================");
    console.log("ALL REDIS SESSION VERIFICATION TESTS PASSED SUCCESSFULLY!");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Session verification test failed:", error);
    process.exit(1);
  }
}

verifySessionArchitecture();
