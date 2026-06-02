import { Expense } from "../models/Expense.js";
import { Income } from "../models/Income.js";
import { MonthlyFinanceSummary } from "../models/MonthlyFinanceSummary.js";
import {
  addMonths,
  getCurrentMonthKey,
  monthRange,
  monthStartDate,
  toMonthKey
} from "../utils/month.js";

export { getCurrentMonthKey, toMonthKey };

const compareMonthKeys = (left, right) => left.localeCompare(right);

const minMonthKey = (...months) =>
  months.filter(Boolean).sort(compareMonthKeys)[0] || getCurrentMonthKey();

const maxMonthKey = (...months) => {
  const sortedMonths = months.filter(Boolean).sort(compareMonthKeys);
  return sortedMonths[sortedMonths.length - 1] || getCurrentMonthKey();
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
        _id: { $ifNull: ["$monthKey", { $dateToString: { format: "%Y-%m", date: "$date" } }] },
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
