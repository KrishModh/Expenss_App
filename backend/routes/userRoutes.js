import express from "express";
import { body } from "express-validator";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadProfileImage } from "../middleware/upload.js";
import { validateRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const userRouter = express.Router();

userRouter.use(asyncHandler(requireAuth));

userRouter.get("/profile", asyncHandler(getProfile));

userRouter.put(
  "/profile",
  uploadProfileImage,
  body("name").optional().trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can use letters, numbers, and underscores"),
  validateRequest,
  asyncHandler(updateProfile)
);
