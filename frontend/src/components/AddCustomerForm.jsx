import { useState } from "react";
import { createCustomer, updateCustomer } from "../services/api";

export default function AddCustomerForm({ initialPhone, initialName, onClose, onCustomerAdded, editingCustomer }) {
  const [name, setName] = useState(editingCustomer ? editingCustomer.name : initialName || "");
  const [phone, setPhone] = useState(editingCustomer ? editingCustomer.phone : initialPhone || "");
  const [address, setAddress] = useState(editingCustomer ? editingCustomer.address : "");
  const [floor, setFloor] = useState(editingCustomer ? editingCustomer.floor : ""); 
  const [notes, setNotes] = useState(editingCustomer ? editingCustomer.notes : "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim() === "" || phone.trim() === "" || address.trim() === "") {
      alert("Name, phone, and address are required");
      return;
    }
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      alert("Phone must have 10 digits and only numbers");
      return;
    }

    try{
        if (editingCustomer) {
            const updatedCustomer = await updateCustomer(editingCustomer.id, {
                name: name.trim(),
                phone: phone.trim(),
                address: address?.trim() || null,
                floor: floor?.trim() || null,
                notes: notes?.trim() || null
            });
            alert("Customer updated successfully");
            onCustomerAdded(updatedCustomer);
            onClose();
            return;
        } else {
            const newCustomer = {
                name: name.trim(),
                phone: phone.trim(),
                address: address?.trim() || null,
                floor: floor?.trim() || null,
                notes: notes?.trim() || null
            };
        
        
            const createdCustomer = await createCustomer(newCustomer);
            alert("Customer added successfully");
            // Clear form
            setName("");
            setPhone("");
            setAddress("");
            setFloor("");
            setNotes("");
            onCustomerAdded(createdCustomer);
            onClose();
        }
    } catch (error) {
        console.error("Error saving customer:", error);
        if (error.response && error.response.data && error.response.data.detail) {
            alert(`Failed to save customer: ${error.response.data.detail}`);
        } else {
            alert("Failed to save customer");
        }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 9000,
        }}
      />
 
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(500px, 95vw)",
          backgroundColor: "var(--bs-body-bg)",
          borderRadius: "10px",
          zIndex: 9001,
          padding: "clamp(1rem, 3vw, 1.5rem)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            ✕
          </button>
        </div>
 
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
 
          <div className="mb-3">
            <label className="form-label small fw-semibold">Phone</label>
            <input
              type="text"
              className="form-control"
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
 
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Address 
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Floor 
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Floor Number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>
 
          <div className="mb-4">
            <label className="form-label small fw-semibold">
              Delivery Notes <span className="fw-normal text-muted">(optional)</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="Entrance instructions, bell, call, access info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
 
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary flex-grow-1">
              {editingCustomer ? "Update Customer" : "Create Customer"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}