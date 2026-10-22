import { Router } from "express";
import { getHotelInfo, updateHotelInfo } from "../controllers/hotel.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Public
router.get("/", getHotelInfo);

// Admin only
router.put("/", protect, authorize("admin"), updateHotelInfo);

export default router;
