import mongoose from "mongoose";
import { toMonthKey } from "../utils/month.js";

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Online", "UPI", "Bank"],
      default: "Online"
    },
    date: {
      type: Date,
      required: true
    },
    monthKey: {
      type: String,
      match: /^\d{4}-\d{2}$/,
      index: true
    }
  },
  { timestamps: true }
);

incomeSchema.pre("validate", function setMonthKey(next) {
  if (this.date) {
    this.monthKey = toMonthKey(this.date);
  }
  next();
});

incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, monthKey: -1 });
incomeSchema.index({ user: 1, paymentMethod: 1 });

export const Income = mongoose.model("Income", incomeSchema);
