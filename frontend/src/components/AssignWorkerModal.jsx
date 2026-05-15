import { useState } from "react";

export default function AssignWorkerModal({ order, workers, onConfirm, onSkip, required }) {
  const [selectedWorker, setSelectedWorker] = useState("");

  return (
    <>
      {/* Backdrop */}
      <div
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
          backgroundColor: "var(--bs-body-bg)",
          borderRadius: "10px",
          zIndex: 10001,
          padding: "clamp(1.25rem, 4vw, 2rem)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div className="mb-3">
          <h5 className="fw-bold mb-1">⚠️ No Worker Assigned</h5>
          <p className="text-muted small mb-0">
            Order <strong>#{order.id}</strong> for <strong>{order.customer.name}</strong> is
            being marked as <span className="badge bg-info text-dark">Ready</span> but
            has no delivery worker assigned yet.
          </p>
        </div>

        {/* Worker dropdown */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Assign a worker now <span className="text-muted fw-normal">(optional)</span>
          </label>
          <select
            className="form-select"
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
          >
            <option value="">— Skip assignment —</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.phone ? `· ${w.phone}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        {required && !selectedWorker && (
            <p className="text-muted small mb-0">
            Order <strong>#{order.id}</strong> for <strong>{order.customer.name}</strong> is
            being marked as{" "}
            <span className={`badge ${required ? "bg-success" : "bg-info text-dark"}`}>
                {required ? "Delivered" : "Ready"}
            </span>{" "}
            but has no delivery worker assigned yet.
            {required && <span className="text-danger fw-semibold"> A worker must be assigned.</span>}
            </p>
        )}
        <div className="d-flex flex-column flex-sm-row gap-2">
            <button
                className="btn btn-danger flex-grow-1"
                onClick={() => onConfirm(selectedWorker ? parseInt(selectedWorker) : null)}
                disabled={required && !selectedWorker}
            >
                {selectedWorker ? "Assign & Confirm" : "Confirm Without Worker"}
            </button>
            <button
                className="btn btn-outline-secondary flex-grow-1"
                onClick={onSkip}
            >
                Cancel
            </button>
        </div>
      </div>
    </>
  );
}
