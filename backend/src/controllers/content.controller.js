import FAQ from "../models/FAQ.js";
import Gallery from "../models/Gallery.js";
import Amenity from "../models/Amenity.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

// ─── FAQs ──────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all active FAQs
 * @route   GET /api/content/faqs
 * @access  Public
 */
export const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const faqs = await FAQ.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("-__v");

    return sendSuccess(res, 200, "FAQs retrieved successfully", { faqs, count: faqs.length });
  } catch (error) {
    console.error("getFAQs error:", error);
    return sendError(res, 500, "Failed to retrieve FAQs");
  }
};

/**
 * @desc    Create FAQ
 * @route   POST /api/content/faqs
 * @access  Admin
 */
export const createFAQ = async (req, res) => {
  try {
    const faq = await FAQ.create(req.body);
    return sendSuccess(res, 201, "FAQ created successfully", { faq });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("createFAQ error:", error);
    return sendError(res, 500, "Failed to create FAQ");
  }
};

/**
 * @desc    Update FAQ
 * @route   PUT /api/content/faqs/:id
 * @access  Admin
 */
export const updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!faq) return sendError(res, 404, "FAQ not found");
    return sendSuccess(res, 200, "FAQ updated successfully", { faq });
  } catch (error) {
    console.error("updateFAQ error:", error);
    return sendError(res, 500, "Failed to update FAQ");
  }
};

/**
 * @desc    Delete FAQ
 * @route   DELETE /api/content/faqs/:id
 * @access  Admin
 */
export const deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return sendError(res, 404, "FAQ not found");
    return sendSuccess(res, 200, "FAQ deleted successfully");
  } catch (error) {
    console.error("deleteFAQ error:", error);
    return sendError(res, 500, "Failed to delete FAQ");
  }
};

// ─── Gallery ───────────────────────────────────────────────────────────────────

/**
 * @desc    Get gallery items
 * @route   GET /api/content/gallery
 * @access  Public
 */
export const getGallery = async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Gallery.countDocuments(filter);
    const items = await Gallery.find(filter)
      .sort({ displayOrder: 1, isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-__v -cloudinaryPublicId");

    return sendSuccess(res, 200, "Gallery retrieved successfully", {
      items,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error("getGallery error:", error);
    return sendError(res, 500, "Failed to retrieve gallery");
  }
};

/**
 * @desc    Create gallery item
 * @route   POST /api/content/gallery
 * @access  Admin
 */
export const createGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.create(req.body);
    return sendSuccess(res, 201, "Gallery item created successfully", { item });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("createGalleryItem error:", error);
    return sendError(res, 500, "Failed to create gallery item");
  }
};

/**
 * @desc    Update gallery item
 * @route   PUT /api/content/gallery/:id
 * @access  Admin
 */
export const updateGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return sendError(res, 404, "Gallery item not found");
    return sendSuccess(res, 200, "Gallery item updated successfully", { item });
  } catch (error) {
    console.error("updateGalleryItem error:", error);
    return sendError(res, 500, "Failed to update gallery item");
  }
};

/**
 * @desc    Delete gallery item
 * @route   DELETE /api/content/gallery/:id
 * @access  Admin
 */
export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) return sendError(res, 404, "Gallery item not found");
    return sendSuccess(res, 200, "Gallery item deleted successfully");
  } catch (error) {
    console.error("deleteGalleryItem error:", error);
    return sendError(res, 500, "Failed to delete gallery item");
  }
};

// ─── Amenities ─────────────────────────────────────────────────────────────────

/**
 * @desc    Get all active amenities
 * @route   GET /api/content/amenities
 * @access  Public
 */
export const getAmenities = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const amenities = await Amenity.find(filter)
      .sort({ displayOrder: 1, isHighlighted: -1 })
      .select("-__v");

    return sendSuccess(res, 200, "Amenities retrieved successfully", {
      amenities,
      count: amenities.length,
    });
  } catch (error) {
    console.error("getAmenities error:", error);
    return sendError(res, 500, "Failed to retrieve amenities");
  }
};

/**
 * @desc    Create amenity
 * @route   POST /api/content/amenities
 * @access  Admin
 */
export const createAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.create(req.body);
    return sendSuccess(res, 201, "Amenity created successfully", { amenity });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return sendError(res, 400, "Validation failed", errors);
    }
    console.error("createAmenity error:", error);
    return sendError(res, 500, "Failed to create amenity");
  }
};

/**
 * @desc    Update amenity
 * @route   PUT /api/content/amenities/:id
 * @access  Admin
 */
export const updateAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!amenity) return sendError(res, 404, "Amenity not found");
    return sendSuccess(res, 200, "Amenity updated successfully", { amenity });
  } catch (error) {
    console.error("updateAmenity error:", error);
    return sendError(res, 500, "Failed to update amenity");
  }
};

/**
 * @desc    Delete amenity
 * @route   DELETE /api/content/amenities/:id
 * @access  Admin
 */
export const deleteAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    if (!amenity) return sendError(res, 404, "Amenity not found");
    return sendSuccess(res, 200, "Amenity deleted successfully");
  } catch (error) {
    console.error("deleteAmenity error:", error);
    return sendError(res, 500, "Failed to delete amenity");
  }
};
