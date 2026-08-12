import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes/index.routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cookieParser());

// Static Uploads Folder
app.use("/uploads", express.static("uploads"));

// Health Check Route
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

// API Routes
app.use("/api", routes);

// 404 Route Handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";
  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
  });
});

export default app;
