import { z } from "zod";
import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
} from "../utils/tokens.js";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone number").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Issues a new access + refresh token pair and stores the refresh hash
async function issueTokens(user, res, oldRefreshHash) {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  let hashes = user.refreshTokenHashes || [];
  if (oldRefreshHash) hashes = hashes.filter((h) => h !== oldRefreshHash);
  hashes.push(hashToken(refreshToken));
  user.refreshTokenHashes = hashes.slice(-5);
  await user.save();

  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  return accessToken;
}

export async function register(req, res) {
  const { name, email, phone, password } = req.body;

  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const user = new User({ name, email, phone });
  await user.setPassword(password);
  const accessToken = await issueTokens(user, res);

  res.status(201).json({ user, accessToken });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash +refreshTokenHashes");

  // same message for both cases so attackers can't discover which emails exist
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = await issueTokens(user, res);
  res.json({ user, accessToken });
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub).select("+refreshTokenHashes");
    const oldHash = hashToken(token);

    if (!user || !user.refreshTokenHashes.includes(oldHash)) {
      res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
      return res.status(401).json({ message: "Session expired, please log in again" });
    }

    const accessToken = await issueTokens(user, res, oldHash);
    res.json({ user, accessToken });
  } catch {
    res.status(401).json({ message: "Session expired, please log in again" });
  }
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne(
        { _id: payload.sub },
        { $pull: { refreshTokenHashes: hashToken(token) } }
      );
    } catch {
      // token already invalid, nothing to remove
    }
  }
  res.clearCookie("refreshToken", { ...refreshCookieOptions, maxAge: undefined });
  res.json({ message: "Logged out" });
}

export function me(req, res) {
  res.json({ user: req.user });
}
