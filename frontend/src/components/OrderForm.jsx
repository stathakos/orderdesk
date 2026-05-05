import { useState } from "react";
import ProductsMenuModal from "./ProductsMenuModal";
 
const ORDER_TYPES = [
  { value: "delivery_us", label: "Delivery (Us)" },
  { value: "take_away", label: "Take Away" },
  { value: "delivery_partner", label: "Partner Delivery" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "prepaid", label: "Prepaid" },
];
 
const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const DISCOUNT_PRESETS = [
  { label: "25% off", value: 25 },
  { label: "50% off", value: 50 },
  { label: "Free", value: 100 },
];
 
/**
 * Shared order form used by both CreateOrder (page) and EditOrderModal (modal).
 *
 * Props:
 *   initialData   - { orderType, paymentMethod, status, description, items } — pre-populates the form
 *   onSubmit      - async (formData) => void — called with the final form values on save
 *   submitLabel   - string shown on the submit button e.g. "Create Order" / "Save Changes"
 *   showStatus    - bool — show the status dropdown (true for edit, false for create)
 *   disabled      - bool — disables submit while parent is saving
 */
export default function OrderForm({
  initialData = {},
  onSubmit,
  submitLabel = "Submit",
  showStatus = false,
  disabled = false,
}) {
  const [orderType, setOrderType] = useState(initialData.orderType ?? "delivery_us");
  const [paymentMethod, setPaymentMethod] = useState(initialData.paymentMethod ?? "cash");
  const [status, setStatus] = useState(initialData.status ?? "pending");
  const [description, setDescription] = useState(initialData.description ?? "");
  const [items, setItems] = useState(initialData.items ?? []);
  const [showMenu, setShowMenu] = useState(false);
  // Discount state
  const [activeOrderDiscount, setActiveOrderDiscount] = useState(null); // % applied to whole order
  const [customDiscount, setCustomDiscount] = useState("");
  const [originalPrices, setOriginalPrices] = useState(null); // backup of prices before discount
 
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ------------------------------------
  // Discount handlers
  // ------------------------------------

  function applyOrderDiscount(percent) {
    if (items.length === 0) {
      alert("Add items first before applying a discount.");
      return;
    }
    // Save original prices if not already saved
    const originals = originalPrices ?? items.map((i) => i.price);
    setOriginalPrices(originals);
    setActiveOrderDiscount(percent);

    setItems((prev) =>
      prev.map((item, i) => ({
        ...item,
        price: parseFloat((originals[i] * (1 - percent / 100)).toFixed(2)),
      }))
    );
  }

  function removeOrderDiscount() {
    if (!originalPrices) return;
    setItems((prev) =>
      prev.map((item, i) => ({
        ...item,
        price: originalPrices[i],
      }))
    );
    setOriginalPrices(null);
    setActiveOrderDiscount(null);
    setCustomDiscount("");
  }

  function applyItemDiscount(index, percent) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const original = item.original_price ?? item.price;
        return {
          ...item,
          original_price: original,
          price: parseFloat((original * (1 - percent / 100)).toFixed(2)),
          item_discount: percent,
        };
      })
    );
  }

  function removeItemDiscount(index) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          price: item.original_price ?? item.price,
          original_price: undefined,
          item_discount: undefined,
        };
      })
    );
  }
 
  // ------------------------------------
  // Item management
  // ------------------------------------
 
  function updateQuantity(index, newQty) {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantity: newQty } : it))
    );
  }
 
  function removeItem(index) {
    setItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      // Update original prices backup too
      if (originalPrices) {
        setOriginalPrices(originalPrices.filter((_, i) => i !== index));
      }
      return newItems;
    });
  }
 
  function addCustomization(index) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, customizations: [...it.customizations, ""] } : it
      )
    );
  }
 
  function updateCustomization(itemIndex, customIndex, newValue) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== itemIndex) return it;
        const updated = [...it.customizations];
        updated[customIndex] = newValue;
        return { ...it, customizations: updated };
      })
    );
  }
 
  function removeCustomization(itemIndex, customIndex) {
    setItems((prev) =>
      prev.map((it, i) =>
        i !== itemIndex
          ? it
          : { ...it, customizations: it.customizations.filter((_, ci) => ci !== customIndex) }
      )
    );
  }
 
  // ------------------------------------
  // Submit
  // ------------------------------------
 
  function handleSubmit(e) {
    e?.preventDefault();
    if (items.length === 0) {
      alert("Order must contain at least one item.");
      return;
    }
    onSubmit({
      order_type: orderType,
      payment_method: paymentMethod,
      status,
      description: description.trim() || null,
      items: items.map((item) => ({
        product_id: item.product_id ?? null,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        customizations: item.customizations,
      })),
    });
  }
 
  // ------------------------------------
  // Render
  // ------------------------------------
 
  return (
    <>
      {/* Order Type + Payment Method + Status */}
      <div className="row g-2 mb-3">
        <div className={showStatus ? "col-12 col-sm-4" : "col-12"}>
          <label className="form-label small fw-semibold">Order Type</label>
          <select
            className="form-select form-select-sm"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
          >
            {ORDER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className={showStatus ? "col-12 col-sm-4" : "col-12"}>
          <label className="form-label small fw-semibold">Payment Method</label>
          <select
            className="form-select form-select-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
 
        {showStatus && (
          <div className="col-12 col-sm-4">
            <label className="form-label small fw-semibold">Status</label>
            <select
              className="form-select form-select-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
 
      {/* Description */}
      <div className="mb-3">
        <label className="form-label small fw-semibold">
          Description <span className="fw-normal text-muted">(optional)</span>
        </label>
        <textarea
          className="form-control form-control-sm"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
 
      {/* Items header + add button */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Items ({items.length})</h6>
        <button
          type="button"
          className="btn btn-sm btn-info"
          onClick={() => setShowMenu(true)}
        >
          + Add Product
        </button>
      </div>
 
      {items.length === 0 && (
        <p className="text-muted small">No items — add at least one.</p>
      )}
 
      {/* Item list */}
      {items.map((item, index) => (
        <div key={index} className={`border rounded p-2 mb-2 ${item.item_discount ? "border-warning" : ""}`}>
          <div className="d-flex justify-content-between align-items-start mb-1">
            <strong className="small">{item.product_name}</strong>
            <div className="text-end">
              {item.item_discount && (
                <div>
                  <span className="text-muted small text-decoration-line-through me-1">
                    {(item.original_price).toFixed(2)} €
                  </span>
                  <span className="badge bg-warning text-dark small">-{item.item_discount}%</span>
                </div>
              )}
              <span className="text-muted small">{item.price.toFixed(2)} €</span>
            </div>
          </div>
 
          {/* Quantity */}
          <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
            <span className="small">Qty:</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => updateQuantity(index, item.quantity - 1)}
            >−</button>
            <span className="small fw-semibold">{item.quantity}</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => updateQuantity(index, item.quantity + 1)}
            >+</button>
            <span className="ms-auto small text-muted">
              = {(item.price * item.quantity).toFixed(2)} €
            </span>
          </div>

          {/* Per-item discount */}
          <div className="mb-2">
            <span className="small fw-semibold me-2">Item discount:</span>
            {item.item_discount ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={() => removeItemDiscount(index)}
              >
                Remove -{item.item_discount}% discount
              </button>
            ) : (
              <div className="d-flex gap-1 flex-wrap mt-1">
                {DISCOUNT_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => applyItemDiscount(index, preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
                <div className="d-flex gap-1">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: "70px" }}
                    placeholder="%"
                    min="1"
                    max="100"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseFloat(e.target.value);
                        if (val > 0 && val <= 100) {
                          applyItemDiscount(index, val);
                          e.target.value = "";
                        }
                      }
                    }}
                  />
                  <span className="small text-muted align-self-center">% ↵</span>
                </div>
              </div>
            )}
          </div>
 
          {/* Customizations */}
          <div className="mb-1">
            <span className="small fw-semibold">Customizations:</span>
            <ul className="list-unstyled mb-1">
              {item.customizations.map((c, ci) => (
                <li key={ci} className="d-flex align-items-center gap-1 mt-1">
                  <input
                    className="form-control form-control-sm"
                    value={c}
                    onChange={(e) => updateCustomization(index, ci, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger flex-shrink-0"
                    onClick={() => removeCustomization(index, ci)}
                  >✕</button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => addCustomization(index)}
            >+ Add customization</button>
          </div>
 
          <button
            type="button"
            className="btn btn-sm btn-danger mt-1"
            onClick={() => removeItem(index)}
          >Remove Item</button>
        </div>
      ))}

      {/* Order-level discount */}
      {items.length > 0 && (
        <div className="card p-3 mb-3 border-warning">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold small">🏷 Order Discount</span>
            {activeOrderDiscount && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={removeOrderDiscount}
              >
                Remove discount
              </button>
            )}
          </div>

          {activeOrderDiscount ? (
            <div className="alert alert-warning py-2 mb-0 small">
              <strong>-{activeOrderDiscount}% discount applied</strong> to all items
            </div>
          ) : (
            <div className="d-flex gap-2 flex-wrap">
              {DISCOUNT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className="btn btn-sm btn-warning"
                  onClick={() => applyOrderDiscount(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
              <div className="d-flex gap-1">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: "70px" }}
                  placeholder="%"
                  min="1"
                  max="100"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-warning"
                  onClick={() => {
                    const val = parseFloat(customDiscount);
                    if (val > 0 && val <= 100) {
                      applyOrderDiscount(val);
                      setCustomDiscount("");
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
 
      {/* Total */}
      <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
        <span className="fw-bold">Total:</span>
        <span className="fw-bold text-primary fs-5">{total.toFixed(2)} €</span>
      </div>
 
      {/* Submit button */}
      <div className="d-grid my-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={disabled}
        >
          {disabled ? "Saving..." : submitLabel}
        </button>
      </div>
 
      {/* Product Menu Modal */}
      {showMenu && (
        <ProductsMenuModal
          onClose={() => setShowMenu(false)}
          onProductSelected={(prod, customization) => {

            let customLabels = [];
            let extraPrice = 0;
            if (Array.isArray(customization)) {
              customLabels = customization;
            } else if (customization && typeof customization === "object") {
              customLabels = [customization.name];
              if (customization.name.startsWith("+")) extraPrice = customization.price || 0;
            }
              const fullPrice = prod.price + extraPrice;
              // Apply active order discount to new item if one is active
              const discountedPrice = activeOrderDiscount
                ? parseFloat((fullPrice * (1 - activeOrderDiscount / 100)).toFixed(2))
                : fullPrice;

            setItems((prev) => [
              ...prev,
              {
                product_id: prod.id ?? prod.product_id ?? null,
                product_name: prod.product_name ?? prod.name,
                quantity: 1,
                price: discountedPrice,
                customizations: customLabels,
              },
            ]);
            // Add original price to backup so removing discount works correctly
            if (originalPrices) {
              setOriginalPrices((prev) => [...prev, fullPrice]);
            }
            setShowMenu(false);
          }}
        />
      )}
    </>
  );
}
