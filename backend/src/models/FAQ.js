import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [300, "Question cannot exceed 300 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      maxlength: [2000, "Answer cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      enum: ["General", "Reservations", "Dining", "Wellness", "Policies", "Transportation"],
      default: "General",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

faqSchema.index({ category: 1, isActive: 1, displayOrder: 1 });

const FAQ = mongoose.model("FAQ", faqSchema);
export default FAQ;
