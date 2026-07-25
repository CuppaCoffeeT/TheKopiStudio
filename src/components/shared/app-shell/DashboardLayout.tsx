import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import GlobalCommandPalette from '@/components/shared/app-shell/GlobalCommandPalette';
import { AppSidebar, LoadingSpinner, SIDEBAR_OFFSET_CLASS } from '@/components/primitives/shell';
import { cn } from '@/lib/utils';

/**
 * App shell for all protected routes.
 *
 * Mounts the 2a "Kopi House" sidebar (primary navigation), the global ⌘K
 * command palette (module routing — still the fast module jump), and a single
 * Suspense boundary around the routed page `<Outlet/>`.
 *
 * The rail is `position: fixed`, so the content pane carries the offset itself:
 * `lg:pl-[200px]` at the rail's breakpoint, dropped again in print so
 * `/clients/:id/report` keeps its full-bleed print canvas.
 */
const DashboardLayout: React.FC = () => {
  return (
    <>
      {/* ⌘K — module routing */}
      <GlobalCommandPalette />
      {/* Primary nav ≥ lg; below that AppHeaderMobileBar keeps the job. */}
      <AppSidebar />
      <div className={cn(SIDEBAR_OFFSET_CLASS, 'print:pl-0!')}>
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
      </div>
    </>
  );
};

export default DashboardLayout;
