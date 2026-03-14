import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { CustomerMenu } from "./pages/CustomerMenu";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Waiting } from "./pages/Waiting";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", Component: Home },
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
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
]);
