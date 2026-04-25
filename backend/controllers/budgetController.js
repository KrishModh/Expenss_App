import { Budget } from "../models/Budget.js";

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const getBudget = async (req, res) => {
  const month = req.query.month || currentMonth();
  const budget = await Budget.findOne({ userId: req.user._id, month });

  res.json({
    budget: budget || {
      userId: req.user._id,
      month,
      budgetAmount: 0
    }
  });
};

export const setBudget = async (req, res) => {
  const month = req.body.month || currentMonth();
  const budgetAmount = Number(req.body.budgetAmount);

  const budget = await Budget.findOneAndUpdate(
    { userId: req.user._id, month },
    { budgetAmount },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({
    message: "Budget updated successfully",
    budget
  });
};
