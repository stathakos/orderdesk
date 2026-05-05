import React, { useEffect, useState } from "react";
import EditOrderModal from "../components/EditOrderModal";
import AssignWorkerModal from "../components/AssignWorkerModal";
import KitchenTicket from "../components/KitchenTicket";
import usePrint from "../hooks/usePrint";
import { getOrders, updateOrder, deleteOrder, getDeliveryWorkers, assignOrder, unassignOrder, closeShift, purgeOldOrders } from "../services/api";
import { isAdmin } from "../services/authStore";
 
const ORDER_TYPES = [
  { value: "", label: "All Types" },
  { value: "delivery_us", label: "Delivery (Us)" },
  { value: "take_away", label: "Take Away" },
  { value: "delivery_partner", label: "Partner Delivery" },
];

const PAYMENT_METHODS = [
  { value: "", label: "All Payments" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "prepaid", label: "Prepaid" },
];
 
const ORDER_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];
 
const STATUS_BADGE = {
  pending: "warning",
  in_progress: "primary",
  ready: "info",
  delivered: "success",
  cancelled: "danger",
};

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const { printKitchen, printDelivery, orderToPrint, printVariant } = usePrint();
  const [assignModalOrder, setAssignModalOrder] = useState(null);
  // Date filter state
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  // Close Shift
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [closeShiftResult, setCloseShiftResult] = useState(null);
  const [closingShift, setClosingShift] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  // Purge old orders
  const [showPurge, setShowPurge] = useState(false);
  const [purgeResult, setPurgeResult] = useState(null);
  const [purging, setPurging] = useState(false);

 
  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterType) filters.order_type = filterType;
      if (filterPaymentMethod) filters.payment_method = filterPaymentMethod;
      if (filterStatus) filters.status = filterStatus;
      if (filterCustomerId) filters.customer_id = parseInt(filterCustomerId);
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      // Auto-include archived when looking at anything other than today
      const isToday = dateFrom === today && dateTo === today;
      if (!isToday) filters.include_archived = true;
      setOrders(await getOrders(filters));
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorkers() {
    try {
      const data = await getDeliveryWorkers(true); // active only
      setWorkers(data);
    } catch {
      // silently fail
    }
  }

  async function handleCloseShift() {
    setClosingShift(true);
    try {
      const result = await closeShift();
      setCloseShiftResult(result);
      fetchOrders(); // refresh orders list
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close shift.");
    } finally {
      setClosingShift(false);
    }
  }

 
  useEffect(() => {
    fetchOrders();
    fetchWorkers();
  }, [filterType, filterPaymentMethod, filterStatus, filterCustomerId, dateFrom, dateTo, includeArchived]);
  
  async function handleStatusChange(orderId, newStatus) {
    // Find the order
    const order = orders.find((o) => o.id === orderId);

    // Nudge for ready, mandatory for delivered — both only for delivery_us
    if (
      (newStatus === "ready" || newStatus === "delivered") &&
      order?.order_type === "delivery_us" &&
      !order?.assigned_to
    ) {
      setAssignModalOrder({ ...order, pendingStatus: newStatus });
      return;
    }

    try {
      const updated = await updateOrder(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
    } catch {
      alert("Failed to update order status.");
    }

  }

  async function handleAssignChange(orderId, workerId) {
    try {
      let updated;
      if (workerId === "") {
        updated = await unassignOrder(orderId);
      } else {
        updated = await assignOrder(orderId, parseInt(workerId));
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      alert("Failed to assign worker.");
    }
  }

  async function handleAssignAndReady(order, workerId) {
    try {
      // Assign worker if selected
      if (workerId) {
        const updated = await assignOrder(order.id, workerId);
        setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      }
      // Mark as ready
      const updated = await updateOrder(order.id, { status:  order.pendingStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o))
      );
    } catch {
      alert("Failed to update order.");
    } finally {
      setAssignModalOrder(null);
    }
  }
 
  async function handleDelete(orderId) {
    if (!window.confirm(`Delete order #${orderId}?`)) return;
    try {
      await deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      alert("Failed to delete order.");
    }
  }
 
  function handleOrderSaved(updatedOrder) {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
  }

  function setQuickDate(range) {
    const now = new Date();
    const toStr = (d) => d.toISOString().split("T")[0];
    if (range === "today") {
      setDateFrom(toStr(now));
      setDateTo(toStr(now));
    } else if (range === "7days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      setDateFrom(toStr(from));
      setDateTo(toStr(now));
    } else if (range === "30days") {
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      setDateFrom(toStr(from));
      setDateTo(toStr(now));
    } else if (range === "all") {
      setDateFrom("");
      setDateTo("");
    }
  }

  async function handlePurge() {
    setPurging(true);
    try {
      const result = await purgeOldOrders();
      setPurgeResult(result);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to purge orders.");
    } finally {
      setPurging(false);
    }
  }

  // Only show assign dropdown for delivery orders
  const isDeliveryOrder = (order) =>
    ["delivery_us"].includes(order.order_type);

  const isCashPaid = (order) =>
    order.payment_method === "cash";

  const statusOptions = ORDER_STATUSES.filter((s) => s.value !== "");

  // Worker dropdown — reusable for both desktop and mobile
  const WorkerSelect = ({ order }) => {
    if (!isDeliveryOrder(order)) return <span className="text-muted d-flex justify-content-center small">——</span>;
    return (
      <select
        className="form-select form-select-sm"
        value={order.assigned_to ?? ""}
        onChange={(e) => handleAssignChange(order.id, e.target.value)}
      >
        <option value="">Unassigned</option>
        {workers.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
    );
  };
 
  return (
    <div className="container-fluid px-3 px-md-4 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Orders</h4>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => setShowCloseShift(true)}
        >
          🔒 Close Shift
        </button>
        {isAdmin() && (
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => setShowPurge(true)}
          >
            🗑 Purge Old Orders
          </button>
        )}
      </div>
 
      {/* Filters — stack on mobile, row on desktop */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-md-2">
          <select className="form-select form-select-sm" value={filterType}
            onChange={(e) => setFilterType(e.target.value)}>
            {ORDER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select form-select-sm" value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <select className="form-select form-select-sm" value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <input type="number" className="form-control form-control-sm"
            placeholder="Customer ID" value={filterCustomerId}
            onChange={(e) => setFilterCustomerId(e.target.value)} />
        </div>
        <div className="col-6 col-md-auto d-flex align-items-center gap-2">
          <div className="form-check mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="includeArchived"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="includeArchived">
              Include archived
            </label>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <button className="btn btn-outline-secondary btn-sm w-100"
            onClick={() => { 
              setFilterType(""); 
              setFilterPaymentMethod(""); 
              setFilterStatus(""); 
              setFilterCustomerId(""); 
              setIncludeArchived(false);
              setDateFrom(today);
              setDateTo(today);
            }}>
            Clear
          </button>
        </div>
      </div>

      {/* Date filters */}
      <div className="row g-2 mb-4 align-items-center">
        {/* Quick buttons */}
        <div className="col-12 col-md-auto">
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${dateFrom === today && dateTo === today ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setQuickDate("today")}
            >
              Today
            </button>
            <button
              className="btn btn-outline-dark"
              onClick={() => setQuickDate("7days")}
            >
              7 Days
            </button>
            <button
              className="btn btn-outline-dark"
              onClick={() => setQuickDate("30days")}
            >
              30 Days
            </button>
            <button
              className={`btn ${!dateFrom && !dateTo ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setQuickDate("all")}
            >
              All
            </button>
          </div>
        </div>

        {/* Custom date picker */}
        <div className="col-6 col-md-auto">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="col-auto d-none d-md-block text-muted small">→</div>
        <div className="col-6 col-md-auto">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
 
      {loading && <p className="text-muted">Loading orders...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && orders.length === 0 && <p className="text-muted">No orders found.</p>}
 
      {/* ── DESKTOP: table (hidden on mobile) ── */}
      {!loading && orders.length > 0 && (
        <>
          <div className="d-none d-md-block">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Num #</th>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Worker</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td>
                        <span className="badge bg-dark">
                          #{order.daily_sequence ?? "—"}
                        </span>
                      </td>
                      <td>{order.id}</td>
                      <td>
                        <div>{order.customer.name}</div>
                        <small className="text-muted">{order.customer.phone}</small>
                        {["delivery_us", "delivery_partner"].includes(order.order_type) && (
                          <div>
                            <small className="text-danger fw-semibold">
                              📍 {order.customer.address || "No address on file"}
                            </small>
                          </div>
                        )}
                        <small className="text-muted">{order.customer.floor || "No floor on file"}</small>
                      </td>
                      <td>{ORDER_TYPES.find((t) => t.value === order.order_type)?.label ?? order.order_type}</td>
                      <td>
                        <select
                          className={`form-select form-select-sm text-${STATUS_BADGE[order.status] ?? "secondary"}`}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          >
                          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td>{PAYMENT_METHODS.find((t) => t.value === order.payment_method)?.label ?? order.payment_method}</td>
                      <td><WorkerSelect order={order} /></td>
                      <td>{order.total.toFixed(2)} €</td>
                      <td><small>{new Date(order.created_at).toLocaleString("el-GR")}</small></td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary"
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                          {expandedId === order.id ? "Hide" : `Show (${order.items.length})`}
                        </button>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingOrder(order)}>
                            Edit
                          </button>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-dark dropdown-toggle"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              🖨
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li>
                                <button className="dropdown-item" onClick={() => printKitchen(order)}>
                                  🍕 Kitchen Copy
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => printDelivery(order)}>
                                  🛵 Delivery Copy
                                </button>
                              </li>
                            </ul>
                          </div>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr className="table-secondary">
                        <td colSpan={11}>
                          <div className="px-2 py-1">
                            {order.description && (
                              <p className="mb-2 text-muted small"><strong>Note:</strong> {order.description}</p>
                            )}
                            <table className="table table-sm mb-0">
                              <thead>
                                <tr>
                                  <th>Product</th><th>Qty</th><th>Unit</th><th>Subtotal</th><th>Customizations</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.price.toFixed(2)} €</td>
                                    <td>{(item.price * item.quantity).toFixed(2)} €</td>
                                    <td>{item.customizations?.length > 0 ? item.customizations.join(", ") : <span className="text-muted">—</span>}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
 
          {/* ── MOBILE: cards (hidden on desktop) ── */}
          <div className="d-md-none">
            {orders.map((order) => (
              <div key={order.id} className="card mb-3 shadow-sm">
                <div className="card-body pb-2">
                  {/* Top row: order id + total */}
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-dark">#{order.daily_sequence ?? "—"}</span>
                      <span className="fw-bold">Order #{order.id}</span>
                    </div>
                    <span className="fw-bold text-primary">{order.total.toFixed(2)} €</span>
                  </div>
 
                  {/* Customer */}
                  <div className="mb-1">
                    <span className="small text-muted">Customer: </span>
                    <span className="small">{order.customer.name} · {order.customer.phone}</span>
                  </div>
                  {["delivery_us", "delivery_partner"].includes(order.order_type) && (
                    <div className="mb-1">
                      <small className="text-danger fw-semibold">
                        📍 {order.customer.address || "No address on file"} · {order.customer.floor || "No floor on file"}
                      </small>
                    </div>
                  )}
 
                  {/* Type + date */}
                  <div className="mb-2">
                    <span className="badge bg-secondary me-2">
                      {ORDER_TYPES.find((t) => t.value === order.order_type)?.label ?? order.order_type}
                    </span>
                    <span className="small text-muted">
                      {new Date(order.created_at).toLocaleString("el-GR")}
                    </span>
                    <span className="badge bg-info ms-2">
                      {PAYMENT_METHODS.find((t) => t.value === order.payment_method)?.label ?? order.payment_method}
                    </span>
                  </div>
 
                  {/* Status dropdown */}
                  <div className="mb-2">
                    <label className="form-label small fw-semibold mb-1">Status:</label>
                    <select
                      className={`form-select form-select-sm text-${STATUS_BADGE[order.status] ?? "secondary"}`}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  {/* Worker assignment */}
                  {isDeliveryOrder(order) && (
                    <div className="mb-2">
                      <label className="form-label small fw-semibold mb-1">Delivery Worker:</label>
                      <WorkerSelect order={order} />
                    </div>
                  )}
 
                  {/* Actions */}
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-secondary flex-grow-1"
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      {expandedId === order.id ? "Hide Items" : `Items (${order.items.length})`}
                    </button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => setEditingOrder(order)}>
                      Edit
                    </button>
                    <div className="btn-group">
                      <button
                        className="btn btn-sm btn-outline-dark dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        🖨
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button className="dropdown-item" onClick={() => printKitchen(order)}>
                            🍕 Kitchen Copy
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item" onClick={() => printDelivery(order)}>
                            🛵 Delivery Copy
                          </button>
                        </li>
                      </ul>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(order.id)}>
                      Delete
                    </button>
                  </div>
 
                  {/* Expandable items */}
                  {expandedId === order.id && (
                    <div className="mt-2 pt-2 border-top">
                      {order.description && (
                        <p className="small text-muted mb-2"><strong>Note:</strong> {order.description}</p>
                      )}
                      {order.items.map((item) => (
                        <div key={item.id} className="d-flex justify-content-between small mb-1">
                          <span>
                            {item.quantity}× {item.product_name}
                            {item.customizations?.length > 0 && (
                              <span className="text-muted"> ({item.customizations.join(", ")})</span>
                            )}
                          </span>
                          <span className="text-muted">{(item.price * item.quantity).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={handleOrderSaved}
        />
      )}
      {/* Kitchen Ticket — hidden on screen, shown only on print */}
      <KitchenTicket order={orderToPrint} variant={printVariant} />
      {assignModalOrder && (
        <AssignWorkerModal
          order={assignModalOrder}
          workers={workers}
          onConfirm={(workerId) => handleAssignAndReady(assignModalOrder, workerId)}
          onSkip={() => setAssignModalOrder(null)}
          required={assignModalOrder.pendingStatus === "delivered"}
        />
      )}
      {/* Close Shift Modal */}
      {showCloseShift && (
        <>
          <div
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              zIndex: 10000,
            }}
            onClick={() => { if (!closingShift) setShowCloseShift(false); }}
          />
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(440px, 95vw)",
            backgroundColor: "white",
            borderRadius: "10px",
            zIndex: 10001,
            padding: "clamp(1.25rem, 4vw, 2rem)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          }}>
            {closeShiftResult ? (
              // Success state
              <>
                <div className="text-center mb-4">
                  <div style={{ fontSize: "2.5rem" }}>✅</div>
                  <h5 className="fw-bold mt-2">Shift Closed!</h5>
                </div>
                <div className="card mb-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Orders archived:</span>
                      <span className="fw-bold">{closeShiftResult.orders_archived}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Total revenue:</span>
                      <span className="fw-bold">{closeShiftResult.total_revenue.toFixed(2)} €</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Cash collected:</span>
                      <span className="fw-bold text-success">{closeShiftResult.cash_revenue.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-dark w-100"
                  onClick={() => {
                    setShowCloseShift(false);
                    setCloseShiftResult(null);
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              // Confirmation state
              <>
                <div className="text-center mb-4">
                  <div style={{ fontSize: "2.5rem" }}>🔒</div>
                  <h5 className="fw-bold mt-2">Close Shift?</h5>
                  <p className="text-muted small mt-2">
                    All of today's orders will be archived and hidden from the active view.
                    They remain in the database and can be accessed via the date filters.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-danger flex-grow-1"
                    onClick={handleCloseShift}
                    disabled={closingShift}
                  >
                    {closingShift ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Closing...</>
                    ) : "Yes, Close Shift"}
                  </button>
                  <button
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={() => setShowCloseShift(false)}
                    disabled={closingShift}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
      {/* Purge Old Orders Modal */}
      {showPurge && (
        <>
          <div
            style={{
              position: "fixed", inset: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              zIndex: 10000,
            }}
            onClick={() => { if (!purging) setShowPurge(false); }}
          />
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(440px, 95vw)",
            backgroundColor: "white",
            borderRadius: "10px",
            zIndex: 10001,
            padding: "clamp(1.25rem, 4vw, 2rem)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          }}>
            {purgeResult ? (
              <>
                <div className="text-center mb-4">
                  <div style={{ fontSize: "2.5rem" }}>🗑</div>
                  <h5 className="fw-bold mt-2">Purge Complete!</h5>
                </div>
                <div className="card mb-4">
                  <div className="card-body text-center">
                    <div style={{ fontSize: "2rem", fontWeight: 900 }}>
                      {purgeResult.orders_deleted}
                    </div>
                    <div className="text-muted small">orders permanently deleted</div>
                  </div>
                </div>
                <button
                  className="btn btn-dark w-100"
                  onClick={() => {
                    setShowPurge(false);
                    setPurgeResult(null);
                  }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div style={{ fontSize: "2.5rem" }}>⚠️</div>
                  <h5 className="fw-bold mt-2">Purge Old Orders?</h5>
                  <p className="text-muted small mt-2">
                    This will <strong>permanently delete</strong> all archived orders
                    older than 30 days. This action cannot be undone.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-danger flex-grow-1"
                    onClick={handlePurge}
                    disabled={purging}
                  >
                    {purging ? (
                      <><span className="spinner-border spinner-border-sm me-2" />Purging...</>
                    ) : "Yes, Purge Orders"}
                  </button>
                  <button
                    className="btn btn-outline-secondary flex-grow-1"
                    onClick={() => setShowPurge(false)}
                    disabled={purging}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
