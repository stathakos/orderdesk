import { useState, useEffect } from "react";
import CustomerSearch from "./pages/CustomerSearch";
import CreateOrder from "./pages/CreateOrder";
import OrdersList from "./pages/OrdersList";
import MenuManager from "./pages/MenuManager";
import LoginPage from "./pages/LoginPage";
import ScannerPage from "./pages/ScannerPage";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import ChangePasswordModal from "./components/ChangePasswordModal";
import DeliveryWorkers from "./pages/DeliveryWorkers";
import ShiftSummary from "./pages/ShiftSummary";
import { isAuthenticated, isAdmin, isManager, getUser, logout } from "./services/authStore";
import { getOrders } from "./services/api";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";

function NavBar() {
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  // Fetch pending + in_progress orders count every 30 seconds
  useEffect(() => {

    async function fetchPendingCount() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const [pending, inProgress] = await Promise.all([
          getOrders({ status: "pending", date_from: today, date_to: today }),
          getOrders({ status: "in_progress", date_from: today, date_to: today }),
        ]);
        setPendingCount(pending.length + inProgress.length);
      } catch {
        // silently fail
        console.error("fetchPendingCount error:", err);
      }
    }

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, []);


  const handleLogout = () => {
    logout();
    navigate("/login");
  };


  const links = [
    { to: "/", label: "Customers" },
    { to: "/orders", label: "Orders", badge: pendingCount > 0 ? pendingCount : null },
    { to: "/menu", label: "Menu" },
    { to: "/scanner", label: "Scanner" },
    ...(isManager() ? [
      { to: "/delivery-workers", label: "Delivery Workers" },
      { to: "/shift-summary", label: "Shift Summary" }
    ] : []),
    // Only show Users link to admins
    ...(isAdmin() ? [{ to: "/users", label: "Users" }] : []),
  ];

  return (
      <>
        {showChangePassword && (
          <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
        )}
      <nav className="navbar navbar-expand-md navbar-dark bg-dark px-3 mb-3 sticky-top">
        <span className="navbar-brand">🍕 Restaurant Orders</span>

        {/* Hamburger button — visible only on small screens */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Nav links — collapse on mobile */}
        <div className={`collapse navbar-collapse ${open ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto gap-1">
            {links.map((link) => (
              <li className="nav-item" key={link.to}>
                <Link
                  className={`nav-link position-relative ${location.pathname === link.to ? "active fw-semibold" : ""}`}
                  to={link.to}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.badge && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: "0.6rem" }}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {/* Logged in user info + logout */}
            {user && (
              <li className="nav-item d-flex align-items-center gap-2 ms-md-3 mt-2 mt-md-0">
                <span className="text-white-50 small d-flex flex-column align-items-center"
                  style={{ cursor: "pointer", lineHeight: "1.2" }}
                  onClick={() => setShowChangePassword(true)}
                  title="Change password"
                >
                  <span>👤 {user.username}</span>
                  <span className="badge bg-secondary mt-1">{user.role}</span>
                </span>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
      </>
  );
}

function Layout() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <CustomerSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/new/:customerId"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <CreateOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <MenuManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery-workers"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <DeliveryWorkers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shift-summary"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <ShiftSummary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scanner"
          element={
            <ProtectedRoute roles={["admin", "manager"]}>
              <ScannerPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}


function App() {
  return (
    <Router>
      <Routes>
        {/* Public route — no navbar */}
        <Route path="/login" element={<LoginPage />} />

        {/* All other routes go through Layout which includes NavBar */}
        <Route
          path="/*"
          element={
            isAuthenticated() ? <Layout /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;