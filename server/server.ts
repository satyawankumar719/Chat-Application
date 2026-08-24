import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import { ENV } from './config/envConfig.js';
import { connectDB } from './config/dbConfig.js';
import { connectRedis } from './config/redis.js';
import { socketHandler } from './socket/socketHandler.js';
import { logger } from './logger.js';
import redisClient from './config/redis.js';
// Connect to databases
connectDB();
connectRedis();



const server: http.Server = http.createServer(app);

const allowedOrigins = [
  ENV.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

const io: Server = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

socketHandler(io);

server.listen(ENV.PORT, () => {
  logger.info(`Server is running on port ${ENV.PORT}`);
});
