import cacheService, { CACHE_KEYS, CACHE_TTL } from "../services/cache.service.js";
import memCache from "../utils/memcache.js";

async function runCacheTests() {
  console.log("==========================================");
  console.log("Running US-13: In-Memory Caching Tests");
  console.log("==========================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // Test 1: Basic MemCache Fallback Operations
    memCache.flush();
    memCache.set("test:key:1", { name: "Alice" }, 10);
    const memVal = memCache.get("test:key:1");
    assert(memVal && memVal.name === "Alice", "MemCache basic set and get");

    memCache.del("test:key:1");
    const memValAfterDel = memCache.get("test:key:1");
    assert(memValAfterDel === null, "MemCache delete operation");

    // Test 2: Multi-tier Cache Service Get & Set
    const mockProfile = { _id: "user123", name: "Bob", email: "bob@example.com" };
    await cacheService.set(
      CACHE_KEYS.USER_PROFILE("user123"),
      mockProfile,
      CACHE_TTL.USER_PROFILE
    );

    const fetchedProfile = await cacheService.get(CACHE_KEYS.USER_PROFILE("user123"));
    assert(
      fetchedProfile && fetchedProfile.email === "bob@example.com",
      "CacheService set and get user profile data"
    );

    // Test 3: TTL Constant Verification
    assert(
      CACHE_TTL.USER_PROFILE === 3600,
      "User Profile TTL is 1 hour (3600 seconds)"
    );
    assert(
      CACHE_TTL.MESSAGES === 300,
      "Recent Messages TTL is 5 minutes (300 seconds)"
    );
    assert(
      CACHE_TTL.CONVERSATIONS === 300,
      "Conversation Lists TTL is 5 minutes (300 seconds)"
    );

    // Test 4: Cache-Aside GetOrSet Helper
    let mongoQueryCount = 0;
    const mockMongoFetch = async () => {
      mongoQueryCount++;
      return { _id: "chat999", title: "General Room" };
    };

    const firstFetch = await cacheService.getOrSet(
      CACHE_KEYS.USER_CONVERSATIONS("user123"),
      mockMongoFetch,
      CACHE_TTL.CONVERSATIONS
    );
    assert(mongoQueryCount === 1, "First getOrSet triggers MongoDB query (Cache Miss)");

    const secondFetch = await cacheService.getOrSet(
      CACHE_KEYS.USER_CONVERSATIONS("user123"),
      mockMongoFetch,
      CACHE_TTL.CONVERSATIONS
    );
    assert(mongoQueryCount === 1, "Second getOrSet returns cached data (Cache Hit)");
    assert(secondFetch.title === "General Room", "Correct cached conversation data returned");

    // Test 5: Cache Invalidation & Refresh for Messages
    const initialMessages = { messages: [{ _id: "msg1", content: "Hello" }], hasMore: false };
    await cacheService.set(
      CACHE_KEYS.CHAT_MESSAGES("chat999"),
      initialMessages,
      CACHE_TTL.MESSAGES
    );

    const cachedMessages = await cacheService.get(CACHE_KEYS.CHAT_MESSAGES("chat999"));
    assert(cachedMessages.messages.length === 1, "Initial recent messages cached");

    // Simulate new message -> Invalidate and refresh cache
    await cacheService.refreshChatMessages("chat999", async () => {
      return {
        messages: [
          { _id: "msg1", content: "Hello" },
          { _id: "msg2", content: "World" }
        ],
        hasMore: false
      };
    });

    const refreshedMessages = await cacheService.get(CACHE_KEYS.CHAT_MESSAGES("chat999"));
    assert(
      refreshedMessages && refreshedMessages.messages.length === 2,
      "On new message, recent messages cache is invalidated and refreshed with fresh data"
    );

    // Test 6: Online User Status Cache
    await cacheService.set(
      CACHE_KEYS.ONLINE_STATUS("user123"),
      { isOnline: true },
      CACHE_TTL.ONLINE_STATUS
    );
    const onlineStatus = await cacheService.get(CACHE_KEYS.ONLINE_STATUS("user123"));
    assert(onlineStatus && onlineStatus.isOnline === true, "Online user status cached successfully");

    console.log("==========================================");
    console.log(`Test Results: ${passedTests}/${totalTests} Passed`);
    console.log("==========================================");

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed with error:", error);
    process.exit(1);
  }
}

runCacheTests();
