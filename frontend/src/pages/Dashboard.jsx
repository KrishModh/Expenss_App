import "../styles/dashboard.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "../components/MetricCard.jsx";
import TransactionList from "../components/TransactionList.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useBudget } from "../hooks/useBudget.jsx";
import { expenseApi, financeApi, incomeApi } from "../services/api.js";
import { formatCurrency } from "../utils/currency.js";
import { formatMonthLabel, getCurrentMonthKey } from "../utils/month.js";

// ✅ Current month ki start aur end date
const getCurrentMonthRange = () => {
  const monthKey = getCurrentMonthKey();
  return {
    monthKey
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    month,
    budgetAmount,
    hasBudget,
    loading: budgetLoading,
    error: budgetError,
    loadBudget
  } = useBudget();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [financeSummary, setFinanceSummary] = useState({
    month: "",
    openingBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    closingBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ Sirf current month ka data fetch hoga
      const { monthKey } = getCurrentMonthRange();
      const [expenseData, incomeData, financeData] = await Promise.all([
        expenseApi.list({ monthKey }),
        incomeApi.list({ monthKey }),
        financeApi.currentMonth()
      ]);
      setExpenses(expenseData.expenses);
      setIncomes(incomeData.incomes);
      setFinanceSummary({
        month: financeData.month || "",
        openingBalance: Number(financeData.openingBalance || 0),
        totalIncome: Number(financeData.totalIncome || 0),
        totalExpenses: Number(financeData.totalExpenses || 0),
        closingBalance: Number(financeData.closingBalance || 0)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(() => {
    loadData();
    loadBudget();
  }, [loadBudget, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const syncDashboardCharts = () => {
      loadData();
      loadBudget();
    };

    window.addEventListener("financial-data-changed", syncDashboardCharts);
    window.addEventListener("focus", syncDashboardCharts);

    return () => {
      window.removeEventListener("financial-data-changed", syncDashboardCharts);
      window.removeEventListener("focus", syncDashboardCharts);
    };
  }, [loadBudget, loadData]);

  const budgetMonthLabel = useMemo(() => formatMonthLabel(month), [month]);
  const financeMonthLabel = useMemo(() => formatMonthLabel(financeSummary.month), [financeSummary.month]);

  const summary = useMemo(
    () => ({
      totalBudget: Number(budgetAmount || 0),
      remainingBudget: Number(budgetAmount || 0) - Number(financeSummary.totalExpenses || 0),
      availableBalance: Number(financeSummary.closingBalance || 0),
      openingBalance: Number(financeSummary.openingBalance || 0),
      totalIncome: Number(financeSummary.totalIncome || 0),
      totalExpenses: Number(financeSummary.totalExpenses || 0),
      closingBalance: Number(financeSummary.closingBalance || 0)
    }),
    [budgetAmount, financeSummary]
  );

  const budgetProgress = useMemo(() => {
    const usedPercent = budgetAmount > 0 ? Math.min((summary.totalExpenses / budgetAmount) * 100, 100) : 0;
    const progressTone = usedPercent > 90 ? "danger" : usedPercent >= 70 ? "warning" : "success";
    return {
      usedPercent,
      progressTone,
      exceeded: budgetAmount > 0 && summary.totalExpenses > budgetAmount
    };
  }, [budgetAmount, summary.totalExpenses]);

  const monthlyChartData = useMemo(
    () => [
      { name: "Income", value: summary.totalIncome },
      { name: "Expenses", value: summary.totalExpenses },
      { name: "Budget", value: summary.totalBudget },
      { name: "Remaining Budget", value: summary.remainingBudget },
      { name: "Available Balance", value: summary.availableBalance }
    ],
    [summary]
  );

  const hasMonthlyChartData = useMemo(
    () => summary.totalIncome > 0 || summary.totalExpenses > 0 || summary.totalBudget > 0,
    [summary.totalBudget, summary.totalExpenses, summary.totalIncome]
  );

  const expenseByCategory = useMemo(() => {
    const groups = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [expenses]);

  const hasExpenseChartData = useMemo(
    () => expenseByCategory.reduce((sum, item) => sum + item.value, 0) > 0,
    [expenseByCategory]
  );

  const recentTransactions = useMemo(
    () =>
      [
        ...expenses.map((item) => ({ ...item, kind: "expense" })),
        ...incomes.map((item) => ({ ...item, kind: "income" }))
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [expenses, incomes]
  );

  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <p>Dashboard</p>
          <h1>Welcome, {user?.username}</h1>
        </div>
        <button className="ghost-button" onClick={refreshDashboard}>Refresh</button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {budgetError && <p className="form-error">{budgetError}</p>}

      <div className="metric-grid">
        <MetricCard label={financeMonthLabel ? `Opening Balance • ${financeMonthLabel}` : "Opening Balance"} value={formatCurrency(summary.openingBalance)} tone={summary.openingBalance < 0 ? "danger" : "accent"} />
        <MetricCard label={financeMonthLabel ? `Income • ${financeMonthLabel}` : "Current Month Income"} value={formatCurrency(summary.totalIncome)} tone="success" />
        <MetricCard label={financeMonthLabel ? `Expenses • ${financeMonthLabel}` : "Current Month Expenses"} value={formatCurrency(summary.totalExpenses)} tone="danger" />
        <MetricCard label={financeMonthLabel ? `Closing Balance • ${financeMonthLabel}` : "Closing Balance"} value={formatCurrency(summary.closingBalance)} tone={summary.closingBalance < 0 ? "danger" : "accent"} />
      </div>

      <article className="panel dashboard-budget-panel">
        <div className="panel-heading">
          <h2>{budgetMonthLabel ? `Budget Progress • ${budgetMonthLabel}` : "Budget Progress"}</h2>
          {budgetLoading ? <span>Loading...</span> : !hasBudget && <span>No budget set for this month</span>}
        </div>
        <div className={`budget-progress ${budgetProgress.progressTone}`}>
          <span style={{ width: `${budgetProgress.usedPercent}%` }} />
        </div>
        <div className="budget-footer">
          <small>{budgetProgress.usedPercent.toFixed(1)}% of budget used</small>
          {budgetProgress.exceeded && <strong className="form-error">Budget exceeded</strong>}
        </div>
      </article>

      <div className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>Monthly Summary</h2>
            {loading && <span>Loading...</span>}
          </div>
          {hasMonthlyChartData ? (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 12, right: 12, left: 0, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={68} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} width={82} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2563eb" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty-state">No data available for current month</div>
          )}
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>Expense Split</h2>
          </div>
          {hasExpenseChartData ? (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius="78%" label>
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={["#14b8a6", "#f97316", "#6366f1", "#ef4444", "#22c55e"][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="chart-empty-state">No expense data available for current month</div>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-heading">
          <h2>Recent Transactions</h2>
          <button className="ghost-button" onClick={() => navigate("/expenses")}>View All</button>
        </div>
        <TransactionList items={recentTransactions} />
      </article>
    </section>
  );
};

export default Dashboard;
