import { Router } from "express";
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} from "../controllers/content.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// ─── FAQs ──────────────────────────────────────────
router.get("/faqs", getFAQs);
router.post("/faqs", protect, authorize("admin"), createFAQ);
router.put("/faqs/:id", protect, authorize("admin"), updateFAQ);
router.delete("/faqs/:id", protect, authorize("admin"), deleteFAQ);

// ─── Gallery ───────────────────────────────────────
router.get("/gallery", getGallery);
router.post("/gallery", protect, authorize("admin"), createGalleryItem);
router.put("/gallery/:id", protect, authorize("admin"), updateGalleryItem);
router.delete("/gallery/:id", protect, authorize("admin"), deleteGalleryItem);

// ─── Amenities ─────────────────────────────────────
router.get("/amenities", getAmenities);
router.post("/amenities", protect, authorize("admin"), createAmenity);
router.put("/amenities/:id", protect, authorize("admin"), updateAmenity);
router.delete("/amenities/:id", protect, authorize("admin"), deleteAmenity);

export default router;
