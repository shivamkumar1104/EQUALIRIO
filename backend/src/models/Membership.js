import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    // Linked to a registered user (if any)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tier: {
      type: String,
      enum: ['standard', 'vip', 'elite'],
      default: 'standard',
    },
    preferences: {
      villaReleases: { type: Boolean, default: true },
      diningEvents: { type: Boolean, default: true },
      spaOffers: { type: Boolean, default: true },
      exclusivePackages: { type: Boolean, default: true },
    },
    lastEmailSentAt: {
      type: Date,
      default: null,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Membership = mongoose.model('Membership', membershipSchema);
export default Membership;
