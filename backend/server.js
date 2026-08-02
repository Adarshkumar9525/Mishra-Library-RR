// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const morgan = require("morgan");
// const connectDB = require("./config/db");
// const { notFound, errorHandler } = require("./middleware/errorHandler");
// const { apiLimiter } = require("./middleware/rateLimiter");

// // Routes
// const authRoutes = require("./routes/authRoutes");
// const studentRoutes = require("./routes/studentRoutes");
// const seatRoutes = require("./routes/seatRoutes");
// const paymentRoutes = require("./routes/paymentRoutes");
// const dashboardRoutes = require("./routes/dashboardRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const settingsRoutes = require("./routes/settingsRoutes");

// connectDB();

// const app = express();

// // Core middleware
// // CLIENT_URL can be a single origin or comma-separated list (e.g. local + production),
// // and must always include the protocol (http:// or https://).
// const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
//   .split(",")
//   .map((o) => o.trim())
//   .filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (curl, Postman, mobile apps)
//       if (!origin || allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       console.warn(`CORS blocked request from origin: ${origin}`);
//       return callback(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//   })
// );
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true }));
// if (process.env.NODE_ENV !== "production") {
//   app.use(morgan("dev"));
// }
// app.use("/api", apiLimiter);

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({ success: true, message: "Mishra Library ERP API is running" });
// });

// // Route mounting
// app.use("/api/auth", authRoutes);
// app.use("/api/students", studentRoutes);
// app.use("/api/seats", seatRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/settings", settingsRoutes);

// // Error handling (must be last)
// app.use(notFound);
// app.use(errorHandler);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Mishra Library ERP server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

// Routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const seatRoutes = require("./routes/seatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// Connect Database
connectDB();

const app = express();

// ==============================
// CORS Configuration
// ==============================
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ==============================
// Middleware
// ==============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/api", apiLimiter);

// ==============================
// Root Route
// ==============================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 Mishra Library ERP Backend is Running",
    version: "1.0.0",
    health: "/api/health",
  });
});

// ==============================
// Health Check Route
// ==============================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mishra Library ERP API is running",
    status: "OK",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ==============================
// API Routes
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);

// ==============================
// Error Handling Middleware
// ==============================
app.use(notFound);
app.use(errorHandler);

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Mishra Library ERP Server running on port ${PORT} [${
      process.env.NODE_ENV || "development"
    }]`
  );
});