/**
 * KitchenTicket
 * Renders a print-ready kitchen/delivery order ticket.
 * Hidden on screen (print-only), triggered via window.print().
 *
 * Usage:
 *   - Mount it with the order data
 *   - Call window.print() — CSS handles the rest
 */
 
import { QRCodeSVG } from "qrcode.react";

const ORDER_TYPE_LABEL = {
  delivery_us: "🛵 DELIVERY (US)",
  delivery_partner: "🛵 DELIVERY (PARTNER)",
  take_away: "🥡 TAKE AWAY",
};

const PAYMENT_METHOD_LABEL = {
  cash: "💵 CASH",
  card: "💳 CARD",
  prepaid: "🎟 PREPAID",
};
 
export default function KitchenTicket({ order, variant = "kitchen"  }) {
  if (!order) return null;
 
  const isDelivery = ["delivery_us", "delivery_partner"].includes(order.order_type);
  const isDeliveryUs = order.order_type === "delivery_us";
  const isKitchen = variant === "kitchen";
  const isDeliveryVariant = variant === "delivery";

  const time = new Date(order.created_at).toLocaleString("el-GR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
 
  return (
    <div id="kitchen-ticket">
      {/* Header */}
      <div className="ticket-header">
        <div className="ticket-order-number">ORDER #{order.id}</div>
        <div className="ticket-time">{time}</div>
      </div>
 
      <div className="ticket-divider" />
 
      {/* Order type — big and prominent */}
      <div className="ticket-order-type">
        {ORDER_TYPE_LABEL[order.order_type] ?? order.order_type.toUpperCase()}
      </div>
 
      {/* Customer info */}
      <div className="ticket-customer">
        <div className="ticket-customer-name">{order.customer.name}</div>
        <div className="ticket-customer-phone">{order.customer.phone}</div>

        {/* Delivery-only: address, floor */}
        {isDeliveryVariant && isDelivery && (
          <>
            <div className="ticket-address">
              📍 {order.customer.address || "⚠️ NO ADDRESS ON FILE"}
            </div>
            {order.customer.floor && (
              <div className="ticket-floor">
                🏢 Floor: {order.customer.floor}
              </div>
            )}
          </>
        )}

        {/* Customer notes (allergies/preferences/communication details) */}
        {order.customer.notes && (
          <div className="ticket-customer-notes">
            ⚠️ {order.customer.notes}
          </div>
        )}
      </div>

      {/* Assigned delivery worker — only for delivery_us and only if assigned */}
      {isDeliveryVariant && isDeliveryUs && order.assigned_worker && (
        <>
          <div className="ticket-divider" />
          <div className="ticket-worker">
            🛵 WORKER: {order.assigned_worker.name}
            {order.assigned_worker.phone && (
              <span className="ticket-worker-phone">
                {" "}· {order.assigned_worker.phone}
              </span>
            )}
          </div>
        </>
      )}
      
      <div className="ticket-divider" />

      {/* Payment method */}
      {isDeliveryVariant && (
        <>
          <div className="ticket-payment">
            <strong>PAYMENT:</strong> {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
          </div>
          <div className="ticket-divider" />
        </>
      )}
 
      {/* Items */}
      <div className="ticket-items">
        {order.items.map((item, index) => (
          <div key={index} className="ticket-item">
            <div className="ticket-item-main">
              <span className="ticket-item-qty">{item.quantity}x</span>
              <span className="ticket-item-name">{item.product_name}</span>
              <span className="ticket-item-price">
                {(item.price * item.quantity).toFixed(2)}€
              </span>
            </div>
            {item.customizations?.length > 0 && (
              <ul className="ticket-customizations">
                {item.customizations.map((c, ci) => (
                  <li key={ci}>{c}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
 
      <div className="ticket-divider" />
 
      {/* Total */}
      {isDeliveryVariant && (
        <>
          <div className="ticket-total">
            <span>TOTAL</span>
            <span>{order.total.toFixed(2)} €</span>
          </div>
        </>
      )}
 
      {/* Notes / description */}
      {isDeliveryVariant && order.description && (
        <>
          <div className="ticket-divider" />
          <div className="ticket-notes">
            <strong>NOTE:</strong> {order.description}
          </div>
        </>
      )}

      <div className="ticket-divider" />

      {/* QR Code */}
      {isDeliveryVariant && (
        <>
          <div className="ticket-qr">
            <QRCodeSVG
              value={String(order.id)}
              size={90}
              level="M"
            />
            <div className="ticket-qr-label">Order #{order.id}</div>
          </div>
        </>
      )}
 
      <div className="ticket-divider" />
      <div className="ticket-footer">
        {isKitchen ? "*** KITCHEN COPY ***" : "*** DELIVERY COPY ***"}
      </div>
    </div>
  );
}