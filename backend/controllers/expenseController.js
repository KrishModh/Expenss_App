import { Expense } from "../models/Expense.js";

const paymentMethods = ["Cash", "Card", "UPI", "Online"];
const defaultCategories = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Other"];

const buildExpenseFilters = (query, userId) => {
  const filters = { user: userId };

  if (query.category) {
    filters.category =
      query.category === "Other"
        ? { $nin: defaultCategories.filter((category) => category !== "Other") }
        : query.category;
  }

  if (query.startDate || query.endDate) {
    filters.date = {};
    if (query.startDate) filters.date.$gte = new Date(query.startDate);
    if (query.endDate) filters.date.$lte = new Date(query.endDate);
  }

  return filters;
};

const summarizePaymentAggregation = (paymentTotals) => {
  const byPaymentMethod = paymentMethods.reduce((acc, method) => {
    acc[method.toLowerCase()] = 0;
    return acc;
  }, {});

  const totalExpense = paymentTotals.reduce((sum, item) => {
    const amount = Number(item.total) || 0;
    byPaymentMethod[item._id.toLowerCase()] = amount;
    return sum + amount;
  }, 0);

  return { totalExpense, byPaymentMethod };
};

const normalizeExpensePayload = (payload) => {
  const customCategory = payload.customCategory?.trim() || "";

  if (payload.category === "Other") {
    return {
      ...payload,
      category: customCategory,
      customCategory
    };
  }

  return {
    ...payload,
    customCategory: ""
  };
};

export const getExpenses = async (req, res) => {
  const filters = buildExpenseFilters(req.query, req.user._id);
  const [expenses, paymentTotals] = await Promise.all([
    Expense.find(filters).sort({ date: -1 }),
    Expense.aggregate([
      { $match: filters },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } }
    ])
  ]);

  res.json({
    expenses,
    summary: summarizePaymentAggregation(paymentTotals)
  });
};

export const createExpense = async (req, res) => {
  const expense = await Expense.create({
    ...normalizeExpensePayload(req.body),
    user: req.user._id
  });

  res.status(201).json({ expense });
};

export const updateExpense = async (req, res) => {
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    normalizeExpensePayload(req.body),
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
