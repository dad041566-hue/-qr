import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { CustomerMenu } from "./pages/CustomerMenu";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Waiting } from "./pages/Waiting";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SuperAdmin } from "./pages/SuperAdmin";
import { SuperAdminRoute } from "./components/SuperAdminRoute";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";

export const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/privacy", Component: Privacy },
  { path: "/terms", Component: Terms },
  { path: "/table/:id", Component: CustomerMenu },
  { path: "/m/:storeSlug/:tableId", Component: CustomerMenu },
  { path: "/waiting", Component: Waiting },
  { path: "/login", Component: Login },
  {
    path: "/change-password",
    Component: () => (
      <ProtectedRoute>
        <ChangePassword />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    Component: () => (
      <ProtectedRoute requiredRole="staff">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/superadmin",
    Component: () => (
      <SuperAdminRoute>
        <SuperAdmin />
      </SuperAdminRoute>
    ),
  },
]);
