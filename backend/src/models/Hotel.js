import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
      default: "EQUALIRIO",
    },
    tagline: {
      type: String,
      default: "Where Nature Meets Modern Equilibrium",
    },
    subheading: {
      type: String,
      default: "An exclusive luxury eco-sanctuary nestled where lush emerald rainforest meets crystal waters.",
    },
    location: {
      type: String,
      default: "Rio Sanctuary Bay, Private Coastline",
    },
    address: {
      type: String,
      default: "100 Serenity Boulevard, Rio Bay, Paradise Coast",
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "concierge@equalirio-resort.com" },
      whatsapp: { type: String, default: "" },
    },
    social: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    policies: {
      checkInTime: { type: String, default: "15:00" },
      checkOutTime: { type: String, default: "12:00" },
      cancellationPolicy: {
        type: String,
        default: "Free cancellation up to 48 hours before check-in.",
      },
      petPolicy: {
        type: String,
        default: "Pets are not permitted on the property.",
      },
      smokingPolicy: {
        type: String,
        default: "The entire property is smoke-free.",
      },
      minimumAge: { type: Number, default: 18 },
    },
    stats: {
      rating: { type: Number, default: 4.98 },
      reviewCount: { type: Number, default: 342 },
      totalSuites: { type: Number, default: 18 },
      yearsOfExcellence: { type: Number, default: 12 },
    },
    seo: {
      metaTitle: { type: String, default: "EQUALIRIO Luxury Resort — Where Nature Meets Equilibrium" },
      metaDescription: {
        type: String,
        default: "Experience unrivalled luxury at EQUALIRIO, an exclusive eco-resort with private villas, Michelin-starred dining and world-class spa.",
      },
      keywords: [{ type: String }],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Hotel = mongoose.model("Hotel", hotelSchema);
export default Hotel;