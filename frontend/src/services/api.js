const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL");
}

const request = async (path, options = {}) => {
  const token = localStorage.getItem("expense_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
  checkUsername: (username) => request(`/auth/check-username/${encodeURIComponent(username)}`)
};

export const expenseApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => Boolean(value))
    ).toString();
    return request(`/expenses${query ? `?${query}` : ""}`);
  },
  create: (payload) =>
    request("/expenses", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  update: (id, payload) =>
    request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  remove: (id) => request(`/expenses/${id}`, { method: "DELETE" })
};

export const incomeApi = {
  list: () => request("/income"),
  create: (payload) =>
    request("/income", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  update: (id, payload) =>
    request(`/income/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),
  remove: (id) => request(`/income/${id}`, { method: "DELETE" })
};
