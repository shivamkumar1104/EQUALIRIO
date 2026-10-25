import { Router } from "express";
import {
  applyToHost,
  createMyListing,
  getHostApplicationQueue,
  getMyHostProfile,
  getMyListings,
  getListingReviewQueue,
  pauseMyListing,
  reviewHostApplication,
  reviewStayListing,
  submitMyListing,
  updateMyListing,
} from "../controllers/host.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);
router.post("/apply", applyToHost);
router.get("/me", getMyHostProfile);
router.get("/me/listings", getMyListings);
router.post("/me/listings", createMyListing);
router.put("/me/listings/:id", updateMyListing);
router.post("/me/listings/:id/submit", submitMyListing);
router.post("/me/listings/:id/pause", pauseMyListing);
router.get("/admin/applications", authorize("admin"), getHostApplicationQueue);
router.get("/admin/listings/review", authorize("admin"), getListingReviewQueue);
router.patch("/admin/applications/:id", authorize("admin"), reviewHostApplication);
router.patch("/admin/listings/:id/review", authorize("admin"), reviewStayListing);

export default router;
