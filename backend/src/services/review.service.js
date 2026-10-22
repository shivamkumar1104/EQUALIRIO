/**
 * Review Service
 * Handles suite rating recalculation after review events.
 */

import Review from "../models/Review.js";
import Suite from "../models/Suite.js";

/**
 * Recalculate and update suite's averageRating and totalReviews
 * Called after every review create/update/delete
 */
export const recalcSuiteRating = async (suiteId) => {
  const stats = await Review.aggregate([
    { $match: { suite: suiteId, status: "approved" } },
    {
      $group: {
        _id: "$suite",
        count: { $sum: 1 },
        avg: { $avg: "$ratings.overall" },
      },
    },
  ]);

  const averageRating = stats.length > 0 ? Math.round(stats[0].avg * 10) / 10 : 0;
  const totalReviews = stats.length > 0 ? stats[0].count : 0;

  await Suite.findByIdAndUpdate(suiteId, { averageRating, totalReviews });
  return { averageRating, totalReviews };
};

/**
 * Get rating distribution (1-5 stars) for a suite
 */
export const getRatingDistribution = async (suiteId) => {
  const distribution = await Review.aggregate([
    { $match: { suite: suiteId, status: "approved" } },
    {
      $group: {
        _id: { $round: ["$ratings.overall", 0] },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  // Build { 5: N, 4: N, 3: N, 2: N, 1: N }
  const result = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distribution.forEach((d) => {
    if (d._id >= 1 && d._id <= 5) result[d._id] = d.count;
  });

  return result;
};

/**
 * Check if a user has already reviewed a suite
 */
export const hasUserReviewed = async (userId, suiteId) => {
  const existing = await Review.findOne({ user: userId, suite: suiteId });
  return !!existing;
};
