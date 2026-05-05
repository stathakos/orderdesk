import { useState } from "react";
import { updateOrderFull } from "../services/api";
import OrderForm from "./OrderForm";
 
export default function EditOrderModal({ order, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
 
  // Map existing order items into the shape OrderForm expects
  const initialData = {
    orderType: order.order_type,
    paymentMethod: order.payment_method,
    status: order.status,
    description: order.description || "",
    items: order.items.map((item) => ({
      product_id: item.product_id ?? null,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      customizations: item.customizations || [],
    })),
  };
 
  function handleClose() {
    if (window.confirm("Discard changes to this order?")) {
      onClose();
    }
  }

  async function handleSubmit(formData) {
    setSaving(true);
    try {
      const updated = await updateOrderFull(order.id, formData);
      onSaved(updated);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save order.");
    } finally {
      setSaving(false);
    }
  }
 
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
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
          maxHeight: "92vh",
          overflowY: "auto",
          backgroundColor: "white",
          borderRadius: "10px",
          zIndex: 10001,
          padding: "clamp(0.75rem, 3vw, 1.5rem)",
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="mb-0">Edit Order #{order.id}</h5>
            <small className="text-muted">
              {order.customer.name} · {order.customer.phone}
              {["delivery_us", "delivery_partner"].includes(order.order_type) &&
                order.customer.address && (
                  <span className="text-danger ms-2">
                    📍 {order.customer.address}
                  </span>
                )}
            </small>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={handleClose}>
            ✕
          </button>
        </div>
 
        {/* The shared form — status visible in edit mode */}
        <OrderForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          showStatus={true}
          disabled={saving}
        />
      </div>
    </>
  );
}
 