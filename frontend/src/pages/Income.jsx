import "../styles/income.css";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { expenseApi, financeApi, incomeApi } from "../services/api.js";
import { currencySymbol, formatCurrency, normalizeAmountInput } from "../utils/currency.js";
import { formatMonthLabel } from "../utils/month.js";

const paymentMethods = ["Cash", "Online"];
const blankIncome = { source: "", amount: "", paymentMethod: "Online", date: "" };
const financeSummaryDefaults = { month: "", openingBalance: 0, totalIncome: 0, totalExpenses: 0, closingBalance: 0 };
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
  const [financeSummary, setFinanceSummary] = useState(financeSummaryDefaults);
  const [allTimeExpenseSummary, setAllTimeExpenseSummary] = useState({ cashExpenses: 0, onlineExpenses: 0 });
  const [allTimeIncomeSummary, setAllTimeIncomeSummary] = useState({ cashIncome: 0, onlineIncome: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [form, setForm] = useState(blankIncome);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  const loadIncomes = useCallback(async () => {
    try {
      setError("");
      const [data, financeData, allTimeIncomeData, allTimeExpenseData] = await Promise.all([
        incomeApi.list(filters),
        financeApi.currentMonth(),
        incomeApi.list({}),
        expenseApi.list({})
      ]);
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
      setFinanceSummary({
        month: financeData.month || "",
        openingBalance: Number(financeData.openingBalance || 0),
        totalIncome: Number(financeData.totalIncome || 0),
        totalExpenses: Number(financeData.totalExpenses || 0),
        closingBalance: Number(financeData.closingBalance || 0)
      });
      setAllTimeIncomeSummary({
        cashIncome: Number(allTimeIncomeData.filteredSummary?.cashIncome || allTimeIncomeData.byPaymentMethod?.cash || 0),
        onlineIncome: Number(allTimeIncomeData.filteredSummary?.onlineIncome || allTimeIncomeData.byPaymentMethod?.online || 0)
      });
      setAllTimeExpenseSummary({
        cashExpenses: Number(allTimeExpenseData.overallSummary?.byPaymentMethod?.cash || allTimeExpenseData.summary?.byPaymentMethod?.cash || 0),
        onlineExpenses: Number(
          allTimeExpenseData.overallSummary?.byPaymentMethod?.online ||
          allTimeExpenseData.summary?.byPaymentMethod?.online || 0
        )
      });
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  useEffect(() => {
    window.addEventListener("financial-data-changed", loadIncomes);

    return () => {
      window.removeEventListener("financial-data-changed", loadIncomes);
    };
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
  const currentBalance = useMemo(() => financeSummary.closingBalance, [financeSummary.closingBalance]);
  const cashBalance = useMemo(
    () => allTimeIncomeSummary.cashIncome - allTimeExpenseSummary.cashExpenses,
    [allTimeIncomeSummary.cashIncome, allTimeExpenseSummary.cashExpenses]
  );
  const onlineBalance = useMemo(
    () => allTimeIncomeSummary.onlineIncome - allTimeExpenseSummary.onlineExpenses,
    [allTimeIncomeSummary.onlineIncome, allTimeExpenseSummary.onlineExpenses]
  );

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

  const financialStatusCards = useMemo(
    () => [
      { label: "Opening Balance", value: financeSummary.openingBalance },
      { label: "Total Income", value: financeSummary.totalIncome },
      { label: "Closing Balance", value: financeSummary.closingBalance }
    ],
    [financeSummary]
  );

  const currentMonthLabel = useMemo(() => formatMonthLabel(currentMonthSummary.month), [currentMonthSummary.month]);
  const financeMonthLabel = useMemo(() => formatMonthLabel(financeSummary.month), [financeSummary.month]);
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
          <p>Current Balance</p>
          <h1 className={currentBalance < 0 ? "amount-out" : ""}>{formatCurrency(currentBalance)} Available</h1>
        </div>
        <button className="ghost-button" onClick={exportCsv}>
          <Download size={17} />
          Export as CSV
        </button>
      </div>
      <div className="balance-breakdown-grid">
        <article className="panel income-summary-card current-month-card">
          <span>Cash Balance</span>
          <strong className={cashBalance < 0 ? "amount-out" : "amount-in"}>{formatCurrency(cashBalance)}</strong>
        </article>
        <article className="panel income-summary-card current-month-card">
          <span>Online Balance</span>
          <strong className={onlineBalance < 0 ? "amount-out" : "amount-in"}>{formatCurrency(onlineBalance)}</strong>
        </article>
      </div>



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

      <section className="page-stack income-section-block">
        <div className="section-heading">
          <div>
            {/* <p>Current Month Financial Status</p> */}
            <h2>{financeMonthLabel ? `${financeMonthLabel} Balance` : "Carry-forward balance"}</h2>
          </div>
        </div>
        <div className="income-summary-grid">
          {financialStatusCards.map((item) => (
            <article className="panel income-summary-card current-month-card" key={item.label}>
              <span>{item.label}</span>
              <strong className={item.value < 0 ? "amount-out" : "amount-in"}>{formatCurrency(item.value)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="page-stack income-section-block">
        <div className="section-heading">
          <div>
            {/* <p>Overall Summary</p> */}
            <h2>All-Time Income Summary </h2>
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
