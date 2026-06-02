import mongoose from "mongoose";

const monthlyFinanceSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0
    },
    totalIncome: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalExpenses: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    closingBalance: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { timestamps: true }
);

monthlyFinanceSummarySchema.index({ userId: 1, month: 1 }, { unique: true });

export const MonthlyFinanceSummary = mongoose.model(
  "MonthlyFinanceSummary",
  monthlyFinanceSummarySchema
);
