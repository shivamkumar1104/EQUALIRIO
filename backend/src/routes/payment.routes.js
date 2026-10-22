import { Router } from "express";
import {
  getPaymentConfig,
  createRazorpayOrder,
  verifyPayment,
  handleRazorpayWebhook,
} from "../controllers/payment.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import { bookingLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Public payment configuration check
router.get("/config", getPaymentConfig);

// Create order (uses optional authentication to link user if logged in)
router.post("/razorpay/create-order", bookingLimiter, optionalAuth, createRazorpayOrder);

// Verify payment signature and finalize booking
router.post("/razorpay/verify", optionalAuth, verifyPayment);

// Webhook for Razorpay asynchronous events
router.post("/razorpay/webhook", handleRazorpayWebhook);

export default router;
