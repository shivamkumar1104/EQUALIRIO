import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import Booking from "../models/Booking.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import RegistrationVerification from "../models/RegistrationVerification.js";
import generateToken from "../utils/generateToken.js";
import { sendRegistrationOtpEmail, sendVerificationEmail } from "../services/email.service.js";

const hashRegistrationOtp = (otp) =>
  createHmac("sha256", process.env.JWT_SECRET).update(otp).digest("hex");

const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const requestRegistrationOtp = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.emailVerified
          ? "An account already exists for this email. Please sign in."
          : "This email already has an account awaiting verification. Sign in to request a verification email.",
      });
    }

    const otp = String(randomInt(100000, 1000000));
    const verification = await RegistrationVerification.findOneAndUpdate(
      { email },
      {
        $set: {
          otpHash: hashRegistrationOtp(otp),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
        },
        $unset: {
          registrationTokenHash: 1,
          registrationTokenExpiresAt: 1,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    try {
      await sendRegistrationOtpEmail(email, otp);
    } catch (emailError) {
      await RegistrationVerification.deleteOne({ _id: verification._id });
      console.error("Registration OTP email failed:", emailError.message);
      return res.status(503).json({
        success: false,
        message: "We could not send the verification code. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "A verification code has been sent to your email. It expires in 10 minutes.",
    });
  } catch (error) {
    console.error("Request registration OTP error:", error);
    return res.status(500).json({ success: false, message: "Could not start registration. Please try again." });
  }
};

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

    if (!isValidEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address and 6-digit code." });
    }

    const verification = await RegistrationVerification.findOne({ email });
    if (!verification || verification.expiresAt <= new Date()) {
      return res.status(400).json({ success: false, message: "The code is invalid or expired. Request a new code." });
    }
    if (verification.attempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many incorrect codes. Request a new code." });
    }

    const submittedHash = Buffer.from(hashRegistrationOtp(otp), "hex");
    const expectedHash = Buffer.from(verification.otpHash, "hex");
    if (!timingSafeEqual(submittedHash, expectedHash)) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({
        success: false,
        message: verification.attempts >= 5
          ? "Too many incorrect codes. Request a new code."
          : "That code is incorrect. Please check your email and try again.",
      });
    }

    const registrationToken = randomBytes(32).toString("hex");
    verification.registrationTokenHash = hashVerificationToken(registrationToken);
    verification.registrationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    verification.otpHash = hashRegistrationOtp(randomBytes(32).toString("hex"));
    verification.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await verification.save();

    return res.status(200).json({
      success: true,
      registrationToken,
      message: "Email verified. You can now complete your account details.",
    });
  } catch (error) {
    console.error("Verify registration OTP error:", error);
    return res.status(500).json({ success: false, message: "Could not verify the code. Please try again." });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, registrationToken } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (!normalizedName || !normalizedEmail || typeof password !== "string" || !password || typeof registrationToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "Verify your email before entering your account details.",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (normalizedName.length < 2 || normalizedName.length > 60) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 60 characters." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.emailVerified
          ? "User already exists"
          : "This account still needs email verification. Request a new verification email.",
      });
    }

    const registrationVerification = await RegistrationVerification.findOne({
      email: normalizedEmail,
      registrationTokenHash: hashVerificationToken(registrationToken),
      registrationTokenExpiresAt: { $gt: new Date() },
    });
    if (!registrationVerification) {
      return res.status(403).json({
        success: false,
        message: "Email verification is required or has expired. Please verify your email again.",
      });
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      emailVerified: true,
    });

    await RegistrationVerification.deleteOne({ _id: registrationVerification._id });

    return res.status(201).json({
      success: true,
      message: "Your email is verified and your account has been created.",
      token: generateToken(user._id, user.role),
      user,
    });
  } catch (error) {
    console.error("Register Error:", error);

    const statusCode = error.name === "ValidationError" ? 400 : error.code === 11000 ? 409 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and explicitly select password field
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password matching
    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        verificationRequired: true,
        message: "Verify your email before signing in.",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification link." });
    }

    const user = await User.findOne({
      emailVerificationTokenHash: hashVerificationToken(token),
      emailVerificationExpiresAt: { $gt: new Date() },
      emailVerified: false,
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification link." });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token: generateToken(user._id, user.role),
      user,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ success: false, message: "Could not verify email. Please try again." });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email, authProvider: "local" });
    const message = "If an unverified account exists for that email, a verification link will be sent.";

    if (!user || user.emailVerified) {
      return res.status(200).json({ success: true, message });
    }

    const verificationToken = randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = hashVerificationToken(verificationToken);
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error("Resend verification email failed:", emailError.message);
      return res.status(503).json({
        success: false,
        message: "The verification email could not be sent. Check the Brevo sender configuration and try again.",
      });
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ success: false, message: "Could not resend verification email." });
  }
};

