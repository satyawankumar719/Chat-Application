import { createClient } from "redis";
import {ENV} from './envConfig.js'

const redisClient = createClient({
  url: ENV.REDIS_URL,
});

redisClient.on("connect", () => {
  console.log("Connecting to Redis...");
});

redisClient.on("ready", () => {
  console.log("Redis connected");
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.on("end", () => {
  console.log("Redis connection closed");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
};

export default redisClient;