import { useState, useEffect } from "react";
import { getOrders } from "../services/api";

const ORDER_TYPE_LABEL = {
  delivery_us: "🛵 Delivery (Us)",
  delivery_partner: "🛵 Delivery (Partner)",
  take_away: "🥡 Take Away",
};

const STATUS_BADGE = {
  pending: "warning",
  in_progress: "primary",
  ready: "info",
  delivered: "success",
  cancelled: "danger",
};

const PAYMENT_LABEL = {
  cash: "💵 Cash",
  card: "💳 Card",
  prepaid: "🎟 Prepaid",
};

export default function CustomerOrderHistory({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        // Fetch all orders for this customer including archived
        const data = await getOrders({
          customer_id: customer.id,
          include_archived: true,
          limit: 100,
        });
        setOrders(data);
      } catch {
        setError("Failed to load order history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [customer.id]);

  const totalSpent = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
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
          width: "min(700px, 95vw)",
          maxHeight: "90vh",
          backgroundColor: "var(--bs-body-bg)",
          borderRadius: "10px",
          zIndex: 10001,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <div>
            <h5 className="fw-bold mb-0">📋 {customer.name}</h5>
            <small className="text-muted">{customer.phone}</small>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>✕</button>
        </div>

        {/* Loyalty badge */}
        {!loading && !error && (
          <div className="text-center py-2 border-bottom">
            {orders.length >= 50 ? (
              <span className="badge fs-6 px-3 py-2" style={{ backgroundColor: "#f59e0b" }}>
                🥇 VIP Customer
              </span>
            ) : orders.length >= 20 ? (
              <span className="badge fs-6 px-3 py-2 bg-secondary">
                🥈 Regular Customer
              </span>
            ) : (
              <span className="badge fs-6 px-3 py-2 bg-light text-dark">
                🆕 New Customer
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {!loading && !error && (
          <div className="row g-0 border-bottom">
            <div className="col-4 text-center p-3 border-end">
              <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{orders.length}</div>
              <div className="text-muted small">Total Orders</div>
            </div>
            <div className="col-4 text-center p-3 border-end">
              <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
                {orders.filter((o) => o.status === "delivered").length}
              </div>
              <div className="text-muted small">Delivered</div>
            </div>
            <div className="col-4 text-center p-3">
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#22c55e" }}>
                {totalSpent.toFixed(2)}€
              </div>
              <div className="text-muted small">Total Spent</div>
            </div>
            <div className="col-3 text-center p-3">
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#3b82f6" }}>
                {orders.length > 0 ? (totalSpent / orders.filter(o => o.status === "delivered").length || 0).toFixed(2) : "0.00"}€
              </div>
              <div className="text-muted small">Avg Order</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1rem" }}>
          {loading && (
            <div className="text-center mt-4">
              <div className="spinner-border" />
            </div>
          )}

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {!loading && !error && orders.length === 0 && (
            <p className="text-muted text-center mt-4">No orders found for this customer.</p>
          )}

          {!loading && !error && orders.map((order) => (
            <div key={order.id} className="card mb-3 shadow-sm">
              <div className="card-body pb-2">
                {/* Order header */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-2">
                    {order.daily_sequence && (
                      <span className="badge bg-dark">#{order.daily_sequence}</span>
                    )}
                    <span className="fw-bold">Order #{order.id}</span>
                    <span className={`badge bg-${STATUS_BADGE[order.status] ?? "secondary"}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                  <span className="fw-bold text-primary">{order.total.toFixed(2)} €</span>
                </div>

                {/* Order details */}
                <div className="d-flex flex-wrap gap-2 mb-2">
                  <span className="small text-muted">
                    {ORDER_TYPE_LABEL[order.order_type]}
                  </span>
                  <span className="small text-muted">·</span>
                  <span className="small text-muted">
                    {PAYMENT_LABEL[order.payment_method]}
                  </span>
                  <span className="small text-muted">·</span>
                  <span className="small text-muted">
                    {new Date(order.created_at).toLocaleString("el-GR")}
                  </span>
                </div>

                {/* Toggle items */}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  {expandedId === order.id ? "Hide Items" : `Show Items (${order.items.length})`}
                </button>

                {/* Expanded items */}
                {expandedId === order.id && (
                  <div className="mt-2 pt-2 border-top">
                    {order.items.map((item) => (
                      <div key={item.id} className="d-flex justify-content-between small mb-1">
                        <span>
                          {item.quantity}× {item.product_name}
                          {item.customizations?.length > 0 && (
                            <span className="text-muted"> ({item.customizations.join(", ")})</span>
                          )}
                        </span>
                        <span className="text-muted">
                          {(item.price * item.quantity).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                    {order.description && (
                      <p className="small text-muted mt-2 mb-0">
                        <strong>Note:</strong> {order.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
