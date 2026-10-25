import { Router } from "express";
import {
  getPublishedListing,
  searchPublishedListings,
} from "../controllers/host.controller.js";

const router = Router();

router.get("/", searchPublishedListings);
router.get("/:id", getPublishedListing);

export default router;
