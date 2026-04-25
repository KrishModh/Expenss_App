import express from "express";
import { body, param } from "express-validator";
import {
  checkUsername,
  forgotPassword,
  login,
  me,
  resetPassword,
  signup,
  verifyResetAccount
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = express.Router();

authRouter.get(
  "/check-username/:username",
  param("username").trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  validateRequest,
  asyncHandler(checkUsername)
);

authRouter.post(
  "/signup",
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can use letters, numbers, and underscores"),
  body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
  body("password").isStrongPassword().withMessage("Password must be strong"),
  body("googleCredential").notEmpty().withMessage("Google verification is required"),
  validateRequest,
  asyncHandler(signup)
);

authRouter.post(
  "/login",
  body("username").trim().isLength({ min: 3 }).withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
  asyncHandler(login)
);

authRouter.post(
  "/forgot-password",
  body("username").trim().isLength({ min: 3 }).withMessage("Username is required"),
  validateRequest,
  asyncHandler(forgotPassword)
);

authRouter.post(
  "/reset-password",
  body("username").trim().isLength({ min: 3 }).withMessage("Username is required"),
  body("googleCredential").notEmpty().withMessage("Google verification is required"),
  body("newPassword").isStrongPassword().withMessage("Password must be strong"),
  validateRequest,
  asyncHandler(resetPassword)
);

authRouter.post(
  "/verify-reset-account",
  body("username").trim().isLength({ min: 3 }).withMessage("Username is required"),
  body("googleCredential").notEmpty().withMessage("Google verification is required"),
  validateRequest,
  asyncHandler(verifyResetAccount)
);

authRouter.get("/me", asyncHandler(requireAuth), asyncHandler(me));
