/**
 * Review Validators — express-validator schemas
 */
import { body, param } from "express-validator";

export const validateCreateReview = [
  body("suiteId")
    .notEmpty().withMessage("Suite ID is required")
    .isMongoId().withMessage("Invalid suite ID format"),

  body("ratings.overall")
    .notEmpty().withMessage("Overall rating is required")
    .isFloat({ min: 1, max: 5 }).withMessage("Overall rating must be between 1 and 5"),

  body("ratings.cleanliness")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Cleanliness rating must be between 1 and 5"),

  body("ratings.service")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Service rating must be between 1 and 5"),

  body("ratings.location")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Location rating must be between 1 and 5"),

  body("ratings.value")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Value rating must be between 1 and 5"),

  body("ratings.amenities")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Amenities rating must be between 1 and 5"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("Review title cannot exceed 100 characters"),

  body("comment")
    .trim()
    .notEmpty().withMessage("Review comment is required")
    .isLength({ min: 20, max: 2000 })
    .withMessage("Comment must be 20–2000 characters"),

  body("guestType")
    .optional()
    .isIn(["solo", "couple", "family", "business", "group"])
    .withMessage("Invalid guest type"),

  body("stayedInMonth")
    .optional()
    .trim()
    .isLength({ max: 30 }).withMessage("Stay month cannot exceed 30 characters"),
];

export const validateUpdateReview = [
  param("id")
    .notEmpty().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),

  body("ratings.overall")
    .optional()
    .isFloat({ min: 1, max: 5 }).withMessage("Overall rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 }).withMessage("Comment must be 20–2000 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
];

export const validateHotelResponse = [
  param("id")
    .notEmpty().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),

  body("message")
    .trim()
    .notEmpty().withMessage("Response message is required")
    .isLength({ min: 10, max: 1000 }).withMessage("Response must be 10–1000 characters"),
];
