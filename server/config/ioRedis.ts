import type { ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  maxRetriesPerRequest: null,
};

export default connection;