const hashVerificationToken = (token) =>
  createHash("sha256").update(token).digest("hex");

/**
 * Google OAuth Sign-In / Register
 * Public Route: POST /api/auth/google
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential token is required",
      });
    }

    // Verify token with Google TokenInfo API
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!googleRes.ok) {
      const errData = await googleRes.json().catch(() => ({}));
      return res.status(401).json({
        success: false,
        message: errData.error_description || "Invalid Google token",
      });
    }

    const payload = await googleRes.json();

    // Verify Audience matches our Google Client ID (must be in env — no hardcoded fallback)
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (!expectedClientId) {
      return res.status(500).json({ success: false, message: "Google OAuth is not configured on the server." });
    }

    if (payload.aud !== expectedClientId) {
      return res.status(401).json({
        success: false,
        message: "Google token audience mismatch",
      });
    }

    const { sub: googleId, email, email_verified: emailVerified, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account does not provide an email address",
      });
    }

    if (emailVerified !== true && emailVerified !== "true") {
      return res.status(401).json({
        success: false,
        message: "Google account email is not verified",
      });
    }

    // Find or create user
    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Link googleId if not linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      user.emailVerified = true;
      await user.save();
    } else {
      user = await User.create({
        name: name || "Google Guest",
        email: normalizedEmail,
        googleId,
        avatar: picture || "",
        authProvider: "google",
        emailVerified: true,
        role: "user",
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Signed in with Google successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to authenticate with Google",
    });
  }
};

/**
 * Get current logged in user profile
 * Protected route: GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve user profile",
    });
  }
};

/**
 * Update current user profile
 * Protected route: PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};

/**
 * Admin only: Get all users
 * Protected & Authorized: GET /api/auth/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve users",
    });
  }
};

export const getAdminCustomers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const search = typeof req.query.search === "string"
      ? req.query.search.trim().slice(0, 100)
      : "";
    const filter = { role: "user" };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const expression = new RegExp(escapedSearch, "i");
      filter.$or = [
        { name: expression },
        { email: expression },
        { phone: expression },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("name email phone avatar authProvider emailVerified isActive createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const emails = users.map((user) => user.email);
    const userIds = users.map((user) => user._id);
    const [memberships, accountBookings, guestBookings] = await Promise.all([
      Membership.find({ email: { $in: emails } })
        .select("email tier isActive subscribedAt")
        .lean(),
      Booking.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", bookingCount: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { user: null, "guestInfo.email": { $in: emails } } },
        { $group: { _id: { $toLower: "$guestInfo.email" }, bookingCount: { $sum: 1 } } },
      ]),
    ]);

    const membershipsByEmail = new Map(memberships.map((member) => [member.email, member]));
    const bookingCountByUserId = new Map(accountBookings.map((item) => [String(item._id), item.bookingCount]));
    const bookingCountByEmail = new Map(guestBookings.map((item) => [item._id, item.bookingCount]));

    const customers = users.map((user) => {
      const membership = membershipsByEmail.get(user.email);
      return {
        ...user,
        bookingCount:
          (bookingCountByUserId.get(String(user._id)) || 0) +
          (bookingCountByEmail.get(user.email) || 0),
        membership: membership
          ? { tier: membership.tier, isActive: membership.isActive, subscribedAt: membership.subscribedAt }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin customers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer records.",
    });
  }
};

/**
 * Admin only: Dashboard stats
 * Protected & Authorized: GET /api/auth/admin/dashboard
 */
export const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const guestCount = await User.countDocuments({ role: "user" });

    res.status(200).json({
      success: true,
      message: "Welcome to Admin Concierge Portal",
      stats: {
        totalUsers,
        adminCount,
        guestCount,
        timestamp: new Date().toISOString(),
      },
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve admin dashboard",
    });
  }
};