import express from "express";
import { body, query } from "express-validator";
import { createIncome, deleteIncome, getIncomes, updateIncome } from "../controllers/incomeController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const incomeRouter = express.Router();

const incomeValidation = [
  body("source").trim().isLength({ min: 1, max: 100 }).withMessage("Source is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0").toFloat(),
  body("paymentMethod").isIn(["Cash", "Online"]).withMessage("Invalid payment method"),
  body("date").isISO8601().withMessage("Enter a valid date")
];

incomeRouter.use(asyncHandler(requireAuth));

incomeRouter.get(
  "/",
  query("search").optional().trim().isLength({ max: 120 }),
  query("monthKey").optional().matches(/^\d{4}-\d{2}$/).withMessage("Month must be YYYY-MM"),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("paymentMethod").optional().isIn(["Cash", "Online"]),
  validateRequest,
  asyncHandler(getIncomes)
);
incomeRouter.post("/", incomeValidation, validateRequest, asyncHandler(createIncome));
incomeRouter.put("/:id", incomeValidation, validateRequest, asyncHandler(updateIncome));
incomeRouter.delete("/:id", asyncHandler(deleteIncome));
