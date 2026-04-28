import { Income } from "../models/Income.js";

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

const summarizeIncomes = (incomes) =>
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
      byPaymentMethod: {
        cash: 0,
        online: 0
      }
    }
  );

export const getIncomes = async (req, res) => {
  const incomes = await Income.find(buildIncomeFilters(req.query, req.user._id)).sort({ date: -1 });
  const summary = summarizeIncomes(incomes);

  res.json({
    incomes,
    filteredTransactions: incomes,
    ...summary
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
