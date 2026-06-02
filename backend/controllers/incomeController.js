import { Income } from "../models/Income.js";
import {
  recalculateMonthlyFinanceSummaries,
  toMonthKey
} from "../services/monthlyFinanceService.js";
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  if (query.search?.trim()) {
    const searchPattern = new RegExp(escapeRegex(query.search.trim()), "i");
    filters.$or = [
      { source: searchPattern },
      { paymentMethod: searchPattern }
    ];
  }

  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
  }

  if (query.startDate || query.endDate) {
    filters.date = {};
    if (query.startDate) filters.date.$gte = new Date(query.startDate);
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setDate(endDate.getDate() + 1);
      filters.date.$lt = endDate;
    }
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

  await recalculateMonthlyFinanceSummaries(req.user._id, toMonthKey(income.date));

  res.status(201).json({ income });
};

export const updateIncome = async (req, res) => {
  const income = await Income.findOne({ _id: req.params.id, user: req.user._id });

  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }

  const previousMonth = toMonthKey(income.date);
  Object.assign(income, req.body);
  await income.save();

  const nextMonth = toMonthKey(income.date);
  await recalculateMonthlyFinanceSummaries(
    req.user._id,
    previousMonth < nextMonth ? previousMonth : nextMonth
  );

  res.json({ income });
};

export const deleteIncome = async (req, res) => {
  const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }

  await recalculateMonthlyFinanceSummaries(req.user._id, toMonthKey(income.date));

  res.json({ message: "Income deleted" });
};
