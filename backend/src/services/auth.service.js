/**
 * Auth Service
 * Business logic for authentication: token management, profile helpers.
 */

import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Generate both access token and attach to response
 */
export const generateAuthResponse = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  // Sanitize user for response (toJSON removes password & __v)
  const safeUser = user.toJSON ? user.toJSON() : user;

  return { token, user: safeUser };
};

/**
 * Verify a JWT token and return decoded payload
 */
export const verifyToken = (token) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Find or create a user from Google OAuth payload
 */
export const findOrCreateGoogleUser = async ({ googleId, email, name, picture }) => {
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    let changed = false;
    if (!user.googleId) { user.googleId = googleId; changed = true; }
    if (!user.avatar && picture) { user.avatar = picture; changed = true; }
    if (changed) await user.save();
  } else {
    user = await User.create({
      name: name || "Guest",
      email: email.toLowerCase(),
      googleId,
      avatar: picture || "",
      authProvider: "google",
      role: "user",
    });
  }

  return user;
};

/**
 * Safely update allowed profile fields
 */
export const applyProfileUpdates = (user, updates) => {
  const allowedFields = ["name", "phone", "avatar"];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  });
  return user;
};
