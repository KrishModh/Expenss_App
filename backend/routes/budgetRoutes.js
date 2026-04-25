import express from "express";
import { body, query } from "express-validator";
import { getBudget, setBudget } from "../controllers/budgetController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const budgetRouter = express.Router();

budgetRouter.use(asyncHandler(requireAuth));

budgetRouter.get(
  "/",
  query("month").optional().matches(/^\d{4}-\d{2}$/).withMessage("Month must be YYYY-MM"),
  validateRequest,
  asyncHandler(getBudget)
);

budgetRouter.post(
  "/set",
  body("month").optional().matches(/^\d{4}-\d{2}$/).withMessage("Month must be YYYY-MM"),
  body("budgetAmount").isFloat({ min: 0 }).withMessage("Budget cannot be negative").toFloat(),
  validateRequest,
  asyncHandler(setBudget)
);
