import { useState, useEffect } from "react";
import {
  getDeliveryWorkers,
  createDeliveryWorker,
  updateDeliveryWorker,
  deleteDeliveryWorker,
} from "../services/api";
import useWatermark from "../hooks/useWatermark"; 

export default function DeliveryWorkers() {
  useWatermark("/icons/food-delivery.png");
  
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New worker form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // ------------------------------------
  // Load workers
  // ------------------------------------
  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await getDeliveryWorkers();
      setWorkers(data);
    } catch (err) {
      setError("Failed to load delivery workers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  // ------------------------------------
  // Create worker
  // ------------------------------------
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      await createDeliveryWorker(formData);
      setFormData({ name: "", phone: "" });
      setShowForm(false);
      loadWorkers();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create worker.");
    } finally {
      setFormLoading(false);
    }
  };

  // ------------------------------------
  // Toggle active/inactive
  // ------------------------------------
  const handleToggleActive = async (worker) => {
    try {
      await updateDeliveryWorker(worker.id, { is_active: !worker.is_active });
      loadWorkers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update worker.");
    }
  };

  // ------------------------------------
  // Delete worker
  // ------------------------------------
  const handleDelete = async (worker) => {
    if (!window.confirm(`Delete "${worker.name}"? Their orders will be unassigned.`)) return;
    try {
      await deleteDeliveryWorker(worker.id);
      loadWorkers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete worker.");
    }
  };

  // ------------------------------------
  // Render
  // ------------------------------------
  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger mx-3">{error}</div>;

  return (
    <div className="container-fluid px-3 px-md-4 mt-4" style={{ maxWidth: "700px" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">🛵 Delivery Workers</h4>
        <button
          className="btn btn-danger"
          onClick={() => { setShowForm((prev) => !prev); setFormError(null); }}
        >
          {showForm ? "Cancel" : "+ New Worker"}
        </button>
      </div>

      {/* Create worker form */}
      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Add New Worker</h6>
            {formError && (
              <div className="alert alert-danger py-2 small">{formError}</div>
            )}
            <form onSubmit={handleCreate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Nikos Papadopoulos"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    Phone <span className="text-muted fw-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 6912345678"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-danger mt-3"
                disabled={formLoading}
              >
                {formLoading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Adding...</>
                ) : "Add Worker"}
              </button>
            </form>
          </div>
        </div>
      )}

      {workers.length === 0 && (
        <p className="text-muted text-center">No delivery workers yet.</p>
      )}

      {/* ── DESKTOP: table ── */}
      {workers.length > 0 && (
        <>
          <div className="d-none d-md-block">
            <div className="card">
              <div className="card-body p-0">
                <table className="table table-hover mb-0">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workers.map((worker) => (
                      <tr key={worker.id} className={!worker.is_active ? "opacity-50" : ""}>
                        <td className="fw-semibold align-middle">{worker.name}</td>
                        <td className="align-middle text-muted">
                          {worker.phone || <span className="fst-italic">—</span>}
                        </td>
                        <td className="align-middle">
                          {worker.is_active
                            ? <span className="badge bg-success">Active</span>
                            : <span className="badge bg-secondary">Inactive</span>
                          }
                        </td>
                        <td className="align-middle">
                          <div className="d-flex gap-2">
                            <button
                              className={`btn btn-sm ${worker.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                              onClick={() => handleToggleActive(worker)}
                            >
                              {worker.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(worker)}
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
            {workers.map((worker) => (
              <div
                key={worker.id}
                className={`card mb-3 shadow-sm ${!worker.is_active ? "opacity-50" : ""}`}
              >
                <div className="card-body pb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold">{worker.name}</span>
                    {worker.is_active
                      ? <span className="badge bg-success">Active</span>
                      : <span className="badge bg-secondary">Inactive</span>
                    }
                  </div>

                  {worker.phone && (
                    <div className="mb-2">
                      <small className="text-muted">📞 {worker.phone}</small>
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-2">
                    <button
                      className={`btn btn-sm flex-grow-1 ${worker.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                      onClick={() => handleToggleActive(worker)}
                    >
                      {worker.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger flex-grow-1"
                      onClick={() => handleDelete(worker)}
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
