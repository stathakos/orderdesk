import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { loginRequest, getMe } from "../services/api";
import { login } from "../services/authStore";

export default function LoginPage() {
  // const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1 — get the token
      const { access_token } = await loginRequest(credentials);

      // Step 2 — fetch the full user profile so we have role etc.
      // We need to temporarily set the token before calling getMe
      login(access_token, null);
      const user = await getMe();

      // Step 3 — save token + full user together
      login(access_token, user);

      // Step 4 — redirect to home
      // Force full reload so App.jsx re-evaluates isAuthenticated()
      window.location.href = "/";
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Login failed. Please try again.";
      setError(msg);
      // Clean up the temp token if getMe failed
      logout();
    } finally {
      setLoading(false);
    }
  };

return (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#212529",
      padding: "clamp(1rem, 4vw, 2rem)",
    }}
  >
    <div
      style={{
        width: "min(420px, 95vw)",
        backgroundColor: "white",
        borderRadius: "10px",
        padding: "clamp(1.25rem, 4vw, 2rem)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <div style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)" }}>🍕</div>
        <h4
          className="fw-bold mt-2 mb-1"
          style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)" }}
        >
          Restaurant Orders
        </h4>
        <p
          className="text-muted mb-0"
          style={{ fontSize: "clamp(0.8rem, 2vw, 0.9rem)" }}
        >
          Sign in to your account
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "clamp(0.8rem, 2vw, 0.875rem)" }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
          >
            Username
          </label>
          <input
            type="text"
            className="form-control"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Enter your username"
            autoFocus
            required
            style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
          />
        </div>

        <div className="mb-4">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
          >
            Password
          </label>
          <input
            type="password"
            className="form-control"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-danger w-100 fw-semibold"
          disabled={loading}
          style={{ fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  </div>
  );
}
