import { Navigate } from "react-router-dom";
import { isAuthenticated, hasRole } from "../services/authStore";

/**
 * ProtectedRoute
 * Wraps any route that requires authentication.
 *
 * Usage:
 *   <ProtectedRoute>                        → just needs login
 *   <ProtectedRoute roles={["admin"]}>      → admin only
 *   <ProtectedRoute roles={["admin","manager"]}> → admin or manager
 */
export default function ProtectedRoute({ children, roles }) {
  // Not logged in at all → go to login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → go to home
  if (roles && !hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
