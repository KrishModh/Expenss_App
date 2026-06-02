import { Income } from "../models/Income.js";
import {
  getCurrentMonthKey,
  recalculateMonthlyFinanceSummaries,
  toMonthKey
} from "../services/monthlyFinanceService.js";
import {
  calendarMonthFilter,
  dateRangeFilter,
  normalizeTransactionDate
} from "../utils/month.js";
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const applyCalendarMonthFilter = (filters, monthKey) => {
  const monthFilter = calendarMonthFilter(monthKey);

  if (filters.$or) {
    filters.$and = [{ $or: filters.$or }, monthFilter];
    delete filters.$or;
    return;
  }

  Object.assign(filters, monthFilter);
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

  if (query.monthKey) {
    applyCalendarMonthFilter(filters, query.monthKey);
  } else if (query.startDate || query.endDate) {
    filters.date = dateRangeFilter(query.startDate, query.endDate);
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
  const month = getCurrentMonthKey();
  const currentMonthFilters = {
    user: req.user._id,
    ...calendarMonthFilter(month)
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
    date: normalizeTransactionDate(req.body.date),
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
  Object.assign(income, {
    ...req.body,
    date: normalizeTransactionDate(req.body.date)
  });
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
