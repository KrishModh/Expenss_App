import "../styles/income.css";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { incomeApi } from "../services/api.js";
import { currencySymbol, formatCurrency, normalizeAmountInput } from "../utils/currency.js";
import { formatMonthLabel } from "../utils/month.js";

const paymentMethods = ["Cash", "Online", "UPI", "Bank"];
const blankIncome = { source: "", amount: "", paymentMethod: "Online", date: "" };
const defaultFilters = { search: "", startDate: "", endDate: "", paymentMethod: "" };

const reportFileName = () => {
  const date = new Date();
  const month = date.toLocaleString("en-IN", { month: "long" });
  return `income-report-${month}-${date.getFullYear()}.csv`;
};

const Income = () => {
  const sourceRef = useRef(null);
  const [incomes, setIncomes] = useState([]);
  const [filteredSummary, setFilteredSummary] = useState({ totalIncome: 0, cashIncome: 0, onlineIncome: 0 });
  const [currentMonthSummary, setCurrentMonthSummary] = useState({
    totalIncome: 0,
    cashIncome: 0,
    onlineIncome: 0,
    month: ""
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [form, setForm] = useState(blankIncome);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  const loadIncomes = useCallback(async () => {
    try {
      setError("");
      const data = await incomeApi.list(filters);
      setIncomes(data.filteredTransactions || data.incomes || []);
      setFilteredSummary({
        totalIncome: Number(data.filteredSummary?.totalIncome || data.totalIncome || 0),
        cashIncome: Number(data.filteredSummary?.cashIncome || data.byPaymentMethod?.cash || 0),
        onlineIncome: Number(data.filteredSummary?.onlineIncome || data.byPaymentMethod?.online || 0)
      });
      setCurrentMonthSummary({
        totalIncome: Number(data.currentMonthSummary?.totalIncome || 0),
        cashIncome: Number(data.currentMonthSummary?.cashIncome || 0),
        onlineIncome: Number(data.currentMonthSummary?.onlineIncome || 0),
        month: data.currentMonthSummary?.month || ""
      });
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const updateForm = useCallback((event) => {
    const { name, value } = event.target;
    const nextValue = name === "amount" ? normalizeAmountInput(value) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  }, []);

  const updateFilter = useCallback((event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const resetForm = useCallback(() => {
    setForm(blankIncome);
    setEditingId("");
    sourceRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      try {
        if (editingId) {
          await incomeApi.update(editingId, form);
        } else {
          await incomeApi.create(form);
        }
        resetForm();
        loadIncomes();
      } catch (err) {
        setError(err.message);
      }
    },
    [editingId, form, loadIncomes, resetForm]
  );

  const editIncome = useCallback((income) => {
    setEditingId(income._id);
    setForm({
      source: income.source,
      amount: income.amount,
      paymentMethod: income.paymentMethod || "Online",
      date: income.date.slice(0, 10)
    });
    sourceRef.current?.focus();
  }, []);

  const deleteIncome = useCallback(
    async (id) => {
      await incomeApi.remove(id);
      await loadIncomes();
    },
    [loadIncomes]
  );

  const total = useMemo(() => filteredSummary.totalIncome, [filteredSummary.totalIncome]);

  const overallSummaryCards = useMemo(
    () => [
      { label: "Total Income", value: total },
      { label: "Cash Income", value: filteredSummary.cashIncome },
      { label: "Online Income", value: filteredSummary.onlineIncome }
    ],
    [filteredSummary.cashIncome, filteredSummary.onlineIncome, total]
  );

  const currentMonthCards = useMemo(
    () => [
      { label: "Total Income", value: currentMonthSummary.totalIncome },
      { label: "Cash Income", value: currentMonthSummary.cashIncome },
      { label: "Online Income", value: currentMonthSummary.onlineIncome }
    ],
    [currentMonthSummary.cashIncome, currentMonthSummary.onlineIncome, currentMonthSummary.totalIncome]
  );

  const currentMonthLabel = useMemo(() => formatMonthLabel(currentMonthSummary.month), [currentMonthSummary.month]);
  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const exportCsv = useCallback(() => {
    const header = ["Title", "Amount", "Payment Method", "Date"];
    const rows = incomes.map((item) => [
      item.source,
      item.amount,
      item.paymentMethod || "Online",
      new Date(item.date).toISOString().slice(0, 10)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFileName();
    link.click();
    URL.revokeObjectURL(url);
  }, [incomes]);

  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <p>Income</p>
          <h1>{formatCurrency(total)} received</h1>
        </div>
        <button className="ghost-button" onClick={exportCsv}>
          <Download size={17} />
          Export as CSV
        </button>
      </div>

      <section className="page-stack income-section-block">
        <div className="section-heading">
          <div>
            <p>Overall Summary</p>
            <h2>Income statistics based on current filters</h2>
          </div>
        </div>
        <div className="income-summary-grid">
          {overallSummaryCards.map((item) => (
            <article className="panel income-summary-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{formatCurrency(item.value)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="page-stack income-section-block">
        <div className="section-heading">
          <div>
            {/* <p>Current Month Summary</p> */}
            <h2>{currentMonthLabel ? `${currentMonthLabel} Summary` : "Auto synced to current month"}</h2>
          </div>
        </div>
        <div className="income-summary-grid">
          {currentMonthCards.map((item) => (
            <article className="panel income-summary-card current-month-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{formatCurrency(item.value)}</strong>
            </article>
          ))}
        </div>
      </section>

      <div className="management-grid">
        <form className="panel form-grid" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <h2>{editingId ? "Edit Income" : "Add Income"}</h2>
          </div>
          <label>
            Source
            <input ref={sourceRef} autoFocus name="source" value={form.source} onChange={updateForm} required />
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
            Payment Method
            <select name="paymentMethod" value={form.paymentMethod} onChange={updateForm}>
              {paymentMethods.map((method) => <option key={method}>{method}</option>)}
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
              {editingId ? "Save" : "Add Income"}
            </button>
            {editingId && <button type="button" className="ghost-button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        <article className="panel">
          <div className="panel-heading">
            <h2>Income History</h2>
          </div>
          <div className="filter-toolbar">
            <div className="search-toolbar">
              <label className="search-field">
                Search income
                <input
                  name="search"
                  value={filters.search}
                  onChange={updateFilter}
                  placeholder="Search by source or payment method"
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
                Payment Method
                <select name="paymentMethod" value={filters.paymentMethod} onChange={updateFilter}>
                  <option value="">All</option>
                  {paymentMethods.map((method) => <option key={method}>{method}</option>)}
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
                  <th>Payment Method</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-cell">No data found</td>
                  </tr>
                ) : (
                  incomes.map((income) => (
                    <tr key={income._id}>
                      <td>{income.source}</td>
                      <td>{formatCurrency(income.amount)}</td>
                      <td>{income.paymentMethod || "Online"}</td>
                      <td>{new Date(income.date).toLocaleDateString()}</td>
                      <td className="table-actions">
                        <button className="icon-button" onClick={() => editIncome(income)} aria-label="Edit income">
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button danger" onClick={() => deleteIncome(income._id)} aria-label="Delete income">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Income;
