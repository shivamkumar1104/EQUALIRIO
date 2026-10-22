import Booking from "../models/Booking.js";
import Suite from "../models/Suite.js";
import generateBookingId from "../utils/generateBookingId.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Protected (authenticated users)
 */
export const createBooking = async (req, res) => {
  try {
    const {
      suiteId,
      checkIn,
      checkOut,
      guests,
      addons = [],
      specialRequests,
      guestInfo,
    } = req.body;

    // Validate suite exists and is available
    const suite = await Suite.findById(suiteId);
    if (!suite) return sendError(res, 404, "Suite not found");
    if (!suite.isAvailable) {
      return sendError(res, 400, "This suite is currently unavailable for booking");
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return sendError(res, 400, "Check-out date must be after check-in date");
    }
    if (checkInDate < new Date()) {
      return sendError(res, 400, "Check-in date cannot be in the past");
    }

    // Check guest count against suite max
    const totalGuests = (guests?.adults || 1) + (guests?.children || 0);
    if (totalGuests > suite.maxGuests) {
      return sendError(
        res,
        400,
        `This suite accommodates a maximum of ${suite.maxGuests} guests`
      );
    }

    // Check for date conflicts
    const conflict = await Booking.findOne({
      suite: suite._id,
      status: { $in: ["pending", "confirmed", "checked_in"] },
      $or: [{ checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } }],
    });

    if (conflict) {
      return sendError(
        res,
        409,
        "This suite is already booked for the selected dates. Please choose different dates."
      );
    }

    // Calculate pricing
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const nightlyRate = suite.pricePerNight;
    const addonsTotal = addons.reduce(
      (sum, addon) => sum + addon.price * (addon.quantity || 1),
      0
    );
    const subtotal = nightlyRate * nights + addonsTotal;
    const taxRate = 0.12;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    // Create booking
    const booking = await Booking.create({
      bookingId: generateBookingId(),
      user: req.user._id,
      suite: suite._id,
      suiteSnapshot: {
        name: suite.name,
        category: suite.category,
        pricePerNight: suite.pricePerNight,
        image: suite.primaryImage?.url || "",
      },
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: {
        adults: guests?.adults || 1,
        children: guests?.children || 0,
      },
      addons,
      specialRequests,
      guestInfo,
      pricing: {
        nightlyRate,
        numberOfNights: nights,
        addonsTotal,
        taxRate,
        taxAmount,
        totalAmount,
        currency: suite.currency || "USD",
      },
      status: "pending",
      source: "website",
    });

    const populated = await Booking.findById(booking._id).populate(
      "suite",
      "name category images"
    );

    return sendSuccess(res, 201, "Booking created successfully", { booking: populated });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("createBooking error:", error);
    return sendError(res, 500, "Failed to create booking");
  }
};

/**
 * @desc    Get current user's bookings
 * @route   GET /api/bookings/my
 * @access  Protected
 */
export const getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {
      $or: [
        { user: req.user._id },
        ...(req.user.email ? [{ "guestInfo.email": { $regex: new RegExp(`^${req.user.email}$`, "i") } }] : []),
      ],
    };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate("suite", "name category images pricePerNight")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-internalNotes");

    return sendSuccess(res, 200, "Your bookings retrieved", {
      bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return sendError(res, 500, "Failed to retrieve your bookings");
  }
};

/**
 * @desc    Get single booking by bookingId (public reference) or MongoDB _id
 * @route   GET /api/bookings/:id
 * @access  Protected (owner or admin)
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { bookingId: id };

    const booking = await Booking.findOne(query)
      .populate("suite", "name category images amenities")
      .populate("user", "firstName lastName email");

    if (!booking) return sendError(res, 404, "Booking not found");

    // Only owner or admin can view
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "You do not have permission to view this booking");
    }

    return sendSuccess(res, 200, "Booking retrieved", { booking });
  } catch (error) {
    console.error("getBookingById error:", error);
    return sendError(res, 500, "Failed to retrieve booking");
  }
};

/**
 * @desc    Cancel a booking
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Protected (owner or admin)
 */
export const cancelBooking = async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { bookingId: req.params.id };
    const booking = await Booking.findOne(query).populate("user");

    if (!booking) return sendError(res, 404, "Booking not found");

    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "You do not have permission to cancel this booking");
    }

    if (["cancelled", "checked_out", "no_show"].includes(booking.status)) {
      return sendError(res, 400, `Booking cannot be cancelled (current status: ${booking.status})`);
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || "Cancelled by guest";
    await booking.save();

    return sendSuccess(res, 200, "Booking cancelled successfully", { booking });
  } catch (error) {
    console.error("cancelBooking error:", error);
    return sendError(res, 500, "Failed to cancel booking");
  }
};

/**
 * @desc    Admin: Get all bookings
 * @route   GET /api/bookings
 * @access  Admin
 */
export const getAllBookings = async (req, res) => {
  try {
    const {
      status,
      suite,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (suite) filter.suite = suite;
    if (startDate || endDate) {
      filter.checkIn = {};
      if (startDate) filter.checkIn.$gte = new Date(startDate);
      if (endDate) filter.checkIn.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(filter);

    const bookings = await Booking.find(filter)
      .populate("user", "firstName lastName email")
      .populate("suite", "name category pricePerNight")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Revenue summary
    const revenue = await Booking.aggregate([
      { $match: { ...filter, status: { $in: ["confirmed", "checked_in", "checked_out"] } } },
      { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
    ]);

    return sendSuccess(res, 200, "All bookings retrieved", {
      bookings,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
      revenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    console.error("getAllBookings error:", error);
    return sendError(res, 500, "Failed to retrieve bookings");
  }
};

/**
 * @desc    Admin: Update booking status
 * @route   PATCH /api/bookings/:id/status
 * @access  Admin
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

    if (!validStatuses.includes(status)) {
      return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { bookingId: req.params.id };

    const booking = await Booking.findOneAndUpdate(
      query,
      {
        status,
        ...(status === "confirmed" ? { confirmedAt: new Date() } : {}),
        ...(status === "checked_in" ? { checkedInAt: new Date() } : {}),
        ...(status === "checked_out" ? { checkedOutAt: new Date() } : {}),
        ...(status === "cancelled" ? { cancelledAt: new Date() } : {}),
        ...(notes ? { internalNotes: notes } : {}),
      },
      { new: true, runValidators: true }
    ).populate("user", "firstName lastName email");

    if (!booking) return sendError(res, 404, "Booking not found");

    return sendSuccess(res, 200, `Booking status updated to '${status}'`, { booking });
  } catch (error) {
    console.error("updateBookingStatus error:", error);
    return sendError(res, 500, "Failed to update booking status");
  }
};
