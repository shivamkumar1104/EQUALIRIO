/**
 * Availability Service
 * Handles suite availability checks and conflict detection.
 */

import Booking from "../models/Booking.js";
import Suite from "../models/Suite.js";

/**
 * Check if a suite is available for given date range
 * @param {string} suiteId - MongoDB ObjectId of the suite
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {{ available: boolean, reason?: string }}
 */
export const isSuiteAvailable = async (suiteId, checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const suite = await Suite.findById(suiteId);
  if (!suite) return { available: false, reason: "Suite not found" };
  if (!suite.isAvailable) return { available: false, reason: "Suite is not currently accepting bookings" };

  const conflict = await Booking.findOne({
    suite: suiteId,
    status: { $in: ["pending", "confirmed", "checked_in"] },
    $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
  });

  if (conflict) {
    return {
      available: false,
      reason: "Suite is already booked for the selected dates",
      conflictDates: {
        checkIn: conflict.checkIn,
        checkOut: conflict.checkOut,
      },
    };
  }

  return { available: true };
};

/**
 * Get all unavailable date ranges for a suite (for calendar blocking)
 * @param {string} suiteId
 * @returns {Array<{ checkIn: Date, checkOut: Date }>}
 */
export const getBlockedDates = async (suiteId) => {
  const bookings = await Booking.find({
    suite: suiteId,
    status: { $in: ["pending", "confirmed", "checked_in"] },
    checkOut: { $gte: new Date() },
  }).select("checkIn checkOut -_id");

  return bookings.map((b) => ({
    checkIn: b.checkIn,
    checkOut: b.checkOut,
  }));
};

/**
 * Get all available suites for given date range
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @param {number} guests
 */
export const getAvailableSuites = async (checkIn, checkOut, guests = 1) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Get suites that have conflicting bookings
  const bookedSuiteIds = await Booking.distinct("suite", {
    status: { $in: ["pending", "confirmed", "checked_in"] },
    $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
  });

  // Return suites not in the conflicting list
  const availableSuites = await Suite.find({
    _id: { $nin: bookedSuiteIds },
    isAvailable: true,
    maxGuests: { $gte: guests },
  }).sort({ isFeatured: -1, pricePerNight: 1 });

  return availableSuites;
};
