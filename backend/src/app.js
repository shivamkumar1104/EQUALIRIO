import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./routes/auth.routes.js";
import suiteRoutes from "./routes/suite.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import diningRoutes from "./routes/dining.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import hotelRoutes from "./routes/hotel.routes.js";
import contentRoutes from "./routes/content.routes.js";
import membershipRoutes from "./routes/membership.routes.js";

// Middlewares
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

// ─── Security Headers ───────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS — Strict Whitelist ─────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS policy: Origin '${origin}' is not allowed.`),
        false
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "10kb" })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── HTTP Logging (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined")); // structured logs in production
}

// ─── Global Rate Limit ───────────────────────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Equalirio Hotel API is running",
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/suites", suiteRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dining", diningRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/hotel", hotelRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/membership", membershipRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // CORS error
  if (err.message?.startsWith("CORS policy:")) {
    return res.status(403).json({ success: false, message: err.message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: '${field}'`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

export default app;