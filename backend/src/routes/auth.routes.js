import express from "express";
import {
  registerUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  loginUser,
  verifyEmail,
  resendVerificationEmail,
  googleAuth,
  getMe,
  updateProfile,
  getAllUsers,
  getAdminCustomers,
  getAdminDashboard,
} from "../controllers/auth.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

// Public Authentication Routes
router.post("/register", authLimiter, registerUser);
router.post("/register/request-otp", authLimiter, requestRegistrationOtp);
router.post("/register/verify-otp", authLimiter, verifyRegistrationOtp);
router.post("/login", authLimiter, loginUser);
router.get("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerificationEmail);
router.post("/google", authLimiter, googleAuth);

// Protected Routes (Requires valid JWT Token)
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

// Role-Based Authorized Routes (Requires role: "admin")
router.get("/admin/users", protect, authorize("admin"), getAllUsers);
router.get("/admin/customers", protect, authorize("admin"), getAdminCustomers);
router.get("/admin/dashboard", protect, authorize("admin"), getAdminDashboard);

export default router;