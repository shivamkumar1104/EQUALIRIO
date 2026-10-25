import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    suite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suite",
      required: [true, "Review must be associated with a suite"],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Review must be linked to a completed booking"],
    },
    // Rating breakdown
    ratings: {
      overall: {
        type: Number,
        required: [true, "Overall rating is required"],
        min: 1,
        max: 5,
      },
      cleanliness: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title cannot exceed 100 characters"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      minlength: [20, "Review must be at least 20 characters"],
      maxlength: [2000, "Review cannot exceed 2000 characters"],
      trim: true,
    },
    // Guest metadata (anonymized display name support)
    guestType: {
      type: String,
      enum: ["solo", "couple", "family", "business", "group"],
    },
    stayedInMonth: String, // e.g., "October 2026"
    // Status for moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved", // Auto-approve; set to "pending" if you want moderation
    },
    // Hotel response to review
    hotelResponse: {
      message: { type: String, maxlength: 1000 },
      respondedAt: { type: Date },
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
    isVerifiedStay: {
      type: Boolean,
      default: false,
      validate: {
        validator(value) {
          return value === true && Boolean(this.booking);
        },
        message: "Only a verified completed stay can be reviewed",
      },
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// A guest can review each completed booking once, including repeat stays at a suite.
reviewSchema.index({ booking: 1 }, { unique: true, sparse: true });
reviewSchema.index({ suite: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Static method to recalculate suite average rating after review save
reviewSchema.statics.calcAverageRatings = async function (suiteId) {
  const stats = await this.aggregate([
    { $match: { suite: suiteId, status: "approved", isVerifiedStay: true, booking: { $exists: true } } },
    {
      $group: {
        _id: "$suite",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$ratings.overall" },
      },
    },
  ]);

  const Suite = mongoose.model("Suite");
  await Suite.findByIdAndUpdate(suiteId, {
    averageRating: stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0,
    totalReviews: stats[0]?.nRating || 0,
  });
};

// Recalculate ratings after save
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.suite);
});

// Recalculate ratings after delete
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.suite);
  }
});

const Review = mongoose.model("Review", reviewSchema);
export default Review;
