import mongoose from "mongoose";
import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/**
 * @desc    Get all approved reviews for a suite
 * @route   GET /api/reviews/suite/:suiteId
 * @access  Public
 */
export const getSuiteReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { suite: req.params.suiteId, status: "approved" };
    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate("user", "name avatar")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select("-__v");

    // Aggregate rating breakdown
    const ratingStats = await Review.aggregate([
      { $match: { suite: new mongoose.Types.ObjectId(req.params.suiteId), status: "approved" } },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: "$ratings.overall" },
          avgCleanliness: { $avg: "$ratings.cleanliness" },
          avgService: { $avg: "$ratings.service" },
          avgLocation: { $avg: "$ratings.location" },
          avgValue: { $avg: "$ratings.value" },
          avgAmenities: { $avg: "$ratings.amenities" },
          distribution: { $push: "$ratings.overall" },
        },
      },
    ]);

    return sendSuccess(res, 200, "Reviews retrieved successfully", {
      reviews,
      stats: ratingStats[0] || null,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error("getSuiteReviews error:", error);
    return sendError(res, 500, "Failed to retrieve reviews");
  }
};

/**
 * @desc    Get all reviews (paginated, for homepage / global feed)
 * @route   GET /api/reviews
 * @access  Public
 */
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 6, sort = "-createdAt" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { status: "approved" };
    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate("user", "name avatar")
      .populate("suite", "name category")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, 200, "Reviews retrieved", {
      reviews,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error("getAllReviews error:", error);
    return sendError(res, 500, "Failed to retrieve reviews");
  }
};

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Protected
 */
export const createReview = async (req, res) => {
  try {
    const { suiteId, bookingId, ratings, title, comment, guestType, stayedInMonth } = req.body;

    // Check if booking exists and belongs to user (verified stay)
    let isVerifiedStay = false;
    if (bookingId) {
      const booking = await Booking.findOne({
        $or: [{ _id: bookingId }, { bookingId }],
        user: req.user._id,
        suite: suiteId,
        status: "checked_out",
      });
      if (booking) isVerifiedStay = true;
    }

    // Check if user already reviewed this suite
    const existing = await Review.findOne({ user: req.user._id, suite: suiteId });
    if (existing) {
      return sendError(res, 409, "You have already submitted a review for this suite. You can edit your existing review.");
    }

    const review = await Review.create({
      user: req.user._id,
      suite: suiteId,
      booking: bookingId || undefined,
      ratings,
      title,
      comment,
      guestType,
      stayedInMonth,
      isVerifiedStay,
      status: "approved",
    });

    const populated = await Review.findById(review._id).populate("user", "name avatar");

    return sendSuccess(res, 201, "Review submitted successfully", { review: populated });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, "You have already reviewed this suite");
    }
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("createReview error:", error);
    return sendError(res, 500, "Failed to submit review");
  }
};

/**
 * @desc    Update own review
 * @route   PUT /api/reviews/:id
 * @access  Protected (owner only)
 */
export const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, "Review not found");

    if (review.user.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "You can only edit your own reviews");
    }

    const { ratings, title, comment, guestType } = req.body;
    Object.assign(review, { ratings, title, comment, guestType });
    await review.save();

    return sendSuccess(res, 200, "Review updated successfully", { review });
  } catch (error) {
    console.error("updateReview error:", error);
    return sendError(res, 500, "Failed to update review");
  }
};

/**
 * @desc    Delete a review (owner or admin)
 * @route   DELETE /api/reviews/:id
 * @access  Protected
 */
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return sendError(res, 404, "Review not found");

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return sendError(res, 403, "You do not have permission to delete this review");
    }

    await Review.findByIdAndDelete(req.params.id);
    return sendSuccess(res, 200, "Review deleted successfully");
  } catch (error) {
    console.error("deleteReview error:", error);
    return sendError(res, 500, "Failed to delete review");
  }
};

/**
 * @desc    Admin: Add hotel response to a review
 * @route   POST /api/reviews/:id/respond
 * @access  Admin
 */
export const respondToReview = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return sendError(res, 400, "Response message is required");

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      {
        "hotelResponse.message": message,
        "hotelResponse.respondedAt": new Date(),
        "hotelResponse.respondedBy": req.user._id,
      },
      { new: true }
    ).populate("user", "name");

    if (!review) return sendError(res, 404, "Review not found");
    return sendSuccess(res, 200, "Response added successfully", { review });
  } catch (error) {
    console.error("respondToReview error:", error);
    return sendError(res, 500, "Failed to add response");
  }
};
