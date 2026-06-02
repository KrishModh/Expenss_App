import { Budget } from "../models/Budget.js";
import { Expense } from "../models/Expense.js";
import { calendarMonthFilter, getCurrentMonthKey } from "../utils/month.js";

const buildBudgetSnapshot = async (userId, month) => {
  const [budget, expenseTotals] = await Promise.all([
    Budget.findOne({ userId, month }),
    Expense.aggregate([
      {
        $match: {
          user: userId,
          ...calendarMonthFilter(month)
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ])
  ]);

  const budgetAmount = Number(budget?.budgetAmount || 0);
  const expenses = Number(expenseTotals[0]?.total || 0);

  return {
    month,
    budget: budgetAmount,
    expenses,
    remaining: budgetAmount - expenses,
    hasBudget: Boolean(budget)
  };
};

export const getBudget = async (req, res) => {
  const month = req.query.month || getCurrentMonthKey();
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
  const month = req.body.month || getCurrentMonthKey();
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

export const getCurrentBudget = async (req, res) => {
  const month = getCurrentMonthKey();
  const snapshot = await buildBudgetSnapshot(req.user._id, month);
  res.json(snapshot);
};
