import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import routes from "./routes/index.routes.js";
import { ENV } from "./config/envConfig.js";

const app: Application = express();

const allowedOrigins = [
  ENV.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api", routes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(
  (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    let status = err.status || 500;
    let message = err.message || "Internal server error";

    // MongoDB Duplicate Key Error (E11000)
    if (err.code === 11000) {
      status = 409;
      const keyPattern = err.keyPattern || err.keyValue || {};
      const field = Object.keys(keyPattern)[0] || "field";
      const fieldName =
        field === "phoneNumber"
          ? "Phone number"
          : field === "email"
          ? "Email"
          : field.charAt(0).toUpperCase() + field.slice(1);
      message = `${fieldName} is already registered. Please use another one.`;
    } else if (err.name === "ValidationError") {
      status = 400;
      const firstError = Object.values(err.errors || {})[0] as any;
      message = firstError?.message || "Validation failed";
    } else if (err.name === "CastError") {
      status = 400;
      message = `Invalid ${err.path || "ID"} format`;
    }

    res.status(status).json({
      success: false,
      message,
      ...(err.isVerified !== undefined && { isVerified: err.isVerified }),
      ...(err.email && { email: err.email }),
    });
  }
);

export default app;