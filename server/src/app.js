import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { notFound, errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/authRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "SquadFund", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
// Next steps: contributions, notifications, withdrawals

app.use(notFound);
app.use(errorHandler);

export default app;
