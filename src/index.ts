import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import freeAssessmentRoutes from "./routes/freeAssessmentRoutes.js";
import freeAssessmentContentRoutes from "./routes/freeAssessmentContentRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ielts-platform";

const app = express();

const allowedOrigins = [
<<<<<<< HEAD
  "https://ilets-frontend.vercel.app",
  "https://ilets-admin.vercel.app",
  "http://localhost:8080"
=======
  "https://ilets-frontend.vercel.app/",
  "https://ilets-admin.vercel.app/",
  "http://localhost:8080",
  "https://lively-sky-010d8a300.3.azurestaticapps.net"
>>>>>>> 752e5031ad0287da508d9957a2e37457684c314d
];

if (process.env.CORS_ORIGIN) {
  // Add multiple origins if comma-separated
  const envOrigins = process.env.CORS_ORIGIN.split(',').map(url => url.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve uploaded files as static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/free-assessments", freeAssessmentRoutes);
app.use("/api/free-assessment-content", freeAssessmentContentRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/evaluations", evaluationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
