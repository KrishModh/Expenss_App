import { Eye, EyeOff, LogIn } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const usernameRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback((event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setSubmitting(true);
      try {
        await login(form);
        navigate("/");
      } catch (err) {
        setError(err.message);
        usernameRef.current?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [form, login, navigate]
  );

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-heading">
          <span className="brand-mark">E</span>
          <h1>Welcome Back</h1>
          <p>Track budgets, income, and daily spending from one clean dashboard.</p>
        </div>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Username
            <input ref={usernameRef} autoFocus name="username" value={form.username} onChange={updateField} required />
          </label>
          <label>
            Password
            <div className="input-action">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField}
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
