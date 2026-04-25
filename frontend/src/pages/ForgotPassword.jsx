import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, KeyRound, Search } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api.js";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [googleCredential, setGoogleCredential] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyUsername = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setLoading(true);

      try {
        const data = await authApi.forgotPassword({ username });
        setEmailHint(data.emailHint);
        setStep(2);
      } catch (err) {
        setError(err.message);
        usernameRef.current?.focus();
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  const finishGoogleStep = useCallback(
    async (credential) => {
      setError("");
      setLoading(true);

      try {
        await authApi.verifyResetAccount({ username, googleCredential: credential });
        setGoogleCredential(credential || "");
        setStep(3);
        window.setTimeout(() => passwordRef.current?.focus(), 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  const resetPassword = useCallback(
    async (event) => {
      event.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        await authApi.resetPassword({ username, googleCredential, newPassword });
        setSuccess("Password reset successful. You can login now.");
        window.setTimeout(() => navigate("/login"), 900);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [googleCredential, navigate, newPassword, username]
  );

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-heading">
          <span className="brand-mark">E</span>
          <h1>Reset Password</h1>
          <p>Use the Google account linked to your profile before choosing a new password.</p>
        </div>

        <div className="step-row">
          {[1, 2, 3].map((item) => (
            <span key={item} className={step >= item ? "active" : ""}>{item}</span>
          ))}
        </div>

        {step === 1 && (
          <form className="form-grid" onSubmit={verifyUsername}>
            <label>
              Username
              <input
                ref={usernameRef}
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <button className="primary-button" disabled={loading}>
              <Search size={18} />
              {loading ? "Checking..." : "Find Account"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="form-grid">
            <div className="verified-panel">
              <strong>{username}</strong>
              <span>{emailHint}</span>
            </div>
            {googleCredential ? (
              <span className="verified-pill">
                <CheckCircle2 size={17} />
                Google account verified
              </span>
            ) : (
              <GoogleLogin
                onSuccess={(response) => finishGoogleStep(response.credential)}
                onError={() => setError("Google account does not match")}
              />
            )}
            {loading && <p className="empty-state">Verifying Google account...</p>}
          </div>
        )}

        {step === 3 && (
          <form className="form-grid" onSubmit={resetPassword}>
            <label>
              New Password
              <input
                ref={passwordRef}
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                minLength={8}
              />
            </label>
            <button className="primary-button" disabled={loading}>
              <KeyRound size={18} />
              {loading ? "Saving..." : "Reset Password"}
            </button>
          </form>
        )}

        {error && <p className="form-error auth-message">{error}</p>}
        {success && <p className="ok-text auth-message">{success}</p>}

        <p className="auth-switch">
          <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
};

export default ForgotPassword;
