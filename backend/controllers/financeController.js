import { getCurrentMonthlyFinanceSummary } from "../services/monthlyFinanceService.js";

export const getCurrentMonthFinance = async (req, res) => {
  const summary = await getCurrentMonthlyFinanceSummary(req.user._id);

  res.json({
    month: summary.month,
    openingBalance: summary.openingBalance,
    totalIncome: summary.totalIncome,
    totalExpenses: summary.totalExpenses,
    closingBalance: summary.closingBalance
  });
};
