import mongoose from "mongoose";

const diningReservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reservationId: {
      type: String,
      unique: true,
      required: true,
    },
    restaurant: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    guestInfo: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, trim: true },
    },
    date: {
      type: Date,
      required: [true, "Reservation date is required"],
    },
    time: {
      type: String,
      required: [true, "Reservation time is required"],
    },
    guests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "Must have at least 1 guest"],
      max: [20, "Maximum 20 guests per reservation"],
    },
    occasion: {
      type: String,
      enum: ["none", "birthday", "anniversary", "business", "proposal", "other"],
      default: "none",
    },
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"],
      default: "pending",
    },
    tableNumber: String,
    confirmedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

diningReservationSchema.index({ date: 1, restaurant: 1, status: 1 });
diningReservationSchema.index({ "guestInfo.email": 1 });
diningReservationSchema.index({ user: 1, createdAt: -1 });

const DiningReservation = mongoose.model("DiningReservation", diningReservationSchema);
export default DiningReservation;
