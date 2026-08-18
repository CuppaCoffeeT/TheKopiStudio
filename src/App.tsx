import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "@/components/shared/app-shell/ProtectedRoute";
import DashboardLayout from "@/components/shared/app-shell/DashboardLayout";
import { ErrorBoundary } from "@/components/shared/app-shell/ErrorBoundary";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import RouteError from "@/pages/RouteError";

import { CustomerToolRedirect } from "@/components/shared/app-shell/CustomerToolRedirect";
import { ThemeProvider } from "@/lib/design/ThemeProvider";
import { TooltipProvider, Toaster } from "@/components/primitives/overlays";
import { LoadingSpinner } from "@/components/primitives/shell";
import { HelmetProvider } from "react-helmet-async";

// Lazy feature pages — each becomes its own chunk. Route paths below must
// byte-match modules.path (registration migration) + ProtectedRoute modulePath.
const ProfilerWizardPage = lazy(() => import("@/features/profiler/pages/ProfilerWizardPage"));
const ResultsListPage = lazy(() => import("@/features/profiler/pages/ResultsListPage"));
const ResultDetailPage = lazy(() => import("@/features/profiler/pages/ResultDetailPage"));
const AccountSettingsPage = lazy(() => import("@/features/account-settings/pages/AccountSettingsPage"));
const ManageAccountsPage = lazy(() => import("@/features/manage-accounts/pages/ManageAccountsPage"));
const DashboardHomePage = lazy(() => import("@/features/crm/pages/DashboardHomePage"));
const CrmDashboardPage = lazy(() => import("@/features/crm/pages/CrmDashboardPage"));
const ClientsListPage = lazy(() => import("@/features/crm/pages/ClientsListPage"));
const ClientDetailPage = lazy(() => import("@/features/crm/pages/ClientDetailPage"));
const ClientReportPage = lazy(() => import("@/features/crm/pages/ClientReportPage"));
const PortfolioReportPage = lazy(() => import("@/features/crm/pages/PortfolioReportPage"));
// Planning tools — customer-scoped sub-routes of /clients/:id (customer-centred
// IA: a tool always acts on a specific customer, so it is reached from their
// record, never from the nav rail).
const TaxCalculatorPage = lazy(() => import("@/features/crm/planning/pages/TaxCalculatorPage"));
const SrsPlannerPage = lazy(() => import("@/features/crm/planning/pages/SrsPlannerPage"));
const LegacyPlannerPage = lazy(() => import("@/features/crm/planning/pages/LegacyPlannerPage"));

/** Same fallback DashboardLayout uses — for lazy routes outside its Suspense. */
const suspenseFallback = (
  <div className="flex min-h-[60vh] items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

/**
 * Router for the empty base.
 *
 * - `/`                → redirect to `/login`
 * - `/login`           → sign-in page
 * - `/signup`          → self-serve account creation (admin-approved)
 * - `/forgot-password` → request a reset link
 * - `/reset-password`  → landing page for the emailed recovery link
 * - `/dashboard`       → authed landing (inside DashboardLayout shell)
 * - `*`                → 404
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
      // Signed-out auth screens. Eager (not lazy) like /login — they share the
      // AuthShell chunk with it and a spinner between "click the emailed link"
      // and "type a new password" would read as a broken link.
      path: "/signup",
      element: <Signup />,
      errorElement: <RouteError />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
      errorElement: <RouteError />,
    },
    {
      // Recovery-link landing. Must stay OUTSIDE ProtectedRoute: the visitor
      // arrives holding only a recovery session.
      path: "/reset-password",
      element: <ResetPassword />,
      errorElement: <RouteError />,
    },
    {
      // PUBLIC wizard — outside DashboardLayout, no ProtectedRoute (anonymous
      // visitors run profiles). Needs its own Suspense boundary.
      path: "/profiler",
      element: (
        <Suspense fallback={suspenseFallback}>
          <ProfilerWizardPage />
        </Suspense>
      ),
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
              <DashboardHomePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/profiler-results",
          element: (
            <ProtectedRoute modulePath="/profiler-results">
              <ResultsListPage />
            </ProtectedRoute>
          ),
        },
        {
          // Detail shares the list's modulePath (one module row covers both).
          path: "/profiler-results/:id",
          element: (
            <ProtectedRoute modulePath="/profiler-results">
              <ResultDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/crm",
          element: (
            <ProtectedRoute modulePath="/crm">
              <CrmDashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/clients",
          element: (
            <ProtectedRoute modulePath="/clients">
              <ClientsListPage />
            </ProtectedRoute>
          ),
        },
        {
          // Detail shares the list's modulePath (one module row covers both).
          path: "/clients/:id",
          element: (
            <ProtectedRoute modulePath="/clients">
              <ClientDetailPage />
            </ProtectedRoute>
          ),
        },
        {
          // Printable report shares '/clients' too (REPORTS_LINK_PRD sub-route precedent).
          path: "/clients/:id/report",
          element: (
            <ProtectedRoute modulePath="/clients">
              <ClientReportPage />
            </ProtectedRoute>
          ),
        },

        // ── Standalone tools (2026-08-18) ────────────────────────────────────
        // Each tool is now a place you can navigate TO, and asks for the
        // customer inside itself via `?customer=<id>` (see lib/toolRoutes).
        // They still read `public.clients`, so they keep sharing that module's
        // grant and need no module rows of their own.
        {
          path: "/tools/tax-calculator",
          element: (
            <ProtectedRoute modulePath="/clients">
              <TaxCalculatorPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/tools/srs",
          element: (
            <ProtectedRoute modulePath="/clients">
              <SrsPlannerPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/tools/legacy-planner",
          element: (
            <ProtectedRoute modulePath="/clients">
              <LegacyPlannerPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/tools/client-report",
          element: (
            <ProtectedRoute modulePath="/clients">
              <ClientReportPage />
            </ProtectedRoute>
          ),
        },

        // The customer sub-routes the tools used to live at. Kept as redirects
        // rather than deleted: they are in browser histories, in the customer
        // record launcher's muscle memory, and in existing E2E specs.
        { path: "/clients/:id/tax-calculator", element: <CustomerToolRedirect to="/tools/tax-calculator" /> },
        { path: "/clients/:id/srs", element: <CustomerToolRedirect to="/tools/srs" /> },
        { path: "/clients/:id/legacy-planner", element: <CustomerToolRedirect to="/tools/legacy-planner" /> },
        {
          path: "/crm-reports",
          element: (
            <ProtectedRoute modulePath="/crm-reports">
              <PortfolioReportPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/account-settings",
          element: (
            <ProtectedRoute modulePath="/account-settings">
              <AccountSettingsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "/manage-accounts",
          element: (
            <ProtectedRoute modulePath="/manage-accounts">
              <ManageAccountsPage />
            </ProtectedRoute>
          ),
        },
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
