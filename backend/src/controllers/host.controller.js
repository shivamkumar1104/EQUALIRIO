import HostProfile from "../models/HostProfile.js";
import StayListing from "../models/StayListing.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const createListingSlug = (title) =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90)}-${Date.now().toString(36)}`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isValidPhotoUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const normalizeListingInput = (input) => {
  const allowedFields = [
    "title",
    "description",
    "propertyType",
    "location",
    "capacity",
    "amenities",
    "houseRules",
    "photos",
    "nightlyPriceMinor",
    "currency",
    "minNights",
    "maxNights",
    "bookingMode",
    "checkInAfter",
    "checkOutBefore",
    "cancellationPolicy",
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (input[field] !== undefined) updates[field] = input[field];
  }
  return updates;
};

const validateListingInput = (input) => {
  const errors = [];
  if (input.photos && (!Array.isArray(input.photos) || input.photos.some((photo) => !photo?.url || !isValidPhotoUrl(photo.url)))) {
    errors.push("Every listing photo must have a valid HTTP or HTTPS URL.");
  }
  if (input.location?.coordinates) {
    const { type, coordinates } = input.location;
    if (
      type !== "Point" ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every(Number.isFinite) ||
      coordinates[0] < -180 || coordinates[0] > 180 ||
      coordinates[1] < -90 || coordinates[1] > 90
    ) {
      errors.push("Coordinates must be a GeoJSON Point with [longitude, latitude] values in range.");
    }
  }
  if (input.minNights !== undefined && input.maxNights !== undefined && input.minNights > input.maxNights) {
    errors.push("Minimum nights cannot be greater than maximum nights.");
  }
  return errors;
};

const getApprovedHost = async (userId) =>
  HostProfile.findOne({ user: userId, status: "approved" });

export const applyToHost = async (req, res) => {
  try {
    const body = req.body || {};
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    if (displayName.length < 2 || displayName.length > 80 || bio.length > 1000) {
      return sendError(res, 400, "Display name must be 2-80 characters and bio must be at most 1000 characters.");
    }

    const existingProfile = await HostProfile.findOne({ user: req.user._id });
    const profile = existingProfile
      ? await HostProfile.findOneAndUpdate(
          { _id: existingProfile._id },
          {
            $set: {
              displayName,
              bio,
              ...(existingProfile.status === "rejected" ? { status: "pending", reviewedAt: null, reviewedBy: null } : {}),
            },
            ...(existingProfile.status === "rejected" ? { $unset: { reviewNote: 1 } } : {}),
          },
          { new: true, runValidators: true }
        )
      : await HostProfile.create({ user: req.user._id, displayName, bio });
    return sendSuccess(res, 200, "Host application saved and awaiting review.", { hostProfile: profile });
  } catch (error) {
    console.error("applyToHost error:", error);
    return sendError(res, 500, "Could not save host application.");
  }
};

export const getMyHostProfile = async (req, res) => {
  try {
    const hostProfile = await HostProfile.findOne({ user: req.user._id }).select("+reviewNote");
    return sendSuccess(res, 200, "Host profile retrieved.", { hostProfile });
  } catch (error) {
    console.error("getMyHostProfile error:", error);
    return sendError(res, 500, "Could not retrieve host profile.");
  }
};

export const getMyListings = async (req, res) => {
  try {
    const hostProfile = await HostProfile.findOne({ user: req.user._id });
    if (!hostProfile) return sendError(res, 404, "Submit a host application before managing listings.");

    const listings = await StayListing.find({ host: hostProfile._id })
      .select("+reviewNote +location.address")
      .sort({ updatedAt: -1 });
    return sendSuccess(res, 200, "Your listings retrieved.", { listings });
  } catch (error) {
    console.error("getMyListings error:", error);
    return sendError(res, 500, "Could not retrieve your listings.");
  }
};

export const createMyListing = async (req, res) => {
  try {
    const hostProfile = await getApprovedHost(req.user._id);
    if (!hostProfile) return sendError(res, 403, "An approved host profile is required to create listings.");

    const listingData = normalizeListingInput(req.body || {});
    const inputErrors = validateListingInput(listingData);
    if (inputErrors.length) return sendError(res, 400, "Listing validation failed.", inputErrors);

    const listing = await StayListing.create({
      ...listingData,
      host: hostProfile._id,
      slug: createListingSlug(listingData.title || "stay"),
      status: "draft",
    });
    return sendSuccess(res, 201, "Draft listing created.", { listing });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, 400, "Listing validation failed.", Object.values(error.errors).map((item) => item.message));
    }
    console.error("createMyListing error:", error);
    return sendError(res, 500, "Could not create listing.");
  }
};

