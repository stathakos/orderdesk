import { useState, useEffect, useRef } from "react";
import { getOrder, updateOrder, assignOrder, getDeliveryWorkers, getWorkerShiftSummary } from "../services/api";
import Barcode from "react-barcode";
import useWatermark from "../hooks/useWatermark";

const WORKER_PREFIX = "WORKER:"; // prefix to distinguish worker scans from order scans

export default function ScannerPage() {
  useWatermark("/icons/scanner.png");

  const [workers, setWorkers] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [scannedOrder, setScannedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showBarcodes, setShowBarcodes] = useState(false);
  const inputRef = useRef(null);

  // State machine: "waiting_order" | "waiting_worker"
  const [scanState, setScanState] = useState("waiting_order");

  // Keep input focused
  useEffect(() => {
    const keepFocus = () => {
      if (inputRef.current && !showBarcodes) inputRef.current.focus();
    };
    keepFocus();
    document.addEventListener("click", keepFocus);
    return () => document.removeEventListener("click", keepFocus);
  }, [showBarcodes]);

  // Load workers
  useEffect(() => {
    getDeliveryWorkers(true).then(setWorkers).catch(() => {});
  }, []);

  // Auto-clear success after 4 seconds
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => {
        setSuccessMsg(null);
        setScanState("waiting_order");
        setScannedOrder(null);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // ------------------------------------
  // Handle scan
  // ------------------------------------
  async function handleScan(e) {
    if (e.key !== "Enter") return;
    const value = scanInput.trim();
    setScanInput("");
    if (!value) return;

    // Step 1 — waiting for order QR
    if (scanState === "waiting_order") {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const orderId = parseInt(value);
        if (isNaN(orderId)) {
          setError("Invalid QR code — expected an order ID.");
          setLoading(false);
          return;
        }
        const data = await getOrder(orderId);
        setScannedOrder(data);
        setScanState("waiting_worker");
      } catch {
        setError(`Order #${value} not found.`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Step 2 — waiting for worker barcode
    if (scanState === "waiting_worker") {
      if (!value.startsWith(WORKER_PREFIX)) {
        setError("Invalid barcode — please scan a worker barcode.");
        return;
      }
      const workerId = parseInt(value.replace(WORKER_PREFIX, ""));
      const worker = workers.find((w) => w.id === workerId);
      if (!worker) {
        setError("Worker not found. Please scan a valid worker barcode.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        await assignOrder(scannedOrder.id, workerId);
        await updateOrder(scannedOrder.id, { status: "ready" });

        // Fetch today's delivered count for this worker
        const today = new Date().toISOString().split("T")[0];
        const summary = await getWorkerShiftSummary(worker.id);

        setSuccessMsg({
          text: `Order #${scannedOrder.id} assigned to ${worker.name} and marked as Ready!`,
          workerName: worker.name,
          ordersDelivered: summary.orders_delivered,
          totalCash: summary.total_cash,
        });
        setScanState("waiting_order");
        setScannedOrder(null);
      } catch {
        setError("Failed to assign order. Please try again.");
        setScanState("waiting_order");
        setScannedOrder(null);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleClear() {
    setScannedOrder(null);
    setError(null);
    setSuccessMsg(null);
    setScanInput("");
    setScanState("waiting_order");
  }

  const ORDER_TYPE_LABEL = {
    delivery_us: "🛵 Delivery (Us)",
    delivery_partner: "🛵 Delivery (Partner)",
    take_away: "🥡 Take Away",
  };

  const PAYMENT_LABEL = {
    cash: "💵 Cash",
    card: "💳 Card",
    prepaid: "🎟 Prepaid",
  };

  // ------------------------------------
  // Worker barcodes sheet
  // ------------------------------------
  if (showBarcodes) {
    return (
      <div className="container mt-4" id="barcodes-sheet">
        <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
          <h4 className="fw-bold mb-0">🛵 Worker Barcodes</h4>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-dark" onClick={() => window.print()}>
              🖨 Print Sheet
            </button>
            <button className="btn btn-outline-secondary" onClick={() => setShowBarcodes(false)}>
              ← Back to Scanner
            </button>
          </div>
        </div>

        <div className="row g-4 justify-content-center">
          {workers.map((worker) => (
            <div key={worker.id} className="col-10 col-md-6 col-lg-4">
              <div
                className="card text-center p-3 align-items-center"
                style={{ border: "2px solid #000" }}
              >
                <div className="fw-bold fs-5 mb-2">{worker.name}</div>
                {worker.phone && (
                  <div className="text-muted small mb-2">{worker.phone}</div>
                )}
                <Barcode
                  value={`${WORKER_PREFIX}${worker.id}`}
                  width={1.5}
                  height={60}
                  fontSize={12}
                  displayValue={true}
                />
              </div>
            </div>
          ))}
        </div>

        {workers.length === 0 && (
          <p className="text-muted text-center mt-4">
            No active delivery workers found. Add workers in the Delivery Workers page first.
          </p>
        )}
      </div>
    );
  }

  // ------------------------------------
  // Scanner page
  // ------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "cadetblue",
        color: "white",
        padding: "clamp(1rem, 4vw, 2rem)",
      }}
    >
      {/* Hidden input — always focused */}
      {/* <input
        ref={inputRef}
        type="text"
        value={scanInput}
        onChange={(e) => setScanInput(e.target.value)}
        onKeyDown={handleScan}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
        }}
        autoFocus
      /> */}

      {/* Scanner input — visible and always focused */}
      {!successMsg && !loading && (
        <div style={{ maxWidth: "400px", margin: "0 auto 2rem auto" }}>
            <div className="input-group">
                <span className="input-group-text bg-dark border-secondary text-white">
                    {scanState === "waiting_order" ? "🥡" : "🛵"}
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className="form-control"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScan}
                    placeholder={
                    scanState === "waiting_order"
                        ? "Scan order QR or type order ID..."
                        : "Scan worker barcode..."
                    }
                    autoFocus
                    style={{ fontSize: "1.1rem" }}
                />
                {scanInput && (
                    <button
                    className="btn btn-outline-secondary"
                    onClick={() => setScanInput("")}
                    >
                    ✕
                    </button>
                )}
            </div>
            <div className="text-center mt-2">
                <small style={{ color: "rgba(255,255,255,0.6)" }}>
                    {scanState === "waiting_order"
                    ? "Point the scanner at the QR code on the ticket, or type the order ID and press Enter"
                    : "Point the scanner at the worker's personal barcode"}
                </small>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">🔍 Order Scanner</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => setShowBarcodes(true)}
          >
            🛵 Worker Barcodes
          </button>
          {(scannedOrder || error) && (
            <button className="btn btn-outline-danger btn-sm" onClick={handleClear}>
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="d-flex gap-2 mb-4 justify-content-center">
        <div
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "999px",
            backgroundColor: scanState === "waiting_order" ? "#3b82f6" : "rgba(255,255,255,0.1)",
            fontWeight: scanState === "waiting_order" ? 700 : 400,
            fontSize: "0.9rem",
          }}
        >
          1. Scan Order QR
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>→</div>
        <div
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "999px",
            backgroundColor: scanState === "waiting_worker" ? "#f59e0b" : "rgba(255,255,255,0.1)",
            fontWeight: scanState === "waiting_worker" ? 700 : 400,
            fontSize: "0.9rem",
          }}
        >
          2. Scan Worker Barcode
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center mt-5">
          <div className="spinner-border text-light" style={{ width: "3rem", height: "3rem" }} />
          <p className="mt-3 text-white-50">Processing...</p>
        </div>
      )}

      {/* Success */}
      {successMsg && !loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "5rem" }}>✅</div>
          <h4 className="text-success text-center">{successMsg.text}</h4>
          {/* Worker stats */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "1.5rem 2rem",
              textAlign: "center",
              minWidth: "250px",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              {successMsg.workerName} — today
            </div>
            <div className="d-flex gap-4 justify-content-center">
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#4ade80" }}>
                  {successMsg.ordersDelivered}
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                  delivered
                </div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#facc15" }}>
                  {successMsg.totalCash.toFixed(2)}€
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>
                  cash
                </div>
              </div>
            </div>
          </div>
          <p className="text-white-50 small">Ready for next scan in a moment...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "30vh",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "3rem" }}>❌</div>
          <h5 className="text-danger text-center">{error}</h5>
          <button className="btn btn-outline-light" onClick={handleClear}>
            Try Again
          </button>
        </div>
      )}

      {/* Waiting for order scan */}
      {!scannedOrder && !loading && !error && !successMsg && scanState === "waiting_order" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "5rem" }}>🥡</div>
          <h4 className="text-white-50 text-center">
            Use the pistol scanner or type manually above
          </h4>
        </div>
      )}

      {/* Order scanned — waiting for worker */}
      {scannedOrder && !loading && !successMsg && (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Order summary */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div style={{ fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 900 }}>
                  Order #{scannedOrder.id}
                  {scannedOrder.daily_sequence && (
                    <span className="badge bg-secondary ms-2" style={{ fontSize: "0.8rem" }}>
                      Daily #{scannedOrder.daily_sequence}
                    </span>
                  )}
                </div>
                <div style={{ color: "rgba(255,255,255,0.6)" }}>
                  {ORDER_TYPE_LABEL[scannedOrder.order_type]}
                </div>
              </div>
              <div className="text-end">
                <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#4ade80" }}>
                  {scannedOrder.total.toFixed(2)} €
                </div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                  {PAYMENT_LABEL[scannedOrder.payment_method]}
                </div>
              </div>
            </div>

            {/* Customer */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{scannedOrder.customer.name}</div>
              <div style={{ color: "rgba(255,255,255,0.6)" }}>{scannedOrder.customer.phone}</div>
              {["delivery_us", "delivery_partner"].includes(scannedOrder.order_type) && (
                <div style={{ color: "#f87171", fontWeight: 600, marginTop: "0.25rem" }}>
                  📍 {scannedOrder.customer.address || "No address"}
                  {scannedOrder.customer.floor && ` · ${scannedOrder.customer.floor}`}
                </div>
              )}
            </div>

            {/* Items */}
            {scannedOrder.items.map((item) => (
              <div key={item.id} className="d-flex justify-content-between mb-1">
                <span>
                  <strong>{item.quantity}×</strong> {item.product_name}
                  {item.customizations?.length > 0 && (
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                      {" "}({item.customizations.join(", ")})
                    </span>
                  )}
                </span>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>
                  {(item.price * item.quantity).toFixed(2)} €
                </span>
              </div>
            ))}
          </div>

          {/* Waiting for worker scan */}
          <div
            style={{
              backgroundColor: "rgba(245,158,11,0.15)",
              border: "2px solid rgba(245,158,11,0.5)",
              borderRadius: "12px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🛵</div>
            <h5 style={{ color: "#f59e0b" }}>Now scan the worker's barcode</h5>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: 0 }}>
              or <button
                className="btn btn-link btn-sm text-warning p-0"
                onClick={handleClear}
              >cancel and reset</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
