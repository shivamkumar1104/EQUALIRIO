/**
 * Booking Service
 * Business logic for bookings — keeps controllers thin.
 */

import Booking from "../models/Booking.js";
import { isSuiteAvailable } from "./availability.service.js";
import { calculateBookingPrice } from "./pricing.service.js";

/**
 * Validate and create a booking
 */
export const processCreateBooking = async ({ suiteId, suite, userId, checkIn, checkOut, guests, addons, specialRequests, guestInfo }) => {
  // Check availability
  const availability = await isSuiteAvailable(suiteId, checkIn, checkOut);
  if (!availability.available) {
    return { success: false, statusCode: 409, message: availability.reason };
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate <= checkInDate) {
    return { success: false, statusCode: 400, message: "Check-out date must be after check-in date" };
  }

  if (checkInDate < new Date()) {
    return { success: false, statusCode: 400, message: "Check-in date cannot be in the past" };
  }

  // Guest count check
  const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
  if (totalGuests > suite.maxGuests) {
    return {
      success: false,
      statusCode: 400,
      message: `This suite accommodates maximum ${suite.maxGuests} guests`,
    };
  }

  // Calculate pricing
  const pricing = calculateBookingPrice({
    pricePerNight: suite.pricePerNight,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    addons: addons || [],
    currency: suite.currency || "USD",
  });

  return {
    success: true,
    data: {
      checkInDate,
      checkOutDate,
      totalGuests,
      pricing,
    },
  };
};

/**
 * Get booking stats for a user
 */
export const getUserBookingStats = async (userId) => {
  const stats = await Booking.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalSpent: { $sum: "$pricing.totalAmount" },
      },
    },
  ]);

  return stats;
};

/**
 * Check if user has an existing booking overlap
 */
export const hasUserBookingConflict = async (userId, suiteId, checkIn, checkOut) => {
  const conflict = await Booking.findOne({
    user: userId,
    suite: suiteId,
    status: { $in: ["pending", "confirmed", "checked_in"] },
    $or: [
      {
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) },
      },
    ],
  });
  return !!conflict;
};
