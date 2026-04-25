const currency = import.meta.env.VITE_CURRENCY || "INR";

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);

export const currencySymbol = currency === "INR" ? "₹" : currency;

export const normalizeAmountInput = (value) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...decimalParts] = cleaned.split(".");
  return decimalParts.length ? `${whole}.${decimalParts.join("")}` : whole;
};
