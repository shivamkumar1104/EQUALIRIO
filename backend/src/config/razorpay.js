import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Check if valid Razorpay API keys are provided in environment
 */
export const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  return Boolean(
    keyId &&
    keySecret &&
    !keyId.includes("PLACEHOLDER") &&
    !keySecret.includes("PLACEHOLDER") &&
    keyId.trim().length > 5 &&
    keySecret.trim().length > 5
  );
};

/**
 * Get initialized Razorpay SDK client (or null if not configured)
 */
export const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    return null;
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET.trim(),
  });
};

/**
 * Verify Razorpay HMAC SHA256 Signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @returns {boolean}
 */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!isRazorpayConfigured()) {
    // In mock/test mode without credentials, accept simulated mock order signatures
    if (orderId && orderId.startsWith("order_mock_") && paymentId && signature) {
      return true;
    }
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET.trim())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
};
