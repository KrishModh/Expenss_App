import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { incomeApi } from "../services/api.js";
import { currencySymbol, formatCurrency, normalizeAmountInput } from "../utils/currency.js";

const blankIncome = { source: "", amount: "", date: "" };

const Income = () => {
  const sourceRef = useRef(null);
  const [incomes, setIncomes] = useState([]);
  const [form, setForm] = useState(blankIncome);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  const loadIncomes = useCallback(async () => {
    try {
      const data = await incomeApi.list();
      setIncomes(data.incomes);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const updateForm = useCallback((event) => {
    const { name, value } = event.target;
    const nextValue = name === "amount" ? normalizeAmountInput(value) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
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
      date: income.date.slice(0, 10)
    });
    sourceRef.current?.focus();
  }, []);

  const deleteIncome = useCallback(
    async (id) => {
      await incomeApi.remove(id);
      loadIncomes();
    },
    [loadIncomes]
  );

  const total = useMemo(() => incomes.reduce((sum, item) => sum + Number(item.amount), 0), [incomes]);

  return (
    <section className="page-stack">
      <div className="page-title">
        <div>
          <p>Income</p>
          <h1>{formatCurrency(total)} received</h1>
        </div>
      </div>

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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income._id}>
                    <td>{income.source}</td>
                    <td>{formatCurrency(income.amount)}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Income;
