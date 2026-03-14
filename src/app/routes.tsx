import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { CustomerMenu } from "./pages/CustomerMenu";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Waiting } from "./pages/Waiting";

export const router = createBrowserRouter([
  { path: "/", Component: Home },
  { path: "/table/:id", Component: CustomerMenu },
  { path: "/admin", Component: AdminDashboard },
  { path: "/waiting", Component: Waiting },
]);
