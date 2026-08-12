import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import { ENV } from './config/envConfig.js';
import { connectDB } from './config/dbConfig.js';
import { connectRedis } from './config/redis.js';
import { socketHandler } from './socket/socketHandler.js';
import { logger } from './logger.js';

// Connect to databases
connectDB();
connectRedis();

// Create HTTP server and attach Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

socketHandler(io);

server.listen(ENV.PORT, () => {
  logger.info(`Server is running on port ${ENV.PORT}`);
});