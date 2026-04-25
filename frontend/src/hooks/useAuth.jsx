import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("expense_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("expense_token")));

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      if (!localStorage.getItem("expense_token")) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.me();
        if (active) {
          setUser(data.user);
          localStorage.setItem("expense_user", JSON.stringify(data.user));
        }
      } catch {
        localStorage.removeItem("expense_token");
        localStorage.removeItem("expense_user");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const persistSession = useCallback((data) => {
    localStorage.setItem("expense_token", data.token);
    localStorage.setItem("expense_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (payload) => {
      const data = await authApi.signup(payload);
      persistSession(data);
      return data;
    },
    [persistSession]
  );

  const login = useCallback(
    async (payload) => {
      const data = await authApi.login(payload);
      persistSession(data);
      return data;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("expense_token");
    localStorage.removeItem("expense_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signup, login, logout, isAuthenticated: Boolean(user) }),
    [user, loading, signup, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
