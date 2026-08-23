import express from 'express';
import type { Request,Response,NextFunction,Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import routes from './routes/index.routes.js';

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173"],
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

app.use('/uploads', express.static('uploads'));

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
