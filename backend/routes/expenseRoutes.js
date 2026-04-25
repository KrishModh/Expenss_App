import express from "express";
import { body, query } from "express-validator";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense
} from "../controllers/expenseController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const expenseRouter = express.Router();

const expenseValidation = [
  body("title").trim().isLength({ min: 1, max: 120 }).withMessage("Title is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0").toFloat(),
  body("category").trim().isLength({ min: 1, max: 40 }).withMessage("Category is required"),
  body("customCategory")
    .if(body("category").equals("Other"))
    .trim()
    .notEmpty()
    .withMessage("Please enter category name")
    .isLength({ max: 40 })
    .withMessage("Custom category must be 40 characters or fewer"),
  body("customCategory").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
  body("paymentMethod").isIn(["Cash", "Card", "UPI", "Online"]).withMessage("Invalid payment method"),
  body("date").isISO8601().toDate().withMessage("Enter a valid date")
];

expenseRouter.use(asyncHandler(requireAuth));

expenseRouter.get(
  "/",
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  validateRequest,
  asyncHandler(getExpenses)
);

expenseRouter.post("/", expenseValidation, validateRequest, asyncHandler(createExpense));
expenseRouter.put("/:id", expenseValidation, validateRequest, asyncHandler(updateExpense));
expenseRouter.delete("/:id", asyncHandler(deleteExpense));
