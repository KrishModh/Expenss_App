import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { expenseApi } from "../services/api.js";
import { currencySymbol, formatCurrency, normalizeAmountInput } from "../utils/currency.js";

const categories = ["Food", "Travel", "Shopping", "Bills", "Health", "Education", "Other"];
const methods = ["Cash", "Card", "UPI", "Online"];
const blankExpense = { title: "", amount: "", category: "Food", paymentMethod: "Cash", date: "" };

const Expenses = () => {
  const titleRef = useRef(null);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(blankExpense);
  const [editingId, setEditingId] = useState("");
  const [filters, setFilters] = useState({ category: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");

  const loadExpenses = useCallback(async () => {
    try {
      const data = await expenseApi.list(filters);
      setExpenses(data.expenses);
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const updateForm = useCallback((event) => {
    const { name, value } = event.target;
    const nextValue = name === "amount" ? normalizeAmountInput(value) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  }, []);

  const updateFilter = useCallback((event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(blankExpense);
    setEditingId("");
    titleRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
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
    setEditingId(expense._id);
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
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

  const total = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount), 0), [expenses]);

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
          <div className="table-wrap">
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
