import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { budgetApi } from "../services/api.js";
import { useAuth } from "./useAuth.jsx";

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBudget = useCallback(async () => {
    if (!isAuthenticated) {
      setBudgetAmount(0);
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const data = await budgetApi.get();
      const amount = Number(data.budget?.budgetAmount || 0);
      setBudgetAmount(amount);
      return data.budget;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadBudget();
  }, [loadBudget, user?.id]);

  const setMonthlyBudget = useCallback(async (budgetAmountValue) => {
    setLoading(true);
    setError("");

    try {
      const data = await budgetApi.set({ budgetAmount: budgetAmountValue });
      const amount = Number(data.budget?.budgetAmount || 0);
      setBudgetAmount(amount);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ budgetAmount, loading, error, loadBudget, setMonthlyBudget }),
    [budgetAmount, loading, error, loadBudget, setMonthlyBudget]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const context = useContext(BudgetContext);

  if (!context) {
    throw new Error("useBudget must be used inside BudgetProvider");
  }

  return context;
};
