import mongoose from "mongoose";

const stayListingSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostProfile",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      maxlength: 120,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 30,
      maxlength: 5000,
    },
    propertyType: {
      type: String,
      enum: ["house", "apartment", "villa", "cabin", "guesthouse", "hotel", "other"],
      required: true,
    },
    location: {
      country: { type: String, required: true, trim: true, maxlength: 80 },
      region: { type: String, trim: true, maxlength: 100, default: "" },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      publicArea: { type: String, trim: true, maxlength: 200, default: "" },
      address: { type: String, trim: true, maxlength: 300, select: false },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: undefined,
        },
        coordinates: {
          type: [Number],
          default: undefined,
        },
      },
    },
    capacity: {
      guests: { type: Number, required: true, min: 1, max: 100 },
      bedrooms: { type: Number, required: true, min: 0, max: 100 },
      beds: { type: Number, required: true, min: 1, max: 200 },
      bathrooms: { type: Number, required: true, min: 1, max: 100 },
    },
    amenities: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
      validate: [(items) => items.length <= 50, "A listing can have at most 50 amenities."],
    },
    houseRules: {
      type: [{ type: String, trim: true, maxlength: 300 }],
      default: [],
      validate: [(items) => items.length <= 30, "A listing can have at most 30 house rules."],
    },
    photos: {
      type: [{
        url: { type: String, required: true, trim: true, maxlength: 2048 },
        alt: { type: String, trim: true, maxlength: 200, default: "" },
        isCover: { type: Boolean, default: false },
      }],
      default: [],
      validate: [(items) => items.length <= 30, "A listing can have at most 30 photos."],
    },
    nightlyPriceMinor: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
      default: "USD",
    },
    minNights: { type: Number, min: 1, max: 365, default: 1 },
    maxNights: { type: Number, min: 1, max: 365, default: 30 },
    bookingMode: {
      type: String,
      enum: ["request", "instant"],
      default: "request",
    },
    checkInAfter: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      default: "15:00",
    },
    checkOutBefore: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
      default: "11:00",
    },
    cancellationPolicy: {
      type: String,
      enum: ["flexible", "moderate", "strict"],
      default: "moderate",
    },
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "paused", "rejected"],
      default: "draft",
      index: true,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
      select: false,
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    publishedAt: Date,
  },
  { timestamps: true }
);

stayListingSchema.index({ status: 1, "location.country": 1, "location.city": 1 });
stayListingSchema.index({ status: 1, "capacity.guests": 1, nightlyPriceMinor: 1 });
stayListingSchema.index({ "location.coordinates": "2dsphere" });

const StayListing = mongoose.model("StayListing", stayListingSchema);
export default StayListing;
