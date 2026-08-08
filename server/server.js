import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/envConfig.js';
import { connectDB } from './config/dbConfig.js';
import routes from './routes/index.routes.js';
import cookieParser from 'cookie-parser';
import { connectRedis } from './config/redis.js';
import http from 'http';
import { Server } from 'socket.io';
import {socketHandler} from './socket/socketHandler.js';
import { logger } from './logger.js';
const app = express();
// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(helmet({
    crossOriginResourcePolicy : {policy :"cross-origin"}
}));

app.use(cookieParser());



app.get('/', (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Server is healthy"
    });

})

app.use('/uploads', express.static('uploads'));
app.use('/api', routes);
connectDB();
connectRedis();

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal server error';
    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || null
    });
});

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
    logger.info('Server is running');
});