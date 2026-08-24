import express from 'express';
import type { Request, Response, NextFunction, Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.routes.js';
import { ENV } from './config/envConfig.js';

const app: Application = express();

const allowedOrigins = [
  ENV.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || ENV.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(morgan('dev'));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(cookieParser());

app.get('/', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Server is healthy"
  });
});

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || 500;
  const message = err.message || 'Internal server error';
  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null
  });
});

export default app;
