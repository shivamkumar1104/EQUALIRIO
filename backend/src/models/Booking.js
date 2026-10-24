import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    suite: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suite",
      required: false,
    },
    // Snapshot of suite details at time of booking (in case suite prices change later)
    suiteSnapshot: {
      name: String,
      category: String,
      pricePerNight: Number,
      image: String,
    },
    checkIn: {
      type: Date,
      required: [true, "Check-in date is required"],
    },
    checkOut: {
      type: Date,
      required: [true, "Check-out date is required"],
    },
    guests: {
      adults: { type: Number, required: true, min: 1, default: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    // Selected add-ons (helicopter, spa, etc.)
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
      },
    ],
    // Special requests from guest
    specialRequests: {
      type: String,
      maxlength: [1000, "Special requests cannot exceed 1000 characters"],
    },
    // Pricing breakdown
    pricing: {
      nightlyRate: { type: Number, required: true },
      numberOfNights: { type: Number, required: true },
      addonsTotal: { type: Number, default: 0 },
      taxRate: { type: Number, default: 0.12 }, // 12% tax
      taxAmount: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: "USD" },
    },
    // Guest info (could differ from account holder)
    guestInfo: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, trim: true },
      nationality: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "card", "upi", "netbanking", "cash", "bank_transfer", "other"],
      default: "razorpay",
    },
    paymentReference: {
      type: String, // Razorpay/Stripe payment ID
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    // Timestamps for status changes
    confirmedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    checkedInAt: Date,
    checkedOutAt: Date,
    // Source of booking
    source: {
      type: String,
      enum: ["website", "phone", "walk_in", "ota", "admin"],
      default: "website",
    },
    // Admin notes (internal only)
    internalNotes: {
      type: String,
      select: false, // Not returned by default in queries
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: number of nights
bookingSchema.virtual("numberOfNights").get(function () {
  if (!this.checkIn || !this.checkOut) return 0;
  const diff = this.checkOut.getTime() - this.checkIn.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual: guest full name
bookingSchema.virtual("guestFullName").get(function () {
  return `${this.guestInfo?.firstName || ""} ${this.guestInfo?.lastName || ""}`.trim();
});

// Validate check-out is after check-in
bookingSchema.pre("save", function (next) {
  if (this.checkOut <= this.checkIn) {
    return next(new Error("Check-out date must be after check-in date."));
  }
  next();
});

// Indexes for common queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ suite: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ "guestInfo.email": 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
