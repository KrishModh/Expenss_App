import express from "express";
import { getCurrentMonthFinance } from "../controllers/financeController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const financeRouter = express.Router();

financeRouter.use(asyncHandler(requireAuth));
financeRouter.get("/current-month", asyncHandler(getCurrentMonthFinance));
