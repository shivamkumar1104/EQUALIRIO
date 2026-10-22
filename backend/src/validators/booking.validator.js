/**
 * Booking Validators — express-validator schemas
 */
import { body, param } from "express-validator";

export const validateCreateBooking = [
  body("suiteId")
    .notEmpty().withMessage("Suite ID is required")
    .isMongoId().withMessage("Invalid suite ID format"),

  body("checkIn")
    .notEmpty().withMessage("Check-in date is required")
    .isISO8601().withMessage("Check-in must be a valid date (YYYY-MM-DD)")
    .toDate(),

  body("checkOut")
    .notEmpty().withMessage("Check-out date is required")
    .isISO8601().withMessage("Check-out must be a valid date (YYYY-MM-DD)")
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkIn)) {
        throw new Error("Check-out date must be after check-in date");
      }
      return true;
    }),

  body("guests.adults")
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage("Adults must be between 1 and 10"),

  body("guests.children")
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage("Children must be between 0 and 10"),

  body("guestInfo.firstName")
    .trim()
    .notEmpty().withMessage("Guest first name is required")
    .isLength({ max: 50 }).withMessage("First name cannot exceed 50 characters"),

  body("guestInfo.lastName")
    .trim()
    .notEmpty().withMessage("Guest last name is required")
    .isLength({ max: 50 }).withMessage("Last name cannot exceed 50 characters"),

  body("guestInfo.email")
    .trim()
    .notEmpty().withMessage("Guest email is required")
    .isEmail().withMessage("Guest email must be valid")
    .normalizeEmail(),

  body("guestInfo.phone")
    .optional()
    .trim()
    .isMobilePhone().withMessage("Guest phone must be a valid number"),

  body("specialRequests")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Special requests cannot exceed 1000 characters"),

  body("addons")
    .optional()
    .isArray().withMessage("Addons must be an array"),

  body("addons.*.name")
    .if(body("addons").exists())
    .notEmpty().withMessage("Each addon must have a name"),

  body("addons.*.price")
    .if(body("addons").exists())
    .isNumeric().withMessage("Each addon must have a numeric price")
    .isFloat({ min: 0 }).withMessage("Addon price cannot be negative"),
];

export const validateCancelBooking = [
  param("id")
    .notEmpty().withMessage("Booking ID is required"),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Cancellation reason cannot exceed 500 characters"),
];

export const validateUpdateBookingStatus = [
  param("id")
    .notEmpty().withMessage("Booking ID is required")
    .isMongoId().withMessage("Invalid booking ID format"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"])
    .withMessage("Invalid booking status"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage("Notes cannot exceed 1000 characters"),
];
