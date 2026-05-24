import "../styles/expenses.css";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBudget } from "../hooks/useBudget.jsx";
import { expenseApi } from "../services/api.js";
import { formatMonthLabel } from "../utils/month.js";
import { currencySymbol, formatCurrency, normalizeAmountInput } from "../utils/currency.js";

const categories = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Other"];
const methods = ["Cash", "Card", "UPI", "Online"];
const blankExpense = { title: "", location: "", amount: "", category: "Food", customCategory: "", paymentMethod: "Cash", date: "" };
const currentMonthSummaryDefaults = { total: 0, cash: 0, card: 0, upi: 0, online: 0, month: "" };
const defaultFilters = { search: "", category: "", startDate: "", endDate: "", paymentMethod: "" };

const Expenses = () => {
  const titleRef = useRef(null);
  const {
    month,
    budgetAmount,
    currentMonthExpenses,
    remainingBalance,
    hasBudget,
    loading: budgetLoading,
    error: sharedBudgetError,
    loadBudget,
    setMonthlyBudget
  } = useBudget();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpense: 0, byPaymentMethod: {} });
  const [currentMonthSummary, setCurrentMonthSummary] = useState(currentMonthSummaryDefaults);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [form, setForm] = useState(blankExpense);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    try {
      setError("");
      const data = await expenseApi.list(filters);
      setExpenses(data.expenses);
      setSummary(data.overallSummary || data.summary || { totalExpense: 0, byPaymentMethod: {} });
      setCurrentMonthSummary({
        total: Number(data.currentMonthSummary?.total || 0),
        cash: Number(data.currentMonthSummary?.cash || 0),
        card: Number(data.currentMonthSummary?.card || 0),
        upi: Number(data.currentMonthSummary?.upi || 0),
        online: Number(data.currentMonthSummary?.online || 0),
        month: data.currentMonthSummary?.month || ""
      });
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    setBudgetInput(budgetAmount ? String(budgetAmount) : "");
  }, [budgetAmount]);

  const updateForm = useCallback((event) => {
    const { name, value } = event.target;
    const nextValue = name === "amount" ? normalizeAmountInput(value) : value;
    setForm((current) => ({
      ...current,
      [name]: nextValue,
      ...(name === "category" && value !== "Other" ? { customCategory: "" } : {})
    }));
  }, []);

  const updateFilter = useCallback((event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const updateBudgetInput = useCallback((event) => {
    setBudgetInput(normalizeAmountInput(event.target.value));
  }, []);

  const saveBudget = useCallback(
    async (event) => {
      event.preventDefault();
      setBudgetError("");
      setBudgetMessage("");

      const nextBudget = Number(budgetInput || 0);

      if (Number.isNaN(nextBudget) || nextBudget < 0) {
        setBudgetError("Budget cannot be negative");
        return;
      }

      try {
        const data = await setMonthlyBudget(nextBudget);
        setBudgetInput(data.budget.budgetAmount ? String(data.budget.budgetAmount) : "");
        setBudgetMessage("Budget updated successfully");
      } catch (err) {
        setBudgetError(err.message);
      }
    },
    [budgetInput, setMonthlyBudget]
  );

  const resetForm = useCallback(() => {
    setForm(blankExpense);
    setEditingId("");
    titleRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      if (form.category === "Other" && !form.customCategory.trim()) {
        setError("Please enter category name");
        return;
      }

      try {
        if (editingId) {
          await expenseApi.update(editingId, form);
        } else {
          await expenseApi.create(form);
        }
        resetForm();
        await Promise.all([loadExpenses(), loadBudget()]);
      } catch (err) {
        setError(err.message);
      }
    },
    [editingId, form, loadBudget, loadExpenses, resetForm]
  );

  const editExpense = useCallback((expense) => {
    const isKnownCategory = categories.some((category) => category !== "Other" && category === expense.category);

    setEditingId(expense._id);
    setForm({
      title: expense.title,
      location: expense.location || "",
      amount: expense.amount,
      category: isKnownCategory ? expense.category : "Other",
      customCategory: isKnownCategory ? "" : expense.customCategory || expense.category,
      paymentMethod: expense.paymentMethod,
      date: expense.date.slice(0, 10)
    });
    titleRef.current?.focus();
  }, []);

  const deleteExpense = useCallback(
    async (id) => {
      await expenseApi.remove(id);
      await Promise.all([loadExpenses(), loadBudget()]);
    },
    [loadBudget, loadExpenses]
  );

  const total = useMemo(
    () => summary.totalExpense || expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses, summary.totalExpense]
  );

  const paymentBreakdown = useMemo(
    () =>
      methods.map((method) => {
        const amount = Number(summary.byPaymentMethod?.[method.toLowerCase()] || 0);
        const percentage = total > 0 ? (amount / total) * 100 : 0;

        return { method, amount, percentage };
      }),
    [summary.byPaymentMethod, total]
  );

  const currentMonthCards = useMemo(
    () => [
      { label: "Total Spent", amount: currentMonthSummary.total, percentage: 100 },
      { label: "Cash", amount: currentMonthSummary.cash, percentage: currentMonthSummary.total > 0 ? (currentMonthSummary.cash / currentMonthSummary.total) * 100 : 0 },
      { label: "Card", amount: currentMonthSummary.card, percentage: currentMonthSummary.total > 0 ? (currentMonthSummary.card / currentMonthSummary.total) * 100 : 0 },
      { label: "UPI", amount: currentMonthSummary.upi, percentage: currentMonthSummary.total > 0 ? (currentMonthSummary.upi / currentMonthSummary.total) * 100 : 0 },
      { label: "Online", amount: currentMonthSummary.online, percentage: currentMonthSummary.total > 0 ? (currentMonthSummary.online / currentMonthSummary.total) * 100 : 0 }
    ],
    [currentMonthSummary]
  );

  const budgetStats = useMemo(() => {
    const usedPercent = budgetAmount > 0 ? Math.min((currentMonthExpenses / budgetAmount) * 100, 100) : 0;
    const progressTone = usedPercent > 90 ? "danger" : usedPercent >= 70 ? "warning" : "success";

    return {
      remaining: remainingBalance,
      usedPercent,
      progressTone,
      exceeded: budgetAmount > 0 && currentMonthExpenses > budgetAmount
    };
  }, [budgetAmount, currentMonthExpenses, remainingBalance]);

  const monthLabel = useMemo(() => formatMonthLabel(month), [month]);
  const expenseMonthLabel = useMemo(() => formatMonthLabel(currentMonthSummary.month), [currentMonthSummary.month]);
  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const exportCsv = useCallback(() => {
    const header = ["Title", "Amount", "Category", "Payment Method", "Location", "Date"];
    const rows = expenses.map((item) => [
      item.title,
      item.amount,
      item.category,
      item.paymentMethod,
      item.location || "",
      new Date(item.date).toISOString().slice(0, 10)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [expenses]);

  return (
    <section className="page-stack expenses-page">
      <div className="page-title">
        <div>
          <p>Expenses</p>
          <h1>{formatCurrency(total)} spent</h1>
        </div>
        <button className="ghost-button" onClick={exportCsv}>
          <Download size={17} />
          Export CSV
        </button>
      </div>

      <section className="expense-summary-grid">
        <article className="panel expense-total-card">
          <span>Total Spent</span>
          <strong>{formatCurrency(total)}</strong>
        </article>
        {paymentBreakdown.map((item) => (
          <article className="panel payment-card" key={item.method}>
            <div className="payment-card-top">
              <span>{item.method}</span>
              <strong>{formatCurrency(item.amount)}</strong>
            </div>
            <div className="payment-progress" aria-label={`${item.method} ${item.percentage.toFixed(0)} percent`}>
              <span style={{ width: `${item.percentage}%` }} />
            </div>
            <small>{item.percentage.toFixed(1)}%</small>
          </article>
        ))}
      </section>

      <section className="page-stack current-month-expense-section">
        <div className="section-heading">
          <div>
            {/* <p>Current Month Expense Summary</p> */}
            <h2>{expenseMonthLabel ? `${expenseMonthLabel} Summary` : "Auto synced for current month"}</h2>
          </div>
        </div>
        <div className="expense-summary-grid">
          {currentMonthCards.map((item, index) => (
            <article className={`panel ${index === 0 ? "expense-total-card" : "payment-card"}`} key={item.label}>
              {index === 0 ? (
                <>
                  <span>{item.label}</span>
                  <strong>{formatCurrency(item.amount)}</strong>
                </>
              ) : (
                <>
                  <div className="payment-card-top">
                    <span>{item.label}</span>
                    <strong>{formatCurrency(item.amount)}</strong>
                  </div>
                  <div className="payment-progress" aria-label={`${item.label} ${item.percentage.toFixed(0)} percent`}>
                    <span style={{ width: `${item.percentage}%` }} />
                  </div>
                  <small>{item.percentage.toFixed(1)}%</small>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel budget-panel">
        <form className="budget-form" onSubmit={saveBudget}>
          <label>
            <span className="budget-label">Set Monthly Budget</span>
            {monthLabel && <strong className="budget-period">Budget for {monthLabel}</strong>}
            <div className="currency-input">
              <span>{currencySymbol}</span>
              <input
                name="budgetAmount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={budgetInput}
                onChange={updateBudgetInput}
                placeholder="0"
              />
            </div>
          </label>
          <button className="primary-button" disabled={budgetLoading}>
            {budgetLoading ? "Saving..." : hasBudget ? "Update Budget" : "Save Budget"}
          </button>
        </form>

        <div className="budget-metrics">
          <div>
            <span>Budget</span>
            <strong>{formatCurrency(budgetAmount)}</strong>
          </div>
          <div>
            <span>Spent</span>
            <strong>{formatCurrency(currentMonthExpenses)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong className={budgetStats.remaining < 0 ? "amount-out" : "amount-in"}>
              {formatCurrency(budgetStats.remaining)}
            </strong>
          </div>
        </div>

        <div className={`budget-progress ${budgetStats.progressTone}`}>
          <span style={{ width: `${budgetStats.usedPercent}%` }} />
        </div>
        <div className="budget-footer">
          <small>{budgetStats.usedPercent.toFixed(1)}% of budget used</small>
          {budgetStats.exceeded && <strong className="form-error">Budget exceeded</strong>}
          {!hasBudget && !budgetLoading && <strong>No budget set for this month</strong>}
          {budgetMessage && <strong className="ok-text">{budgetMessage}</strong>}
          {(budgetError || sharedBudgetError) && <strong className="form-error">{budgetError || sharedBudgetError}</strong>}
        </div>
      </section>

      <div className="management-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
          </div>
          <label>
            Title
            <input ref={titleRef} autoFocus name="title" value={form.title} onChange={updateForm} required />
          </label>
          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={updateForm}
              maxLength={120}
              placeholder="Ahmedabad, Starbucks, Online Store"
            />
          </label>
          <label>
            Amount
            <div className="currency-input">
              <span>{currencySymbol}</span>
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={updateForm}
                required
              />
            </div>
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={updateForm}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          {form.category === "Other" && (
            <label>
              Enter custom category
              <input
                name="customCategory"
                value={form.customCategory}
                onChange={updateForm}
                required
                maxLength={40}
                placeholder="Category name"
              />
            </label>
          )}
          <label>
            Payment Method
            <select name="paymentMethod" value={form.paymentMethod} onChange={updateForm}>
              {methods.map((method) => <option key={method}>{method}</option>)}
            </select>
          </label>
          <label>
            Date
            <input name="date" type="date" value={form.date} onChange={updateForm} required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="button-row">
            <button className="primary-button">
              <Plus size={17} />
              {editingId ? "Save" : "Add Expense"}
            </button>
            {editingId && <button type="button" className="ghost-button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        <article className="panel">
          <div className="panel-heading">
            <h2>Expenses history</h2>
          </div>
          <div className="filter-toolbar">
            <div className="search-toolbar">
              <label className="search-field">
                Search expenses
                <input
                  name="search"
                  value={filters.search}
                  onChange={updateFilter}
                  placeholder="Search by title, category, location, or payment method"
                />
              </label>
              <div className="filter-actions">
                <button type="button" className="ghost-button" onClick={clearFilters} disabled={!hasActiveFilters}>
                  Clear All
                </button>
              </div>
            </div>
            <div className="filter-grid">
              <label>
                Category
                <select name="category" value={filters.category} onChange={updateFilter}>
                  <option value="">All</option>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Payment Method
                <select name="paymentMethod" value={filters.paymentMethod} onChange={updateFilter}>
                  <option value="">All</option>
                  {methods.map((method) => <option key={method}>{method}</option>)}
                </select>
              </label>
              <label>
                From
                <input name="startDate" type="date" value={filters.startDate} onChange={updateFilter} />
              </label>
              <label>
                To
                <input name="endDate" type="date" value={filters.endDate} onChange={updateFilter} />
              </label>
            </div>
          </div>
          <div className="table-wrap transaction-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Payment Method</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.title}</td>
                    <td>{formatCurrency(expense.amount)}</td>
                    <td>{expense.category}</td>
                    <td>{expense.paymentMethod}</td>
                    <td>{expense.location || "-"}</td>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="table-actions">
                      <button className="icon-button" onClick={() => editExpense(expense)} aria-label="Edit expense">
                        <Pencil size={16} />
                      </button>
                      <button className="icon-button danger" onClick={() => deleteExpense(expense._id)} aria-label="Delete expense">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Expenses;
