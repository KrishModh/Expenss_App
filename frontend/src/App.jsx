import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles/shared.css";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import { BudgetProvider } from "./hooks/useBudget.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Income from "./pages/Income.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

const ProtectedLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="screen-loader">Loading your workspace...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-panel">{children}</main>
    </div>
  );
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BudgetProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <Signup />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPassword />
                </GuestRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedLayout>
                  <Expenses />
                </ProtectedLayout>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedLayout>
                  <Income />
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  <Profile />
                </ProtectedLayout>
              }
            />
          </Routes>
        </BudgetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;