export const updateMyListing = async (req, res) => {
  try {
    const hostProfile = await HostProfile.findOne({ user: req.user._id });
    if (!hostProfile) return sendError(res, 404, "Host profile not found.");

    const updates = normalizeListingInput(req.body || {});
    const inputErrors = validateListingInput(updates);
    if (inputErrors.length) return sendError(res, 400, "Listing validation failed.", inputErrors);

    const listing = await StayListing.findOne({ _id: req.params.id, host: hostProfile._id });
    if (!listing) return sendError(res, 404, "Listing not found.");
    if (["pending_review", "published"].includes(listing.status)) {
      return sendError(res, 409, "Take this listing out of review or pause it before editing.");
    }

    Object.assign(listing, updates);
    listing.status = "draft";
    listing.reviewNote = undefined;
    await listing.save();
    return sendSuccess(res, 200, "Draft listing updated.", { listing });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, 400, "Listing validation failed.", Object.values(error.errors).map((item) => item.message));
    }
    console.error("updateMyListing error:", error);
    return sendError(res, 500, "Could not update listing.");
  }
};

export const submitMyListing = async (req, res) => {
  try {
    const hostProfile = await getApprovedHost(req.user._id);
    if (!hostProfile) return sendError(res, 403, "An approved host profile is required.");

    const listing = await StayListing.findOne({ _id: req.params.id, host: hostProfile._id });
    if (!listing) return sendError(res, 404, "Listing not found.");
    if (!["draft", "rejected", "paused"].includes(listing.status)) {
      return sendError(res, 409, "Only draft, rejected, or paused listings can be submitted for review.");
    }
    if (listing.photos.length === 0) {
      return sendError(res, 400, "Add at least one listing photo before submitting for review.");
    }

    listing.status = "pending_review";
    listing.reviewNote = undefined;
    await listing.save();
    return sendSuccess(res, 200, "Listing submitted for admin review.", { listing });
  } catch (error) {
    console.error("submitMyListing error:", error);
    return sendError(res, 500, "Could not submit listing for review.");
  }
};

export const pauseMyListing = async (req, res) => {
  try {
    const hostProfile = await HostProfile.findOne({ user: req.user._id, status: "approved" });
    if (!hostProfile) return sendError(res, 403, "An approved host profile is required.");

    const listing = await StayListing.findOneAndUpdate(
      { _id: req.params.id, host: hostProfile._id, status: "published" },
      { $set: { status: "paused" } },
      { new: true, runValidators: true }
    );
    if (!listing) return sendError(res, 404, "Published listing not found.");

    return sendSuccess(res, 200, "Listing is no longer visible in public search.", { listing });
  } catch (error) {
    console.error("pauseMyListing error:", error);
    return sendError(res, 500, "Could not pause listing.");
  }
};

const sortableFields = new Set(["createdAt", "nightlyPriceMinor", "title"]);

