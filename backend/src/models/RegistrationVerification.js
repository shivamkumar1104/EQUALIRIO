import mongoose from "mongoose";

const registrationVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    registrationTokenHash: {
      type: String,
    },
    registrationTokenExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const RegistrationVerification = mongoose.model(
  "RegistrationVerification",
  registrationVerificationSchema
);

export default RegistrationVerification;
