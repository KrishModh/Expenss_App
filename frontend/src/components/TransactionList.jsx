import { formatCurrency } from "../utils/currency.js";

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const TransactionList = ({ items }) => (
  <div className="list-stack">
    {items.length === 0 ? (
      <p className="empty-state">No transactions yet.</p>
    ) : (
      items.map((item) => (
        <div className="transaction-row" key={`${item.kind}-${item._id}`}>
          <div>
            <strong>{item.title || item.source}</strong>
            <span>{item.kind === "expense" ? `${item.category} • ${item.paymentMethod}` : "Income"}</span>
          </div>
          <div className={item.kind === "expense" ? "amount-out" : "amount-in"}>
            {item.kind === "expense" ? "-" : "+"}{formatCurrency(item.amount)}
            <small>{formatDate(item.date)}</small>
          </div>
        </div>
      ))
    )}
  </div>
);

export default TransactionList;
