import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "@/components/shared/app-shell/ProtectedRoute";
import DashboardLayout from "@/components/shared/app-shell/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/app-shell/ErrorBoundary";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import RouteError from "@/pages/RouteError";

import { ThemeProvider } from "@/lib/design/ThemeProvider";
import { TooltipProvider, Toaster } from "@/components/primitives/overlays";
import { HelmetProvider } from "react-helmet-async";

/**
 * Router for the empty base.
 *
 * - `/`          → redirect to `/login`
 * - `/login`     → placeholder sign-in page
 * - `/dashboard` → placeholder authed landing (inside DashboardLayout shell)
 * - `*`          → 404
 *
 * Add new feature routes as children of the DashboardLayout group, each wrapped
 * in <ProtectedRoute modulePath="/your-path"> for module-based access control.
 * Lazy-load them with React.lazy() so each page becomes its own chunk.
 */
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Navigate to="/login" replace />,
      errorElement: <RouteError />,
    },
    {
      path: "/login",
      element: <Login />,
      errorElement: <RouteError />,
    },
    {
      element: <DashboardLayout />,
      errorElement: <RouteError />,
      children: [
        {
          path: "/dashboard",
          element: (
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          ),
        },
        // ── Add protected feature routes here ──
        // {
        //   path: "/your-module",
        //   element: (
        //     <ProtectedRoute modulePath="/your-module">
        //       <YourModulePage />
        //     </ProtectedRoute>
        //   ),
        // },
      ],
    },
    {
      path: "*",
      element: <NotFound />,
      errorElement: <RouteError />,
    },
  ]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <HelmetProvider>
          <TooltipProvider delayDuration={120}>
            <RouterProvider router={router} />
            <Toaster />
          </TooltipProvider>
        </HelmetProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
