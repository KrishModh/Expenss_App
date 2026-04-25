import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import MetricCard from "../components/MetricCard.jsx";
import TransactionList from "../components/TransactionList.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { expenseApi, incomeApi } from "../services/api.js";
import { formatCurrency } from "../utils/currency.js";

const Dashboard = () => {
  const { user } = useAuth();
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      totalBudget: totalIncome,
      totalIncome,
      totalExpenses,
      remaining: totalIncome - totalExpenses
    };
  }, [expenses, incomes]);

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
        .slice(0, 6),
    [expenses, incomes]
  );

  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <p>Dashboard</p>
          <h1>Welcome, {user?.username}</h1>
        </div>
        <button className="ghost-button" onClick={loadData}>Refresh</button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="metric-grid">
        <MetricCard label="Total Budget" value={formatCurrency(summary.totalBudget)} />
        <MetricCard label="Total Income" value={formatCurrency(summary.totalIncome)} tone="success" />
        <MetricCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} tone="danger" />
        <MetricCard label="Remaining Balance" value={formatCurrency(summary.remaining)} tone="accent" />
      </div>

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
        </div>
        <TransactionList items={recentTransactions} />
      </article>
    </section>
  );
};

export default Dashboard;
