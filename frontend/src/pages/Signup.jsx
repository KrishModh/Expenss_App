import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, KeyRound, UserPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";

const generatePassword = () => {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#%^&*"
  ];
  const chars = groups.join("");
  const bytes = new Uint32Array(18);
  crypto.getRandomValues(bytes);
  const required = groups.map((group, index) => group[bytes[index] % group.length]);
  const rest = Array.from(bytes.slice(required.length), (byte) => chars[byte % chars.length]);
  return [...required, ...rest].sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2147483648).join("");
};

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const nameRef = useRef(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [googleCredential, setGoogleCredential] = useState("");
  const [usernameState, setUsernameState] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback((event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }, []);

  useEffect(() => {
    const username = form.username.trim();
    if (username.length < 3) {
      setUsernameState("");
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const data = await authApi.checkUsername(username);
        setUsernameState(data.available ? "available" : "taken");
      } catch {
        setUsernameState("");
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.username]);

  const useGeneratedPassword = useCallback(() => {
    setForm((current) => ({ ...current, password: generatePassword() }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");

      if (!googleCredential) {
        setError("Verify your email with Google before creating the account.");
        return;
      }

      setSubmitting(true);
      try {
        await signup({ ...form, googleCredential });
        navigate("/");
      } catch (err) {
        setError(err.message);
        nameRef.current?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [form, googleCredential, signup, navigate]
  );

  return (
    <main className="auth-screen">
      <section className="auth-card signup-card">
        <div className="auth-heading">
          <div className="l-t">
            <span className="brand"><img className="brand-logo" src="/images/logo.png" alt="TrackMint logo" /></span>
            <h1>Create Account</h1>
          </div>
          <p>Google verifies your email, then your username and password secure daily login.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Name
            <input ref={nameRef} autoFocus name="name" value={form.name} onChange={updateField} required />
          </label>
          <label>
            Username
            <input name="username" value={form.username} onChange={updateField} required pattern="[A-Za-z0-9_]{3,30}" />
            {usernameState === "available" && <small className="ok-text">Username available</small>}
            {usernameState === "taken" && <small className="form-error">Username already taken</small>}
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} required />
          </label>
          <label>
            Password
            <div className="input-action">
              <input name="password" type="text" value={form.password} onChange={updateField} required minLength={8} />
              <button type="button" onClick={useGeneratedPassword} aria-label="Generate secure password">
                <KeyRound size={17} />
              </button>
            </div>
          </label>

          <div className="google-box">
            {googleCredential ? (
              <span className="verified-pill">
                <CheckCircle2 size={17} />
                Email verified with Google
              </span>
            ) : (
              <GoogleLogin
                onSuccess={(response) => setGoogleCredential(response.credential || "")}
                onError={() => setError("Google verification failed. Try again.")}
                useOneTap
              />
            )}
          </div>

          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={submitting || usernameState === "taken"}>
            <UserPlus size={18} />
            {submitting ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
};

export default Signup;
