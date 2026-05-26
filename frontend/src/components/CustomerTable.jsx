import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerOrderHistory from "./CustomerOrderHistory";
import { isManager } from "../services/authStore";

export default function CustomerTable({ customers, onEdit, hasSearched, onDelete }) {
  const navigate = useNavigate();
  const [historyCustomer, setHistoryCustomer] = useState(null);

  if (hasSearched && (!customers || customers.length === 0)) {
    return <p className="text-center">No customers found</p>;
  }

  if (!customers || customers.length === 0) {
    return null; // show nothing initially
  }

  return (
    <>
      {/* ── DESKTOP: table ── */}
      <div className="d-none d-md-block">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Floor</th>
              <th>Notes</th>
              {isManager() && (
                <th>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="fw-semibold">{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.address || <span className="text-muted">—</span>}</td>
                <td>{c.floor || <span className="text-muted">—</span>}</td>
                <td>{c.notes || <span className="text-muted">—</span>}</td>
                {isManager() && (
                  <>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-outline-info btn-sm" onClick={() => onEdit(c)}>Edit</button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(c.id)}>Delete</button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => setHistoryCustomer(c)}>History</button>
                        <button className="btn btn-outline-success btn-sm" onClick={() => navigate(`/orders/new/${c.id}`)}>Order</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE: cards ── */}
      <div className="d-md-none">
        {customers.map((c) => (
          <div key={c.id} className="card mb-3 shadow-sm">
            <div className="card-body pb-2">
              {/* Name + phone */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold">{c.name}</span>
                <span className="text-muted small">{c.phone}</span>
              </div>

              {/* Address */}
              {c.address && (
                <div className="mb-1">
                  <small className="text-danger fw-semibold">
                    📍 {c.address}
                    {c.floor && ` · ${c.floor}`}
                  </small>
                </div>
              )}

              {/* Notes */}
              {c.notes && (
                <div className="mb-2">
                  <small className="text-muted">📝 {c.notes}</small>
                </div>
              )}

              {/* Actions */}
              <div className="d-flex gap-2 mt-2">
                {isManager() && (
                  <>
                    <button
                      className="btn btn-outline-info btn-sm flex-grow-1"
                      onClick={() => onEdit(c)}
                      title="Edit Customer"
                    >
                      ✏️ 
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm flex-grow-1" 
                      onClick={() => setHistoryCustomer(c)}
                      title="Customer History"
                    >
                      📋
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm flex-grow-1"
                      onClick={() => onDelete(c.id)}
                      title="Delete Customer"
                    >
                      🗑️
                    </button>
                    <button
                      className="btn btn-outline-success btn-sm flex-grow-1"
                      onClick={() => navigate(`/orders/new/${c.id}`)}
                      title="Create New Order"
                    >
                      🧾
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {historyCustomer && (
        <CustomerOrderHistory
          customer={historyCustomer}
          onClose={() => setHistoryCustomer(null)}
        />
      )}
    </>
  );
}
