import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import GlobalCommandPalette from '@/components/shared/app-shell/GlobalCommandPalette';
import { AppSidebar, LoadingSpinner, SIDEBAR_OFFSET_CLASS } from '@/components/primitives/shell';
import { SidebarProvider, useSidebarState } from '@/contexts/SidebarContext';
import { MaskProvider } from '@/contexts/MaskContext';
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
 * `/clients/:id/report` keeps its full-bleed print canvas — and dropped once
 * more whenever the advisor has collapsed the rail away (`SidebarContext`),
 * which is the only way the content column can actually reclaim the 200px.
 *
 * Two providers wrap the whole shell rather than any one page: `SidebarProvider`
 * because the rail and this offset are siblings that must agree, and
 * `MaskProvider` because the privacy eye is one app-wide switch — a masked
 * Overview that unmasks itself the moment you open a customer would be theatre.
 */
const Shell: React.FC = () => {
  const { railHidden } = useSidebarState();

  return (
    <>
      {/* ⌘K — module routing */}
      <GlobalCommandPalette />
      {/* Primary nav ≥ lg. Below that AppHeaderMobileBar keeps the job — but
          it is homed PER PAGE (the archetype frames render it; DashboardHomePage
          renders it itself), not here, so a page that composes no frame and no
          bar of its own ships with zero navigation on a phone. */}
      <AppSidebar />
      <div className={cn(!railHidden && SIDEBAR_OFFSET_CLASS, 'print:pl-0!')}>
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

const DashboardLayout: React.FC = () => (
  <SidebarProvider>
    <MaskProvider>
      <Shell />
    </MaskProvider>
  </SidebarProvider>
);

export default DashboardLayout;
