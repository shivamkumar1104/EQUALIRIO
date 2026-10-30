import DiningReservation from "../models/DiningReservation.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import crypto from "node:crypto";

const generateReservationId = () => {
  const year = new Date().getFullYear();
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DIN-${year}-${hex}`;
};

/**
 * @desc    Create a dining reservation
 * @route   POST /api/dining
 * @access  Public (guests can reserve without account)
 */
export const createReservation = async (req, res) => {
  try {
    const { restaurant, date, time, guests, guestInfo, occasion, specialRequests } = req.body;

    const reservationDate = new Date(date);
    if (reservationDate < new Date()) {
      return sendError(res, 400, "Reservation date cannot be in the past");
    }

    // Check slot availability (max 10 concurrent reservations per restaurant per time slot)
    const existingCount = await DiningReservation.countDocuments({
      restaurant,
      date: reservationDate,
      time,
      status: { $in: ["pending", "confirmed", "seated"] },
    });

    if (existingCount >= 10) {
      return sendError(
        res,
        409,
        "This time slot is fully booked. Please choose a different time."
      );
    }

    const reservation = await DiningReservation.create({
      reservationId: generateReservationId(),
      user: req.user?._id,
      restaurant,
      date: reservationDate,
      time,
      guests,
      guestInfo,
      occasion,
      specialRequests,
      status: "pending",
    });

    return sendSuccess(res, 201, "Dining reservation created successfully", { reservation });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("createReservation error:", error);
    return sendError(res, 500, "Failed to create reservation");
  }
};

/**
 * @desc    Get user's dining reservations
 * @route   GET /api/dining/my
 * @access  Protected
 */
export const getMyReservations = async (req, res) => {
  try {
    const filter = {
      $or: [
        { user: req.user._id },
        ...(req.user.email ? [{ "guestInfo.email": { $regex: new RegExp(`^${req.user.email}$`, "i") } }] : []),
      ],
    };
    const reservations = await DiningReservation.find(filter).sort({
      date: -1,
    });
    return sendSuccess(res, 200, "Reservations retrieved", { reservations });
  } catch (error) {
    console.error("getMyReservations error:", error);
    return sendError(res, 500, "Failed to retrieve reservations");
  }
};

/**
 * @desc    Admin: Get all dining reservations
 * @route   GET /api/dining
 * @access  Admin
 */
export const getAllReservations = async (req, res) => {
  try {
    const { restaurant, status, date, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (restaurant) filter.restaurant = restaurant;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DiningReservation.countDocuments(filter);
    const reservations = await DiningReservation.find(filter)
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "All reservations retrieved", {
      reservations,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error("getAllReservations error:", error);
    return sendError(res, 500, "Failed to retrieve reservations");
  }
};

/**
 * @desc    Cancel a dining reservation
 * @route   PATCH /api/dining/:id/cancel
 * @access  Protected (owner or admin)
 */
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await DiningReservation.findOne({
      $or: [{ _id: req.params.id }, { reservationId: req.params.id }],
    });

    if (!reservation) return sendError(res, 404, "Reservation not found");

    const isOwner =
      reservation.user && reservation.user.toString() === req.user._id.toString();
    const isGuestEmailOwner =
      reservation.guestInfo?.email &&
      req.user.email &&
      reservation.guestInfo.email.toLowerCase() === req.user.email.toLowerCase();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isGuestEmailOwner && !isAdmin) {
      return sendError(res, 403, "You do not have permission to cancel this reservation");
    }

    if (["cancelled", "completed"].includes(reservation.status)) {
      return sendError(res, 400, `Reservation cannot be cancelled (status: ${reservation.status})`);
    }

    reservation.status = "cancelled";
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = req.body.reason || "Cancelled by guest";
    await reservation.save();

    return sendSuccess(res, 200, "Reservation cancelled successfully", { reservation });
  } catch (error) {
    console.error("cancelReservation error:", error);
    return sendError(res, 500, "Failed to cancel reservation");
  }
};

/**
 * @desc    Admin: Update reservation status
 * @route   PATCH /api/dining/:id/status
 * @access  Admin
 */
export const updateReservationStatus = async (req, res) => {
  try {
    const { status, tableNumber } = req.body;
    const reservation = await DiningReservation.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(tableNumber ? { tableNumber } : {}),
        ...(status === "confirmed" ? { confirmedAt: new Date() } : {}),
      },
      { new: true }
    );
    if (!reservation) return sendError(res, 404, "Reservation not found");
    return sendSuccess(res, 200, `Status updated to '${status}'`, { reservation });
  } catch (error) {
    console.error("updateReservationStatus error:", error);
    return sendError(res, 500, "Failed to update reservation status");
  }
};
