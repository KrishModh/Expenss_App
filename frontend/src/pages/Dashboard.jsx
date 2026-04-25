import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "../components/MetricCard.jsx";
import TransactionList from "../components/TransactionList.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useBudget } from "../hooks/useBudget.jsx";
import { expenseApi, incomeApi } from "../services/api.js";
import { formatCurrency } from "../utils/currency.js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { budgetAmount, loading: budgetLoading, error: budgetError, loadBudget } = useBudget();
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [expenseData, incomeData] = await Promise.all([expenseApi.list(), incomeApi.list()]);
      setExpenses(expenseData.expenses);
      setIncomes(incomeData.incomes);
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

  const summary = useMemo(() => {
    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      totalBudget: budgetAmount,
      totalIncome,
      totalExpenses,
      remaining: budgetAmount - totalExpenses
    };
  }, [budgetAmount, expenses, incomes]);

  const budgetProgress = useMemo(() => {
    const usedPercent = budgetAmount > 0 ? Math.min((summary.totalExpenses / budgetAmount) * 100, 100) : 0;
    const progressTone = usedPercent > 90 ? "danger" : usedPercent >= 70 ? "warning" : "success";

    return {
      usedPercent,
      progressTone,
      exceeded: budgetAmount > 0 && summary.totalExpenses > budgetAmount
    };
  }, [budgetAmount, summary.totalExpenses]);

  const chartData = useMemo(
    () => [
      { name: "Income", value: summary.totalIncome },
      { name: "Expenses", value: summary.totalExpenses },
      { name: "Remaining", value: Math.max(summary.remaining, 0) }
    ],
    [summary]
  );

  const expenseByCategory = useMemo(() => {
    const groups = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [expenses]);

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
        <MetricCard label="Monthly Budget" value={formatCurrency(summary.totalBudget)} />
        <MetricCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} tone="danger" />
        <MetricCard label="Total Income" value={formatCurrency(summary.totalIncome)} tone="success" />
        <MetricCard label="Remaining Balance" value={formatCurrency(summary.remaining)} tone="accent" />
      </div>

      <article className="panel dashboard-budget-panel">
        <div className="panel-heading">
          <h2>Budget Progress</h2>
          {budgetLoading ? <span>Loading...</span> : budgetAmount <= 0 && <span>No budget set for this month</span>}
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
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <div className="panel-heading">
            <h2>Expense Split</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={96} label>
                {expenseByCategory.map((entry, index) => (
                  <Cell key={entry.name} fill={["#14b8a6", "#f97316", "#6366f1", "#ef4444", "#22c55e"][index % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
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
