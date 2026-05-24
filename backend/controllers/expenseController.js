import { Expense } from "../models/Expense.js";

const paymentMethods = ["Cash", "Card", "UPI", "Online"];
const defaultCategories = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Other"];
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  return {
    month: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    startDate: new Date(year, monthIndex, 1),
    endDate: new Date(year, monthIndex + 1, 1)
  };
};

const buildExpenseFilters = (query, userId) => {
  const filters = { user: userId };

  if (query.search?.trim()) {
    const searchPattern = new RegExp(escapeRegex(query.search.trim()), "i");
    filters.$or = [
      { title: searchPattern },
      { category: searchPattern },
      { location: searchPattern },
      { paymentMethod: searchPattern }
    ];
  }

  if (query.category) {
    filters.category =
      query.category === "Other"
        ? { $nin: defaultCategories.filter((category) => category !== "Other") }
        : query.category;
  }

  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
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
  const location = payload.location?.trim() || "";

  if (payload.category === "Other") {
    return {
      ...payload,
      location,
      category: customCategory,
      customCategory
    };
  }

  return {
    ...payload,
    location,
    customCategory: ""
  };
};

export const getExpenses = async (req, res) => {
  const filters = buildExpenseFilters(req.query, req.user._id);
  const { month, startDate, endDate } = getCurrentMonthRange();
  const currentMonthFilters = {
    user: req.user._id,
    date: {
      $gte: startDate,
      $lt: endDate
    }
  };
  const [expenses, paymentTotals, currentMonthPaymentTotals] = await Promise.all([
    Expense.find(filters).sort({ date: -1 }),
    Expense.aggregate([
      { $match: filters },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } }
    ]),
    Expense.aggregate([
      { $match: currentMonthFilters },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } }
    ])
  ]);
  const overallSummary = summarizePaymentAggregation(paymentTotals);
  const currentMonthSummary = summarizePaymentAggregation(currentMonthPaymentTotals);

  res.json({
    expenses,
    summary: overallSummary,
    overallSummary,
    currentMonthSummary: {
      total: currentMonthSummary.totalExpense,
      cash: Number(currentMonthSummary.byPaymentMethod.cash || 0),
      card: Number(currentMonthSummary.byPaymentMethod.card || 0),
      upi: Number(currentMonthSummary.byPaymentMethod.upi || 0),
      online: Number(currentMonthSummary.byPaymentMethod.online || 0),
      month
    }
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
