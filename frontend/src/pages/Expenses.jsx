import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBudget } from "../hooks/useBudget.jsx";
import { expenseApi } from "../services/api.js";
import { currencySymbol, formatCurrency, normalizeAmountInput } from "../utils/currency.js";

const categories = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Other"];
const methods = ["Cash", "Card", "UPI", "Online"];
const blankExpense = { title: "", amount: "", category: "Food", customCategory: "", paymentMethod: "Cash", date: "" };

const Expenses = () => {
  const titleRef = useRef(null);
  const { budgetAmount, loading: budgetLoading, error: sharedBudgetError, setMonthlyBudget } = useBudget();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalExpense: 0, byPaymentMethod: {} });
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [form, setForm] = useState(blankExpense);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    try {
      const data = await expenseApi.list(filters);
      setExpenses(data.expenses);
      setSummary(data.summary || { totalExpense: 0, byPaymentMethod: {} });
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
        loadExpenses();
      } catch (err) {
        setError(err.message);
      }
    },
    [editingId, form, loadExpenses, resetForm]
  );

  const editExpense = useCallback((expense) => {
    const isKnownCategory = categories.some((category) => category !== "Other" && category === expense.category);

    setEditingId(expense._id);
    setForm({
      title: expense.title,
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
      loadExpenses();
    },
    [loadExpenses]
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

  const budgetStats = useMemo(() => {
    const remaining = budgetAmount - total;
    const usedPercent = budgetAmount > 0 ? Math.min((total / budgetAmount) * 100, 100) : 0;
    const progressTone = usedPercent > 90 ? "danger" : usedPercent >= 70 ? "warning" : "success";

    return {
      remaining,
      usedPercent,
      progressTone,
      exceeded: budgetAmount > 0 && total > budgetAmount
    };
  }, [budgetAmount, total]);

  const exportCsv = useCallback(() => {
    const header = ["Title", "Amount", "Category", "Payment Method", "Date"];
    const rows = expenses.map((item) => [
      item.title,
      item.amount,
      item.category,
      item.paymentMethod,
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
    <section className="page-stack">
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

      <section className="panel budget-panel">
        <form className="budget-form" onSubmit={saveBudget}>
          <label>
            Set Monthly Budget
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
            {budgetLoading ? "Saving..." : budgetAmount > 0 ? "Update Budget" : "Save Budget"}
          </button>
        </form>

        <div className="budget-metrics">
          <div>
            <span>Budget</span>
            <strong>{formatCurrency(budgetAmount)}</strong>
          </div>
          <div>
            <span>Spent</span>
            <strong>{formatCurrency(total)}</strong>
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
            <h2>Filters</h2>
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
              From
              <input name="startDate" type="date" value={filters.startDate} onChange={updateFilter} />
            </label>
            <label>
              To
              <input name="endDate" type="date" value={filters.endDate} onChange={updateFilter} />
            </label>
          </div>
          <div className="table-wrap transaction-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Category</th>
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
