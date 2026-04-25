import { Expense } from "../models/Expense.js";

const buildExpenseFilters = (query, userId) => {
  const filters = { user: userId };

  if (query.category) {
    filters.category = query.category;
  }

  if (query.startDate || query.endDate) {
    filters.date = {};
    if (query.startDate) filters.date.$gte = new Date(query.startDate);
    if (query.endDate) filters.date.$lte = new Date(query.endDate);
  }

  return filters;
};

export const getExpenses = async (req, res) => {
  const expenses = await Expense.find(buildExpenseFilters(req.query, req.user._id)).sort({ date: -1 });
  res.json({ expenses });
};

export const createExpense = async (req, res) => {
  const expense = await Expense.create({
    ...req.body,
    user: req.user._id
  });

  res.status(201).json({ expense });
};

export const updateExpense = async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  res.json({ expense });
};

export const deleteExpense = async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  res.json({ message: "Expense deleted" });
};
