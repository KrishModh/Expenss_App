import { Expense } from "../models/Expense.js";
import { Income } from "../models/Income.js";
import { MonthlyFinanceSummary } from "../models/MonthlyFinanceSummary.js";

export const getCurrentMonthKey = () => {
  const now = new Date();
  return toMonthKey(now);
};

export const toMonthKey = (dateValue) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const compareMonthKeys = (left, right) => left.localeCompare(right);

const addMonths = (monthKey, amount) => {
  const [year, month] = monthKey.split("-").map(Number);
  return toMonthKey(new Date(year, month - 1 + amount, 1));
};

const minMonthKey = (...months) =>
  months.filter(Boolean).sort(compareMonthKeys)[0] || getCurrentMonthKey();

const maxMonthKey = (...months) => {
  const sortedMonths = months.filter(Boolean).sort(compareMonthKeys);
  return sortedMonths[sortedMonths.length - 1] || getCurrentMonthKey();
};

const monthRange = (startMonth, endMonth) => {
  const months = [];
  let current = startMonth;

  while (compareMonthKeys(current, endMonth) <= 0) {
    months.push(current);
    current = addMonths(current, 1);
  }

  return months;
};

const aggregateMonthlyTotals = async (Model, userId, startMonth, endMonth) => {
  const startDate = monthStartDate(startMonth);
  const endDate = monthStartDate(addMonths(endMonth, 1));
  const totals = await Model.aggregate([
    {
      $match: {
        user: userId,
        date: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$date"
          }
        },
        total: { $sum: "$amount" }
      }
    }
  ]);

  return totals.reduce((acc, item) => {
    acc[item._id] = Number(item.total || 0);
    return acc;
  }, {});
};

const findFirstTransactionMonth = async (userId) => {
  const [firstIncome, firstExpense] = await Promise.all([
    Income.findOne({ user: userId }).sort({ date: 1 }).select("date"),
    Expense.findOne({ user: userId }).sort({ date: 1 }).select("date")
  ]);

  return minMonthKey(
    firstIncome ? toMonthKey(firstIncome.date) : "",
    firstExpense ? toMonthKey(firstExpense.date) : ""
  );
};

const findLatestStoredMonth = async (userId) => {
  const summary = await MonthlyFinanceSummary.findOne({ userId }).sort({ month: -1 }).select("month");
  return summary?.month || "";
};

const monthStartDate = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const recalculateMonthlyFinanceSummaries = async (userId, changedMonth = getCurrentMonthKey()) => {
  const currentMonth = getCurrentMonthKey();
  const [firstTransactionMonth, latestStoredMonth] = await Promise.all([
    findFirstTransactionMonth(userId),
    findLatestStoredMonth(userId)
  ]);
  const startMonth = minMonthKey(firstTransactionMonth, changedMonth);
  const endMonth = maxMonthKey(currentMonth, changedMonth, latestStoredMonth);
  const months = monthRange(startMonth, endMonth);
  const [incomeByMonth, expenseByMonth] = await Promise.all([
    aggregateMonthlyTotals(Income, userId, startMonth, endMonth),
    aggregateMonthlyTotals(Expense, userId, startMonth, endMonth)
  ]);

  let openingBalance = 0;
  const summaries = [];

  for (const month of months) {
    const totalIncome = incomeByMonth[month] || 0;
    const totalExpenses = expenseByMonth[month] || 0;
    const closingBalance = openingBalance + totalIncome - totalExpenses;

    summaries.push({
      userId,
      month,
      openingBalance,
      totalIncome,
      totalExpenses,
      closingBalance
    });

    openingBalance = closingBalance;
  }

  if (summaries.length) {
    await MonthlyFinanceSummary.bulkWrite(
      summaries.map((summary) => ({
        updateOne: {
          filter: { userId, month: summary.month },
          update: { $set: summary },
          upsert: true
        }
      }))
    );
  }

  return summaries;
};

export const getCurrentMonthlyFinanceSummary = async (userId) => {
  const currentMonth = getCurrentMonthKey();
  await recalculateMonthlyFinanceSummaries(userId, currentMonth);

  return MonthlyFinanceSummary.findOne({ userId, month: currentMonth });
};
