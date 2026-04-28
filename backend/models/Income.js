import mongoose from "mongoose";

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
    }
  },
  { timestamps: true }
);

incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, paymentMethod: 1 });

export const Income = mongoose.model("Income", incomeSchema);
