import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Gallery item title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    category: {
      type: String,
      enum: ["Architecture", "Suites", "Dining", "Wellness", "Experiences", "Nature"],
      default: "Architecture",
    },
    image: {
      url: {
        type: String,
        required: [true, "Image URL is required"],
      },
      alt: {
        type: String,
        default: "",
      },
      width: Number,
      height: Number,
    },
    cloudinaryPublicId: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      maxlength: [500, "Caption cannot exceed 500 characters"],
    },
    isFeatured: {
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

gallerySchema.index({ category: 1, isActive: 1, displayOrder: 1 });
gallerySchema.index({ isFeatured: -1, createdAt: -1 });

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;
