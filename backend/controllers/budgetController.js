import { Budget } from "../models/Budget.js";
import { Expense } from "../models/Expense.js";

const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getMonthRange = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const startDate = new Date(year, monthNumber - 1, 1);
  const endDate = new Date(year, monthNumber, 1);
  return { startDate, endDate };
};

const buildBudgetSnapshot = async (userId, month) => {
  const { startDate, endDate } = getMonthRange(month);
  const [budget, expenseTotals] = await Promise.all([
    Budget.findOne({ userId, month }),
    Expense.aggregate([
      {
        $match: {
          user: userId,
          date: {
            $gte: startDate,
            $lt: endDate
          }
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
  const month = req.query.month || getCurrentMonth();
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
  const month = req.body.month || getCurrentMonth();
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
  const month = getCurrentMonth();
  const snapshot = await buildBudgetSnapshot(req.user._id, month);
  res.json(snapshot);
};
