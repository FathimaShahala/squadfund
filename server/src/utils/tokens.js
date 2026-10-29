import jwt from "jsonwebtoken";
import crypto from "crypto";

export const signAccessToken = (userId) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

export const signRefreshToken = (userId) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

// Refresh tokens are stored hashed in the DB so a DB leak can't be replayed
export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
