import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { auth } from "../middleware/auth.js";
import {
  register,
  login,
  refresh,
  logout,
  me,
  registerSchema,
  loginSchema,
} from "../controllers/authController.js";

const router = Router();

// stricter limit on login/register to slow down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: "Too many attempts, try again later" },
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", auth, me);

export default router;
