import mongoose from "mongoose";

const amenitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Amenity title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: true,
      enum: ["Wellness", "Gastronomy", "Services", "Activities", "Facilities"],
      default: "Services",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      default: "sparkles",
    },
    image: {
      type: String,
      default: "",
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

amenitySchema.index({ category: 1, isActive: 1, displayOrder: 1 });

const Amenity = mongoose.model("Amenity", amenitySchema);
export default Amenity;
