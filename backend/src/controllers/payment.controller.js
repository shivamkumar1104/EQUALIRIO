import Booking from "../models/Booking.js";
import Suite from "../models/Suite.js";
import generateBookingId from "../utils/generateBookingId.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import {
  getRazorpayClient,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "../config/razorpay.js";

/**
 * Currency conversion rate to INR (Razorpay standard)
 */
const CONVERSION_RATES_TO_INR = {
  IND: 1,
  INR: 1,
  USD: 85,
  EUR: 92,
  GBP: 108,
  JPY: 0.55,
};

/**
 * @desc    Get Razorpay public configuration
 * @route   GET /api/payment/config
 * @access  Public
 */
export const getPaymentConfig = async (req, res) => {
  try {
    const configured = isRazorpayConfigured();
    return sendSuccess(res, 200, "Payment configuration retrieved", {
      isConfigured: configured,
      keyId: configured ? process.env.RAZORPAY_KEY_ID?.trim() : "rzp_test_equalirio_demo",
      currency: "INR",
      mode: configured ? "razorpay_live_or_test" : "simulation",
    });
  } catch (error) {
    console.error("getPaymentConfig error:", error);
    return sendError(res, 500, "Failed to get payment configuration");
  }
};

/**
 * @desc    Create Razorpay Order for a Booking
 * @route   POST /api/payment/razorpay/create-order
 * @access  Public (Guest or Authenticated User)
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const {
      bookingId,
      suiteId,
      suiteName,
      suitePrice,
      suiteImage,
      category,
      checkIn,
      checkOut,
      guests,
      addons = [],
      specialRequests,
      guestInfo,
      currency = "IND",
    } = req.body;

    let booking;

    // 1. If an existing booking is provided
    if (bookingId) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
      booking = await Booking.findOne(
        isObjectId ? { _id: bookingId } : { bookingId }
      );
      if (!booking) {
        return sendError(res, 404, "Booking record not found");
      }
    } else {
      // 2. Validate dates & guest info
      if (!checkIn || !checkOut) {
        return sendError(res, 400, "Check-in and check-out dates are required");
      }
      if (!guestInfo?.email || !guestInfo?.fullName) {
        return sendError(res, 400, "Guest name and email address are required");
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      if (checkOutDate <= checkInDate) {
        return sendError(res, 400, "Check-out date must be after check-in date");
      }

      const nights = Math.max(
        1,
        Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Resolve Suite details (from DB if ObjectId or from request payload)
      let suiteDoc = null;
      if (suiteId && /^[0-9a-fA-F]{24}$/.test(suiteId)) {
        suiteDoc = await Suite.findById(suiteId);
      }

      const nightlyRate = Number(suitePrice || suiteDoc?.pricePerNight || 950);
      const addonsTotal = (addons || []).reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );

      const subtotal = nightlyRate * nights + addonsTotal;
      const taxRate = 0.12;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

      // Split name into first and last
      const nameParts = (guestInfo.fullName || "").trim().split(" ");
      const firstName = nameParts[0] || "Valued";
      const lastName = nameParts.slice(1).join(" ") || "Guest";

      // Create new booking document in pending state
      const generatedId = generateBookingId();
      booking = await Booking.create({
        bookingId: generatedId,
        user: req.user?._id || null,
        suite: suiteDoc?._id || null,
        suiteSnapshot: {
          name: suiteName || suiteDoc?.name || "Luxury Suite",
          category: category || suiteDoc?.category || "suite",
          pricePerNight: nightlyRate,
          image: suiteImage || suiteDoc?.images?.[0]?.url || "/images/Infinity Pool Ocean Villa exterior.jpg",
        },
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: {
          adults: Number(guests?.adults || 2),
          children: Number(guests?.children || 0),
        },
        addons: addons.map((a) => ({
          name: a.name,
          price: Number(a.price) || 0,
          quantity: Number(a.quantity) || 1,
        })),
        specialRequests: specialRequests || guestInfo?.specialRequests || "",
        guestInfo: {
          firstName,
          lastName,
          email: guestInfo.email.toLowerCase().trim(),
          phone: guestInfo.phone || "",
          nationality: guestInfo.nationality || "International",
        },
        pricing: {
          nightlyRate,
          numberOfNights: nights,
          addonsTotal,
          taxRate,
          taxAmount,
          totalAmount,
          currency: "USD",
        },
        status: "pending",
        paymentStatus: "unpaid",
        paymentMethod: "razorpay",
        source: "website",
      });
    }

    // Calculate total in INR (Razorpay base currency)
    // Pricing stored in USD, convert to INR for Razorpay paise
    const rateToINR = CONVERSION_RATES_TO_INR.USD || 85;
    const totalInINR = Math.round(booking.pricing.totalAmount * rateToINR);
    const amountInPaise = Math.round(totalInINR * 100);

    const client = getRazorpayClient();

    if (client && isRazorpayConfigured()) {
      // Create real Razorpay order
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: booking.bookingId,
        notes: {
          bookingId: booking.bookingId,
          guestName: `${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`,
          guestEmail: booking.guestInfo.email,
          suiteName: booking.suiteSnapshot?.name || "Equalirio Suite",
        },
      };

      const razorpayOrder = await client.orders.create(options);

      booking.razorpayOrderId = razorpayOrder.id;
      await booking.save();

      return sendSuccess(res, 201, "Razorpay order created successfully", {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        amountInINR: totalInINR,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID.trim(),
        bookingId: booking.bookingId,
        booking,
        isMock: false,
      });
    } else {
      // Test simulation mode (when API keys are pending)
      const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      booking.razorpayOrderId = mockOrderId;
      await booking.save();

      return sendSuccess(res, 201, "Razorpay simulation order created", {
        orderId: mockOrderId,
        amount: amountInPaise,
        amountInINR: totalInINR,
        currency: "INR",
        keyId: "rzp_test_equalirio_demo",
        bookingId: booking.bookingId,
        booking,
        isMock: true,
        notice:
          "Razorpay is running in developer test simulation mode. Configure RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in backend/.env for live checkout.",
      });
    }
  } catch (error) {
    console.error("createRazorpayOrder error:", error);
    return sendError(res, 500, error.message || "Failed to create payment order");
  }
};

/**
 * @desc    Verify Razorpay Payment Signature and Confirm Booking
 * @route   POST /api/payment/razorpay/verify
 * @access  Public
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = "razorpay",
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return sendError(res, 400, "Missing payment identification parameters");
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return sendError(res, 400, "Payment verification failed: Invalid digital signature");
    }

    // Find the booking
    const query = bookingId
      ? { bookingId }
      : { razorpayOrderId: razorpay_order_id };

    const booking = await Booking.findOne(query);

    if (!booking) {
      return sendError(res, 404, "Booking associated with this payment order not found");
    }

    // Update booking to paid & confirmed
    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.paymentMethod = "razorpay";
    booking.paymentReference = razorpay_payment_id;
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    booking.confirmedAt = new Date();

    await booking.save();

    return sendSuccess(res, 200, "Payment verified and booking confirmed successfully", {
      booking,
      payment: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        status: "captured",
        method: paymentMethod,
      },
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return sendError(res, 500, error.message || "Failed to verify payment");
  }
};

/**
 * @desc    Razorpay Webhook Handler
 * @route   POST /api/payment/razorpay/webhook
 * @access  Public (Called by Razorpay servers)
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (webhookSecret && signature) {
      const crypto = await import("crypto");
      const expected = crypto.default
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expected !== signature) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const orderId = payload?.payment?.entity?.order_id || payload?.order?.entity?.id;
      const paymentId = payload?.payment?.entity?.id;

      if (orderId) {
        const booking = await Booking.findOne({ razorpayOrderId: orderId });
        if (booking && booking.paymentStatus !== "paid") {
          booking.paymentStatus = "paid";
          booking.status = "confirmed";
          booking.paymentReference = paymentId || booking.paymentReference;
          booking.confirmedAt = booking.confirmedAt || new Date();
          await booking.save();
        }
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("handleRazorpayWebhook error:", error);
    return res.status(500).json({ error: "Webhook processing error" });
  }
};
