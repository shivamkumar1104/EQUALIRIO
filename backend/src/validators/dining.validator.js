/**
 * Dining Reservation Validators — express-validator schemas
 */
import { body, param } from "express-validator";

const VALID_RESTAURANTS = ["Ocean Terrace", "The Forest Table", "Sakura Lounge", "Private Dining"];

const VALID_TIMES = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

export const validateCreateReservation = [
  body("restaurant")
    .trim()
    .notEmpty().withMessage("Restaurant is required")
    .isIn(VALID_RESTAURANTS)
    .withMessage(`Restaurant must be one of: ${VALID_RESTAURANTS.join(", ")}`),

  body("date")
    .notEmpty().withMessage("Reservation date is required")
    .isISO8601().withMessage("Date must be a valid ISO date (YYYY-MM-DD)")
    .toDate()
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Reservation date cannot be in the past");
      }
      return true;
    }),

  body("time")
    .notEmpty().withMessage("Reservation time is required")
    .isIn(VALID_TIMES).withMessage("Please select a valid time slot"),

  body("guests")
    .notEmpty().withMessage("Number of guests is required")
    .isInt({ min: 1, max: 20 }).withMessage("Guests must be between 1 and 20"),

  body("guestInfo.firstName")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ max: 50 }).withMessage("First name cannot exceed 50 characters"),

  body("guestInfo.lastName")
    .trim()
    .notEmpty().withMessage("Last name is required")
    .isLength({ max: 50 }).withMessage("Last name cannot exceed 50 characters"),

  body("guestInfo.email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email address")
    .normalizeEmail(),

  body("guestInfo.phone")
    .optional()
    .trim()
    .isMobilePhone().withMessage("Must be a valid phone number"),

  body("occasion")
    .optional()
    .isIn(["none", "birthday", "anniversary", "business", "proposal", "other"])
    .withMessage("Invalid occasion type"),

  body("specialRequests")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Special requests cannot exceed 500 characters"),
];

export const validateUpdateReservationStatus = [
  param("id")
    .notEmpty().withMessage("Reservation ID is required"),

  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(["pending", "confirmed", "seated", "completed", "cancelled", "no_show"])
    .withMessage("Invalid reservation status"),

  body("tableNumber")
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage("Table number cannot exceed 20 characters"),
];
