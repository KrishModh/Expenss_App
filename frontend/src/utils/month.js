export const getCurrentMonthKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const formatMonthLabel = (monthKey = getCurrentMonthKey()) => {
  const [year, month] = monthKey.split("-").map(Number);

  if (!year || !month) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
};
