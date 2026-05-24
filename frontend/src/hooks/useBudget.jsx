import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { budgetApi } from "../services/api.js";
import { getCurrentMonthKey } from "../utils/month.js";
import { useAuth } from "./useAuth.jsx";

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [budgetState, setBudgetState] = useState({
    month: "",
    budget: 0,
    expenses: 0,
    remaining: 0,
    hasBudget: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBudget = useCallback(async () => {
    if (!isAuthenticated) {
      setBudgetState({
        month: "",
        budget: 0,
        expenses: 0,
        remaining: 0,
        hasBudget: false
      });
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const data = await budgetApi.current();
      const nextBudgetState = {
        month: data.month || "",
        budget: Number(data.budget || 0),
        expenses: Number(data.expenses || 0),
        remaining: Number(data.remaining || 0),
        hasBudget: Boolean(data.hasBudget)
      };
      setBudgetState(nextBudgetState);
      return nextBudgetState;
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

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const syncCurrentMonth = () => {
      const activeMonth = getCurrentMonthKey();
      if (budgetState.month && budgetState.month !== activeMonth) {
        loadBudget();
      }
    };

    const intervalId = window.setInterval(syncCurrentMonth, 60000);
    window.addEventListener("focus", syncCurrentMonth);
    document.addEventListener("visibilitychange", syncCurrentMonth);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncCurrentMonth);
      document.removeEventListener("visibilitychange", syncCurrentMonth);
    };
  }, [budgetState.month, isAuthenticated, loadBudget]);

  const setMonthlyBudget = useCallback(async (budgetAmountValue) => {
    setLoading(true);
    setError("");

    try {
      const data = await budgetApi.set({ budgetAmount: budgetAmountValue });
      setBudgetState((current) => ({
        month: data.budget?.month || current.month,
        budget: Number(data.budget?.budgetAmount || 0),
        expenses: current.expenses,
        remaining: Number(data.budget?.budgetAmount || 0) - current.expenses,
        hasBudget: true
      }));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      month: budgetState.month,
      budgetAmount: budgetState.budget,
      currentMonthExpenses: budgetState.expenses,
      remainingBalance: budgetState.remaining,
      hasBudget: budgetState.hasBudget,
      loading,
      error,
      loadBudget,
      setMonthlyBudget
    }),
    [budgetState, loading, error, loadBudget, setMonthlyBudget]
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
