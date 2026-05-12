import { useState, useEffect,  useRef } from "react";
import { getDeliveryWorkers, getWorkerShiftSummary } from "../services/api";
import useWatermark from "../hooks/useWatermark";

const ORDER_TYPE_LABEL = {
  delivery_us: "Delivery (Us)",
  delivery_partner: "Delivery (Partner)",
  take_away: "Take Away",
};

const PAYMENT_BADGE = {
  cash: "success",
  card: "primary",
  prepaid: "secondary",
};

const PAYMENT_LABEL = {
  cash: "Cash",
  card: "Card",
  prepaid: "Prepaid",
};

export default function ShiftSummary() {
  useWatermark("/icons/euro.png");

  // const [workers, setWorkers] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const printRef = useRef(null);

  const today = new Date().toLocaleDateString("el-GR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  useEffect(() => {
    async function loadSummaries() {
      try {
        setLoading(true);
        const activeWorkers = await getDeliveryWorkers(true);
        // setWorkers(activeWorkers);

        const results = await Promise.all(
          activeWorkers.map((w) => getWorkerShiftSummary(w.id))
        );
        setSummaries(results);
      } catch (err) {
        setError("Failed to load shift summary.");
      } finally {
        setLoading(false);
      }
    }
    loadSummaries();
  }, []);

  const totalOrders = summaries.reduce((sum, s) => sum + s.orders_delivered, 0);
  const totalCash = summaries.reduce((sum, s) => sum + s.total_cash, 0);
  const totalRevenue = summaries.reduce(
    (sum, s) => sum + s.orders.reduce((os, o) => os + o.total, 0), 0
  );


  // ------------------------------------
  // Per-worker print
  // ------------------------------------
  function handlePrintWorker(summary) {
    const cashOrders = summary.orders.filter((o) => o.payment_method === "cash");
    const nonCashOrders = summary.orders.filter((o) => o.payment_method !== "cash");
    const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const allTotal = summary.orders.reduce((sum, o) => sum + o.total, 0);

    const orderRow = (o) => `
      <tr>
        <td>${o.id}</td>
        <td>${o.customer.name}</td>
        <td>${o.customer.address || "—"}${o.customer.floor ? ` · ${o.customer.floor}` : ""}</td>
        <td>${new Date(o.created_at).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })}</td>
        <td class="payment ${o.payment_method}">${PAYMENT_LABEL[o.payment_method] ?? o.payment_method}</td>
        <td class="text-right">${o.total.toFixed(2)} €</td>
      </tr>
    `;

    const content = `
      <html>
        <head>
          <title>Shift Summary — ${summary.worker.name}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 13px; padding: 20px; color: #000; }
            h2 { font-size: 18px; margin-bottom: 4px; }
            p { margin: 2px 0; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { text-align: left; border-bottom: 2px solid #000; padding: 4px 6px; font-size: 12px; }
            td { padding: 4px 6px; font-size: 12px; border-bottom: 1px solid #ddd; }
            .total-row td { font-weight: 900; border-top: 2px solid #000; border-bottom: none; }
            .text-right { text-align: right; }
            .footer { margin-top: 24px; border-top: 1px dashed #000; padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; }
            .signature { margin-top: 40px; font-size: 12px; }
            .signature-line { border-top: 1px solid #000; width: 200px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <h2>🛵 ${summary.worker.name}</h2>
          ${summary.worker.phone ? `<p>📞 ${summary.worker.phone}</p>` : ""}
          <p>Date: ${today}</p>

          ${cashOrders.length > 0 ? `
            <div class="section-title">💵 Cash Orders (${cashOrders.length})</div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Customer</th><th>Address</th><th>Time</th><th>Payment</th><th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>${cashOrders.map(orderRow).join("")}</tbody>
            </table>
          ` : ""}

          ${nonCashOrders.length > 0 ? `
            <div class="section-title">💳 Prepaid / Card Orders (${nonCashOrders.length})</div>
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Customer</th><th>Address</th><th>Time</th><th>Payment</th><th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>${nonCashOrders.map(orderRow).join("")}</tbody>
            </table>
          ` : ""}

          <div class="summary-box">
            <div class="summary-row">
              <span>Total orders delivered:</span>
              <span>${summary.orders_delivered}</span>
            </div>
            <div class="summary-row">
              <span>Total revenue:</span>
              <span>${allTotal.toFixed(2)} €</span>
            </div>
            <div class="summary-row highlight">
              <span>💵 CASH TO COLLECT:</span>
              <span>${cashTotal.toFixed(2)} €</span>
            </div>
          </div>

          <div class="signature">
            <p>Worker signature:</p>
            <div class="signature-line"></div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=600,height=700");
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  // ------------------------------------
  // Full summary print
  // ------------------------------------
  function handlePrintAll() {
    window.print();
  }

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
  if (error) return <div className="alert alert-danger mx-3">{error}</div>;

  return (
    <div className="container-fluid px-3 px-md-4 mt-4" id="shift-summary">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">📋 Shift Summary</h4>
        <button className="btn btn-outline-dark" onClick={handlePrintAll}>
          🖨 Print All
        </button>
      </div>

      <p className="text-muted mb-4">
        Showing delivered orders for today — <strong>{today}</strong>
      </p>

      {/* Overall totals */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center border-primary">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>{totalOrders}</div>
              <div className="text-muted small">Total Orders</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-success">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>
                {totalCash.toFixed(2)} €
              </div>
              <div className="text-muted small">Total Cash to Collect</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-secondary">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.8rem", fontWeight: 900 }}>
                {totalRevenue.toFixed(2)} €
              </div>
              <div className="text-muted small">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {summaries.length === 0 || totalOrders === 0 ? (
        <p className="text-muted text-center">No delivered orders today.</p>
      ) : (
        summaries
          .filter((s) => s.orders_delivered > 0)
          .map((summary) => {
            const cashOrders = summary.orders.filter((o) => o.payment_method === "cash");
            const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
            const allTotal = summary.orders.reduce((sum, o) => sum + o.total, 0);

            return  (
              <div key={summary.worker.id} className="card mb-4">
                {/* Worker header */}
                <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                  <span className="fw-bold">
                    🛵 {summary.worker.name}
                    {summary.worker.phone && (
                      <span className="text-white-50 small ms-2">· {summary.worker.phone}</span>
                    )}
                  </span>
                  <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                      <div className="fw-bold text-success">{summary.total_cash.toFixed(2)} € <span className="small fw-normal text-white-50">cash</span></div>
                      <div className="small text-white-50">{allTotal.toFixed(2)} € total</div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => handlePrintWorker(summary)}
                    >
                      🖨 Print
                    </button>
                  </div>
                </div>
  
                <div className="card-body p-0">
                  {/* ── DESKTOP: table ── */}
                  <div className="d-none d-md-block">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Customer</th>
                          <th>Address</th>
                          <th>Type</th>
                          <th>Time</th>
                          <th>Payment</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.orders.map((order) => (
                          <tr key={order.id} className={order.payment_method !== "cash" ? "text-muted" : ""}>
                            <td className="fw-semibold">{order.id}</td>
                            <td>
                              <div>{order.customer.name}</div>
                              <small className="text-muted">{order.customer.phone}</small>
                            </td>
                            <td>
                              <small>
                                {order.customer.address || "—"}
                                {order.customer.floor && ` · ${order.customer.floor}`}
                              </small>
                            </td>
                            <td>
                              <small>{ORDER_TYPE_LABEL[order.order_type]}</small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(order.created_at).toLocaleTimeString("el-GR", {
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </small>
                            </td>
                            <td>
                              <span className={`badge bg-${PAYMENT_BADGE[order.payment_method] ?? "secondary"}`}>
                                {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
                              </span>
                            </td>
                            <td className="text-end fw-semibold">
                              {order.total.toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={4} className="fw-bold">
                            {summary.orders_delivered} order{summary.orders_delivered !== 1 ? "s" : ""} delivered
                          </td>
                          <td className="text-end text-muted small">cash to collect:</td>
                          <td colSpan={2} className="text-end fw-bold text-success">
                            {summary.total_cash.toFixed(2)} €
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
  
                  {/* ── MOBILE: cards ── */}
                  <div className="d-md-none p-2">
                    {summary.orders.map((order) => (
                      <div key={order.id} className="card mb-2 shadow-sm">
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold">Order #{order.id}</span>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge bg-${PAYMENT_BADGE[order.payment_method] ?? "secondary"}`}>
                                {PAYMENT_LABEL[order.payment_method] ?? order.payment_method}
                              </span>
                              <span className="fw-bold text-success">{order.total.toFixed(2)} €</span>
                            </div>
                          </div>
                          <div className="small">{order.customer.name} · {order.customer.phone}</div>
                          {order.customer.address && (
                            <div className="small text-danger">
                              📍 {order.customer.address}
                              {order.customer.floor && ` · ${order.customer.floor}`}
                            </div>
                          )}
                          <div className="small text-muted mt-1">
                            {new Date(order.created_at).toLocaleTimeString("el-GR", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between fw-bold px-2 py-2 border-top">
                      <span>{summary.orders_delivered} orders delivered</span>
                      <span className="text-success">{summary.total_cash.toFixed(2)} € cash</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
            
      )}
    </div>
  );
}
