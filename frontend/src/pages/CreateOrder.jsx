import { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { createOrder, getCustomer } from "../services/api";
import OrderForm from "../components/OrderForm";


export default function CreateOrder() {

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const customerId = useParams().customerId || parseInt(params.get("customerId"));
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch customer info
  useEffect(() => {
      if (isNaN(customerId)) {
        alert("Customer ID is missing");
        return;
      }
      getCustomer(customerId)
        .then((c) => setCustomerName(c.name))
        .catch(() => alert("Failed to fetch customer details"));
    }, [customerId]);
  
  
  async function handleSubmit(formData) {
    setSaving(true);
    try {
      await createOrder({
        customer_id: parseInt(customerId),
        ...formData,
      });
      navigate("/orders");
    } catch (err) {
      console.error("Server error detail:", err.response?.data); // ← ADD THIS
      alert(err.response?.data?.detail || "Failed to create order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container-fluid px-3 px-md-4 mt-3">
      <h4 className="mb-3">
        New Order for <strong>{customerName}</strong>
        <span className="text-muted fs-6 ms-2">(ID: {customerId})</span>
      </h4>
 
      <OrderForm
        initialData={{ items: [] }}
        onSubmit={handleSubmit}
        submitLabel="Create Order"
        showStatus={false}
        disabled={saving}
      />
    </div>
  );
}