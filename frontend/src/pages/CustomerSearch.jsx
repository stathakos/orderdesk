import { useState, useEffect } from "react";
import { searchCustomersByPhone, searchCustomersByName, deleteCustomer, getAllCustomers, getOrders, getProducts } from "../services/api";
import AddCustomerForm from "../components/AddCustomerForm";
import CustomerTable from "../components/CustomerTable";
import useDebounce from "../hooks/useDebounce";
import useWatermark from "../hooks/useWatermark";

export default function CustomerSearch() {
  useWatermark("/icons/customer.png");

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [results, setResults] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    delivered: 0,
    revenue: 0,
    unavailable: 0,
  });

  const debouncedPhone = useDebounce(phone, 500);
  const debouncedName = useDebounce(name, 500);

  // ------------------------------------
  // Load today's stats
  // ------------------------------------
  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [pending, inProgress, delivered, allProducts] = await Promise.all([
          getOrders({ status: "pending", date_from: today, date_to: today }),
          getOrders({ status: "in_progress", date_from: today, date_to: today }),
          getOrders({ status: "delivered", date_from: today, date_to: today }),
          getProducts(),
        ]);
        const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
        const unavailable = allProducts.filter((p) => !p.is_available).length;
        setStats({
          pending: pending.length,
          inProgress: inProgress.length,
          delivered: delivered.length,
          revenue,
          unavailable,
        });
      } catch {
        // silently fail
      }
    }
    fetchStats();
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {  // numbers only
      setShowAll(false);
      setPhone(value);
      setName(""); // clear name search
    }
  };


  const handleNameChange = (e) => {
    setShowAll(false);
    setName(e.target.value);
    setPhone(""); // clear phone when typing name
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowAddForm(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await deleteCustomer(customerId);
      setResults((prev) => prev.filter((c) => c.id !== customerId));

      // clear search fields
      setName("");
      setPhone("");
      setHasSearched(false);

    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer");
    }
  };


  useEffect(() => {
    const fetchData = async () => {

      // PHONE SEARCH
      if (debouncedPhone.length >= 3) {
        const data = await searchCustomersByPhone(debouncedPhone);
        setResults(data);
        setHasSearched(true);
        return;
      }

      // NAME SEARCH
      if (debouncedName.trim().length >= 2) {
        const data = await searchCustomersByName(debouncedName);
        setResults(data);
        setHasSearched(true);
        return;
      }

      // RESET
      setResults([]);
      setHasSearched(false);
      setShowAll(false);
    };

    fetchData();

  }, [debouncedPhone, debouncedName]);

  async function handleShowAll() {
    if (showAll) {
      setResults([]);
      setHasSearched(false);
      setShowAll(false);
    } else {
      const data = await getAllCustomers();
      setResults(data);
      setHasSearched(true);
      setShowAll(true);
    }
  }

  return (
    <div className="container-fluid px-3 px-md-4 my-4">

      {/* ── Today's stats bar ── */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center border-warning h-100">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#f59e0b" }}>
                {stats.pending}
              </div>
              <div className="text-muted small">Pending</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-primary h-100">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#3b82f6" }}>
                {stats.inProgress}
              </div>
              <div className="text-muted small">In Progress</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-success h-100">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#22c55e" }}>
                {stats.delivered}
              </div>
              <div className="text-muted small">Delivered Today</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-center border-secondary h-100">
            <div className="card-body py-3">
              <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
                {stats.revenue.toFixed(2)} €
              </div>
              <div className="text-muted small">Revenue Today</div>
            </div>
          </div>
        </div>
      </div>
      {/* Unavailable products alert */}
      <div className="row g-3 mb-4 justify-content-center">
        <div className="col-6 col-md-3">
          <div
            className={`card text-center h-100 ${stats.unavailable > 0 ? "border-danger" : "border-success"}`}
            style={{ cursor: stats.unavailable > 0 ? "pointer" : "default" }}
            onClick={() => stats.unavailable > 0 && window.location.assign("/menu?tab=products")}
            title={stats.unavailable > 0 ? "Click to go to Menu Manager" : "All products available"}
          > Products Unavailable
            <div className="card-body py-3">
              <div style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                color: stats.unavailable > 0 ? "#ef4444" : "#22c55e"
              }}>
                {stats.unavailable}
              </div>
              <div className="text-muted small">
                {stats.unavailable > 0 ? "⚠️ Unavailable" : "✅ All Available"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h4 className="mb-4 text-center">Search Customers</h4>
 
      {/* Search inputs */}
      <div className="row justify-content-center g-2 mb-3">
        <div className="col-12 col-sm-5 col-md-4">
          <input
            type="text"
            className="form-control"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="Search by phone number"
          />
        </div>
        <div className="col-12 col-sm-5 col-md-4">
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={handleNameChange}
            placeholder="Search by customer name"
          />
        </div>
        <div className="col-12 col-sm-2 col-md-2">
          <button
            className="btn btn-theme w-100"
            onClick={() => {
              if (phone.length !== 10 && name.trim().length < 2) {
                alert("Please enter a valid 10-digit phone number to add a new customer.");
                return;
              }
              setEditingCustomer(null);
              setShowAddForm(true);
            }}
          >
            + New
          </button>
        </div>
      </div>
      <div className="row justify-content-center g-2 mb-3">
        <div className="col-12 col-sm-5 col-md-4">
          <button
            className={`btn w-100 ${showAll ? "btn-secondary" : "btn-outline-secondary"}`}
            onClick={handleShowAll}
            title={showAll ? "Hide customers" : "Show all customers"}
          >
            {showAll ? "👥 Hide Customers" : "👥 Show All Customers"}
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasSearched && (
        <div className="text-center mt-5 text-muted">
          <div style={{ fontSize: "3rem" }}>🔍</div>
          <p className="mt-2">Search by phone or name to find a customer</p>
        </div>
      )}
 
      {/* No results — show Add button */}
      {hasSearched && results.length === 0 && (
        <div className="text-center mb-3">
          <p className="text-muted">No customers found.</p>
        </div>
      )}
 
      {/* Results table */}
      {results.length > 0 && (
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <CustomerTable
              customers={results}
              hasSearched={hasSearched}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
 
      {/* Add / Edit modal */}
      {showAddForm && (
        <AddCustomerForm
          initialPhone={phone}
          initialName={name}
          editingCustomer={editingCustomer}
          onClose={() => {
            setShowAddForm(false);
            setEditingCustomer(null);
          }}
          onCustomerAdded={(customer) => {
            setResults([customer]);
          }}
        />
      )}
    </div>
  );
}
