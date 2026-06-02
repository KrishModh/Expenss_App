const monthKeyPattern = /^\d{4}-\d{2}$/;
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const isMonthKey = (value) =>
  typeof value === "string" && monthKeyPattern.test(value);

export const toMonthKey = (dateValue) => {
  if (isMonthKey(dateValue)) {
    return dateValue;
  }

  if (typeof dateValue === "string") {
    const dateOnlyMatch = dateValue.match(dateOnlyPattern);
    if (dateOnlyMatch) {
      return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}`;
    }
  }

  const date = new Date(dateValue);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const addMonths = (monthKey, amount) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + amount, 1, 12));
  return toMonthKey(date);
};

export const monthRange = (startMonth, endMonth) => {
  const months = [];
  let current = startMonth;

  while (current.localeCompare(endMonth) <= 0) {
    months.push(current);
    current = addMonths(current, 1);
  }

  return months;
};

export const monthStartDate = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
};

const dateOnlyStart = (dateValue) => {
  const match = typeof dateValue === "string" ? dateValue.match(dateOnlyPattern) : null;

  if (match) {
    const [, year, month, day] = match.map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  return new Date(dateValue);
};

export const normalizeTransactionDate = (dateValue) => {
  if (typeof dateValue === "string") {
    const match = dateValue.match(dateOnlyPattern);
    if (match) {
      const [, year, month, day] = match.map(Number);
      return new Date(Date.UTC(year, month - 1, day, 12));
    }
  }

  return new Date(dateValue);
};

export const dateRangeFilter = (startDate, endDate) => {
  const filter = {};

  if (startDate) {
    filter.$gte = dateOnlyStart(startDate);
  }

  if (endDate) {
    const end = dateOnlyStart(endDate);
    end.setUTCDate(end.getUTCDate() + 1);
    filter.$lt = end;
  }

  return filter;
};

export const calendarMonthFilter = (monthKey) => ({
  $or: [
    { monthKey },
    {
      monthKey: { $exists: false },
      date: {
        $gte: monthStartDate(monthKey),
        $lt: monthStartDate(addMonths(monthKey, 1))
      }
    }
  ]
});
