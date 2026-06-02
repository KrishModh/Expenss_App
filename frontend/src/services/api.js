const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL");
}

const request = async (path, options = {}) => {
  const token = localStorage.getItem("expense_token");
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.details = data.errors || [];
    throw error;
  }

  return data;
};

const notifyFinancialDataChanged = () => {
  window.dispatchEvent(new CustomEvent("financial-data-changed"));
};

const requestFinancialMutation = async (path, options) => {
  const data = await request(path, options);
  notifyFinancialDataChanged();
  return data;
};

export const authApi = {
  signup: (payload) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  me: () => request("/auth/me"),
  checkUsername: (username) => request(`/auth/check-username/${encodeURIComponent(username)}`),
  forgotPassword: (payload) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  verifyResetAccount: (payload) =>
    request("/auth/verify-reset-account", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  resetPassword: (payload) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const userApi = {
  profile: () => request("/user/profile"),
  updateProfile: (payload) =>
    request("/user/profile", {
      method: "PUT",
      body: payload
    })
};

export const expenseApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => Boolean(value))
    ).toString();
    return request(`/expenses${query ? `?${query}` : ""}`);
  },
  create: (payload) =>
    requestFinancialMutation("/expenses", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  update: (id, payload) =>
    requestFinancialMutation(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  remove: (id) => requestFinancialMutation(`/expenses/${id}`, { method: "DELETE" })
};

export const budgetApi = {
  current: () => request("/budget/current"),
  get: (month) => request(`/budget${month ? `?month=${encodeURIComponent(month)}` : ""}`),
  set: (payload) =>
    requestFinancialMutation("/budget/set", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};

export const financeApi = {
  currentMonth: () => request("/finance/current-month")
};

export const incomeApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => Boolean(value))
    ).toString();
    return request(`/income${query ? `?${query}` : ""}`);
  },
  create: (payload) =>
    requestFinancialMutation("/income", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  update: (id, payload) =>
    requestFinancialMutation(`/income/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  remove: (id) => requestFinancialMutation(`/income/${id}`, { method: "DELETE" })
};
