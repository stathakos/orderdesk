import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";

const ROLES = ["admin", "manager", "delivery"];

const roleBadge = (role) => {
  const colors = {
    admin: "danger",
    manager: "primary",
    delivery: "success",
  };
  return <span className={`badge bg-${colors[role] ?? "secondary"}`}>{role}</span>;
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New user form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", role: "manager" });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // ------------------------------------
  // Load users
  // ------------------------------------
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ------------------------------------
  // Create user
  // ------------------------------------
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      await createUser(formData);
      setFormData({ username: "", password: "", role: "manager" });
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setFormLoading(false);
    }
  };

  // ------------------------------------
  // Toggle active/inactive
  // ------------------------------------
  const handleToggleActive = async (user) => {
    try {
      await updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user.");
    }
  };

  // ------------------------------------
  // Change role
  // ------------------------------------
  const handleRoleChange = async (user, newRole) => {
    try {
      await updateUser(user.id, { role: newRole });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role.");
    }
  };

  // ------------------------------------
  // Delete user
  // ------------------------------------
  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  // ------------------------------------
  // Render
  // ------------------------------------
  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger mx-3">{error}</div>;

  return (
    <div className="container-fluid px-3 px-md-4 mt-4" style={{ maxWidth: "800px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">👥 User Management</h4>
        <button
          className="btn btn-danger"
          onClick={() => { setShowForm((prev) => !prev); setFormError(null); }}
        >
          {showForm ? "Cancel" : "+ New User"}
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Create New User</h6>
            {formError && (
              <div className="alert alert-danger py-2 small">{formError}</div>
            )}
            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.username}
                    onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Role</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-danger mt-3"
                disabled={formLoading}
              >
                {formLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Creating...</>
                ) : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {users.length === 0 && (
        <p className="text-muted text-center">No users found.</p>
      )}

      {users.length > 0 && (
        <>
          {/* ── DESKTOP: table ── */}
          <div className="d-none d-md-block">
            <div className="card">
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={!user.is_active ? "opacity-50" : ""}>
                        <td className="fw-semibold align-middle">{user.username}</td>
                        <td className="align-middle">
                          <select
                            className="form-select form-select-sm w-auto"
                            value={user.role}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="align-middle">
                          {user.is_active
                            ? <span className="badge bg-success">Active</span>
                            : <span className="badge bg-secondary">Inactive</span>
                          }
                        </td>
                        <td className="align-middle text-muted small">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="align-middle">
                          <div className="d-flex gap-2">
                            <button
                              className={`btn btn-sm ${user.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                              onClick={() => handleToggleActive(user)}
                            >
                              {user.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(user)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── MOBILE: cards ── */}
          <div className="d-md-none">
            {users.map((user) => (
              <div
                key={user.id}
                className={`card mb-3 shadow-sm ${!user.is_active ? "opacity-50" : ""}`}
              >
                <div className="card-body pb-2">
                  {/* Username + status */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">👤 {user.username}</span>
                    {user.is_active
                      ? <span className="badge bg-success">Active</span>
                      : <span className="badge bg-secondary">Inactive</span>
                    }
                  </div>

                  {/* Role + created */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <small className="text-muted me-2">Role:</small>
                      {roleBadge(user.role)}
                    </div>
                    <small className="text-muted">
                      {new Date(user.created_at).toLocaleDateString()}
                    </small>
                  </div>

                  {/* Role change */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold mb-1">Change Role:</label>
                    <select
                      className="form-select form-select-sm"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2">
                    <button
                      className={`btn btn-sm flex-grow-1 ${user.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger flex-grow-1"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}