export const searchPublishedListings = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 12;
    if (page < 1 || limit < 1 || limit > 50) {
      return sendError(res, 400, "Page must be positive and limit must be between 1 and 50.");
    }
    const filter = { status: "published" };

    for (const field of ["country", "city", "propertyType"]) {
      if (req.query[field] !== undefined) {
        if (typeof req.query[field] !== "string" || !req.query[field].trim()) {
          return sendError(res, 400, `${field} must be a non-empty string.`);
        }
        filter[field === "propertyType" ? field : `location.${field}`] = field === "propertyType"
          ? req.query[field].trim()
          : { $regex: escapeRegex(req.query[field].trim()), $options: "i" };
      }
    }
    if (req.query.guests !== undefined) {
      const guests = Number(req.query.guests);
      if (!Number.isInteger(guests) || guests < 1 || guests > 100) {
        return sendError(res, 400, "Guests must be an integer between 1 and 100.");
      }
      filter["capacity.guests"] = { $gte: guests };
    }

    const minPrice = req.query.minPriceMinor === undefined ? undefined : Number(req.query.minPriceMinor);
    const maxPrice = req.query.maxPriceMinor === undefined ? undefined : Number(req.query.maxPriceMinor);
    if (
      (minPrice !== undefined && (!Number.isSafeInteger(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isSafeInteger(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
    ) {
      return sendError(res, 400, "Price filters must be non-negative minor-unit amounts with min no greater than max.");
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.nightlyPriceMinor = {};
      if (minPrice !== undefined) filter.nightlyPriceMinor.$gte = minPrice;
      if (maxPrice !== undefined) filter.nightlyPriceMinor.$lte = maxPrice;
    }

    if (req.query.amenity) {
      const amenities = Array.isArray(req.query.amenity) ? req.query.amenity : [req.query.amenity];
      if (amenities.length > 20 || amenities.some((value) => typeof value !== "string" || value.length > 60)) {
        return sendError(res, 400, "Provide at most 20 valid amenity filters.");
      }
      filter.amenities = { $all: amenities };
    }

    const approvedHosts = await HostProfile.find({ status: "approved" }).distinct("_id");
    filter.host = { $in: approvedHosts };

    const sortInput = req.query.sort || "-createdAt";
    const sortField = sortInput.startsWith("-") ? sortInput.slice(1) : sortInput;
    if (!sortableFields.has(sortField)) return sendError(res, 400, "Unsupported sort field.");
    const sort = { [sortField]: sortInput.startsWith("-") ? -1 : 1 };

    const [listings, total] = await Promise.all([
      StayListing.find(filter)
        .select("-location.address -reviewNote")
        .populate("host", "displayName")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      StayListing.countDocuments(filter),
    ]);
    return sendSuccess(res, 200, "Published stays retrieved.", {
      listings,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("searchPublishedListings error:", error);
    return sendError(res, 500, "Could not search stays.");
  }
};

export const getPublishedListing = async (req, res) => {
  try {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
    const listing = await StayListing.findOne({
      status: "published",
      [isObjectId ? "_id" : "slug"]: req.params.id,
    })
      .select("-location.address -reviewNote")
      .populate({ path: "host", match: { status: "approved" }, select: "displayName bio" });
    if (!listing || !listing.host) return sendError(res, 404, "Stay not found.");
    return sendSuccess(res, 200, "Stay retrieved.", { listing });
  } catch (error) {
    console.error("getPublishedListing error:", error);
    return sendError(res, 500, "Could not retrieve stay.");
  }
};

export const reviewHostApplication = async (req, res) => {
  try {
    const { status, reviewNote = "" } = req.body || {};
    if (!["approved", "rejected", "suspended"].includes(status) || typeof reviewNote !== "string" || reviewNote.length > 500) {
      return sendError(res, 400, "Provide an allowed review status and a note of at most 500 characters.");
    }
    const hostProfile = await HostProfile.findByIdAndUpdate(
      req.params.id,
      { status, reviewNote: reviewNote.trim(), reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true, runValidators: true }
    ).select("+reviewNote");
    if (!hostProfile) return sendError(res, 404, "Host application not found.");
    return sendSuccess(res, 200, "Host application reviewed.", { hostProfile });
  } catch (error) {
    console.error("reviewHostApplication error:", error);
    return sendError(res, 500, "Could not review host application.");
  }
};

export const getHostApplicationQueue = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
      return sendError(res, 400, "Unsupported host application status.");
    }
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      return sendError(res, 400, "Page must be positive and limit must be between 1 and 50.");
    }
    const [hostProfiles, total] = await Promise.all([
      HostProfile.find({ status })
        .select("+reviewNote")
        .populate("user", "name email")
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      HostProfile.countDocuments({ status }),
    ]);
    return sendSuccess(res, 200, "Host application queue retrieved.", {
      hostProfiles,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getHostApplicationQueue error:", error);
    return sendError(res, 500, "Could not retrieve host applications.");
  }
};

export const getListingReviewQueue = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
      return sendError(res, 400, "Page must be positive and limit must be between 1 and 50.");
    }
    const [listings, total] = await Promise.all([
      StayListing.find({ status: "pending_review" })
        .select("+reviewNote +location.address")
        .populate({ path: "host", populate: { path: "user", select: "name email" } })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StayListing.countDocuments({ status: "pending_review" }),
    ]);
    return sendSuccess(res, 200, "Listing review queue retrieved.", {
      listings,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getListingReviewQueue error:", error);
    return sendError(res, 500, "Could not retrieve listings awaiting review.");
  }
};

export const reviewStayListing = async (req, res) => {
  try {
    const { status, reviewNote = "" } = req.body || {};
    if (!["published", "rejected"].includes(status) || typeof reviewNote !== "string" || reviewNote.length > 500) {
      return sendError(res, 400, "Provide published or rejected status and a note of at most 500 characters.");
    }
    const pendingListing = await StayListing.findOne({ _id: req.params.id, status: "pending_review" });
    if (!pendingListing) return sendError(res, 404, "Listing awaiting review was not found.");
    const approvedHost = await HostProfile.exists({ _id: pendingListing.host, status: "approved" });
    if (!approvedHost) return sendError(res, 409, "The host must be approved before a listing can be published.");

    const listing = await StayListing.findOneAndUpdate(
      { _id: pendingListing._id, status: "pending_review" },
      {
        status,
        reviewNote: reviewNote.trim(),
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        ...(status === "published" ? { publishedAt: new Date() } : {}),
      },
      { new: true, runValidators: true }
    ).select("+reviewNote +location.address");
    if (!listing) return sendError(res, 404, "Listing awaiting review was not found.");
    return sendSuccess(res, 200, "Listing review completed.", { listing });
  } catch (error) {
    console.error("reviewStayListing error:", error);
    return sendError(res, 500, "Could not review listing.");
  }
};
