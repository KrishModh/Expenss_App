import { Income } from "../models/Income.js";

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 1)
  };
};

const buildIncomeFilters = (query, userId) => {
  const filters = { user: userId };

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

const summarizeIncomes = (incomes, month = "") =>
  incomes.reduce(
    (acc, income) => {
      const amount = Number(income.amount) || 0;
      const method = income.paymentMethod || "Online";

      acc.totalIncome += amount;

      if (method === "Cash") {
        acc.byPaymentMethod.cash += amount;
      } else {
        acc.byPaymentMethod.online += amount;
      }

      return acc;
    },
    {
      totalIncome: 0,
      month,
      byPaymentMethod: {
        cash: 0,
        online: 0
      }
    }
  );

export const getIncomes = async (req, res) => {
  const filteredFilters = buildIncomeFilters(req.query, req.user._id);
  const { month, startDate, endDate } = getCurrentMonthRange();
  const currentMonthFilters = {
    user: req.user._id,
    date: {
      $gte: startDate,
      $lt: endDate
    }
  };
  const [filteredTransactions, currentMonthTransactions] = await Promise.all([
    Income.find(filteredFilters).sort({ date: -1 }),
    Income.find(currentMonthFilters)
  ]);
  const filteredSummary = summarizeIncomes(filteredTransactions);
  const currentMonthSummary = summarizeIncomes(currentMonthTransactions, month);

  res.json({
    incomes: filteredTransactions,
    filteredTransactions,
    filteredSummary: {
      totalIncome: filteredSummary.totalIncome,
      cashIncome: filteredSummary.byPaymentMethod.cash,
      onlineIncome: filteredSummary.byPaymentMethod.online
    },
    currentMonthSummary: {
      totalIncome: currentMonthSummary.totalIncome,
      cashIncome: currentMonthSummary.byPaymentMethod.cash,
      onlineIncome: currentMonthSummary.byPaymentMethod.online,
      month: currentMonthSummary.month
    },
    totalIncome: filteredSummary.totalIncome,
    byPaymentMethod: filteredSummary.byPaymentMethod
  });
};

export const createIncome = async (req, res) => {
  const income = await Income.create({
    ...req.body,
    user: req.user._id
  });

  res.status(201).json({ income });
};

export const updateIncome = async (req, res) => {
  const income = await Income.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }

  res.json({ income });
};

export const deleteIncome = async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }

  res.json({ message: "Income deleted" });
};
