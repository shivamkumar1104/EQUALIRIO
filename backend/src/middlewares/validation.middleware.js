/**
 * Validation Middleware
 * Reads express-validator results and returns 422 if any errors found.
 */
import { validationResult } from "express-validator";

/**
 * Run after validator chains. Returns 422 Unprocessable Entity on failure.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatted,
    });
  }

  next();
};
