import { useState } from "react";
import { changeMyPassword } from "../services/api";
import { logout } from "../services/authStore";

export default function ChangePasswordModal({ onClose }) {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.new_password !== formData.confirm_password) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await changeMyPassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      setSuccess(true);
      // Log out after 2 seconds so user logs back in with new password
      setTimeout(() => {
        logout();
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.55)",
          zIndex: 10000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(440px, 95vw)",
          backgroundColor: "white",
          borderRadius: "10px",
          zIndex: 10001,
          padding: "clamp(1.25rem, 4vw, 2rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0">🔒 Change Password</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Success message */}
        {success ? (
          <div className="alert alert-success text-center">
            <div className="fw-semibold">Password changed successfully!</div>
            <small className="text-muted">Logging you out in a moment...</small>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger py-2 small">{error}</div>
            )}

            <div className="mb-3">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
              >
                Current Password
              </label>
              <input
                type="password"
                className="form-control"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                required
                autoFocus
                style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
              >
                New Password
              </label>
              <input
                type="password"
                className="form-control"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                minLength={6}
                required
                style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
              />
            </div>

            <div className="mb-4">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                className="form-control"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                minLength={6}
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
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
