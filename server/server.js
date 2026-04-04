import dotenv from "dotenv";
import cors from "cors";
import express from "express";

import connectDatabase from "./config/taskflowDatabase.js";
import authRoutes from "./routes/authRoutes.js";
import { seedAdmin } from "./controllers/taskflowAuthController.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();

const envFrontendUrls = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = ["http://localhost:3000", ...envFrontendUrls];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));

app.get("/api", (req, res) => {
  res.json({
    message: "TaskFlow API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

app.use((error, req, res, next) => {
  if (error?.message?.startsWith("CORS not allowed")) {
    return res.status(403).json({ detail: error.message });
  }

  next(error);
});

const PORT = process.env.PORT || 8001;

const startServer = async () => {
  try {
    await connectDatabase();
    await seedAdmin();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();
