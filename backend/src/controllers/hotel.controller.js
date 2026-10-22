import Hotel from "../models/Hotel.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

/**
 * @desc    Get hotel information (singleton)
 * @route   GET /api/hotel
 * @access  Public
 */
export const getHotelInfo = async (req, res) => {
  try {
    let hotel = await Hotel.findOne({ isActive: true });

    // Auto-seed default hotel info if none exists
    if (!hotel) {
      hotel = await Hotel.create({});
    }

    return sendSuccess(res, 200, "Hotel information retrieved", { hotel });
  } catch (error) {
    console.error("getHotelInfo error:", error);
    return sendError(res, 500, "Failed to retrieve hotel information");
  }
};

/**
 * @desc    Update hotel information
 * @route   PUT /api/hotel
 * @access  Admin
 */
export const updateHotelInfo = async (req, res) => {
  try {
    const allowedFields = [
      "name", "tagline", "subheading", "location", "address",
      "contact", "social", "policies", "stats", "seo",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    let hotel = await Hotel.findOneAndUpdate(
      { isActive: true },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    return sendSuccess(res, 200, "Hotel information updated successfully", { hotel });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("updateHotelInfo error:", error);
    return sendError(res, 500, "Failed to update hotel information");
  }
};
