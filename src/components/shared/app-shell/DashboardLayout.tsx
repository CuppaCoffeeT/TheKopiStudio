import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import GlobalCommandPalette from '@/components/shared/app-shell/GlobalCommandPalette';
import { LoadingSpinner } from '@/components/primitives/shell';

/**
 * App shell for all protected routes.
 *
 * Mounts the global ⌘K command palette (module routing) and a single Suspense
 * boundary around the routed page `<Outlet/>`. Add app-wide chrome (header,
 * sidebar, universal search) here as your app grows.
 */
const DashboardLayout: React.FC = () => {
  return (
    <>
      {/* ⌘K — module routing */}
      <GlobalCommandPalette />
      {/* Single Suspense boundary for any lazy-loaded protected route pages. */}
      <Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </>
  );
};

export default DashboardLayout;
