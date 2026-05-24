import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ""
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    customCategory: {
      type: String,
      trim: true,
      maxlength: 40,
      default: ""
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Card", "UPI", "Online"]
    },
    date: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

export const Expense = mongoose.model("Expense", expenseSchema);
