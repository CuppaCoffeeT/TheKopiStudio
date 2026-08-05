/**
 * PageShell — Heavyweight detail-page shell (hero · optional tabs · main + optional side-rail).
 *
 * 2026-07-25 — repainted to the 2a "Kopi House" DOSSIER. The masthead is gone,
 * so the content pane IS the page: it sits on the page cream at the comp's
 * 34/40 padding and the panels inside it are the raised cream cards.
 *
 * Locked to KOPI_2A_SPEC.md → "Archetype — detail":
 *  - hero = inline breadcrumb (16px above) → Instrument Serif title → 13px meta
 *    line (6px below the title) → `--color-border` hairline at 20px
 *  - actions right, `align-items: flex-end`, secondary then primary, gap 10px
 *  - body = `1.4fr 1fr` grid; the comp's 22px stack gap ships as the scale's
 *    24px step (gap-6) since the 2026-08-05 spacing retune — see the 2a
 *    handoff decisions.md. `fullWidth` drops the second track.
 *  - mobile stacks to one column and keeps the sticky bottom action bar
 *  - h1 = `<PageTitle>` (primitives/shell/PageTitle.tsx), family/weight locked
 *    there; the detail archetype's 38px step is applied here (see below).
 *
 * Spec: docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md
 * Adopters: tracked in DESIGN_CATALOG.md.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageTitle } from '@/components/primitives/shell';
import { PageShellStatusPill, type PageShellStatusTone } from './PageShellStatusPill';

export type PageShellVariant = 'withSideRail' | 'fullWidth';

/** Re-exported so `@/components/primitives/detail/PageShell` stays the import path adopters know. */
export type { PageShellStatusTone };

/** Breakpoint below which the sticky mobile action bar renders. Default `md` (< 768px); `lg` extends to tablet (< 1024px) for pages whose body collapses to a single column at < lg. */
export type PageShellActionBarBreakpoint = 'md' | 'lg';

interface PageShellProps {
  hero?: ReactNode;
  tabs?: ReactNode;
  main: ReactNode;
  sideRail?: ReactNode;
  variant?: PageShellVariant;
  /** Sticky mobile-only action bar (renders below main on small screens). */
  mobileActionBar?: ReactNode;
  /** Extra classes on the rail column. The 2a body is a grid, so the column is
   *  sized by the `1fr` track — width utilities passed here (the pre-2a
   *  `md:w-[300px]` / `md:w-auto` escape hatches) are inert but harmless. */
  sideRailClassName?: string;
  /** Breakpoint below which the action bar is visible. Default `md`; pass `lg` for pages that collapse to one column at < lg. */
  actionBarBreakpoint?: PageShellActionBarBreakpoint;
  className?: string;
}

/** Content-pane gutter — the comp's 40px at desktop, with a genuinely
 *  compact mobile rhythm (16px) rather than a shrunk desktop one. */
const PANE_X = 'px-4 sm:px-6 md:px-10';

export function PageShell({
  hero,
  tabs,
  main,
  sideRail,
  variant = 'withSideRail',
  mobileActionBar,
  sideRailClassName,
  actionBarBreakpoint = 'md',
  className,
}: PageShellProps) {
  const showSideRail = variant === 'withSideRail' && sideRail;
  const actionBarHide = actionBarBreakpoint === 'lg' ? 'lg:hidden' : 'md:hidden';
  return (
    <div className={cn('min-h-full bg-background text-foreground', className)}>
      {/* One shared max-width column for hero + tabs + body: the cap is what
          keeps detail pages composed on wide screens, and because every band
          carries the same PANE_X gutter, their left edges stay on one grid. */}
      <div className="mx-auto w-full max-w-8xl">
        {/* Entrance stagger (2026-08-05 motion pass): hero → tabs → columns. */}
        {hero && <div className="motion-rise">{hero}</div>}
        {tabs && <div className="motion-rise motion-rise-2">{tabs}</div>}
        {/* Single render path — responsive via one-column→md:grid. A second path
            mounts children twice, breaking hook state + form ownership.
            W09 P2 · fix 2026-04-21. */}
        <div
          className={cn(
            PANE_X,
            'grid items-start gap-6 pb-10 pt-6 md:pb-12 md:pt-8',
            showSideRail && 'md:grid-cols-[1.4fr_1fr]',
          )}
        >
          <main className="flex min-w-0 flex-col gap-6 motion-rise motion-rise-2">{main}</main>
          {showSideRail && (
            <aside className={cn('flex min-w-0 flex-col gap-6 motion-rise motion-rise-3', sideRailClassName)}>
              {sideRail}
            </aside>
          )}
        </div>
      </div>
      {mobileActionBar && (
        <div
          className={cn(
            actionBarHide,
            'sticky bottom-0 left-0 right-0 z-20',
            'px-4 py-2.5 flex items-center gap-2.5',
            'border-t border-border',
            'bg-popover/80',
            'backdrop-blur-md backdrop-saturate-150'
          )}
        >
          {mobileActionBar}
        </div>
      )}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────

interface PageShellHeroProps {
  breadcrumb?: ReactNode;
  title: ReactNode;
  /** Record ID chip under the title (e.g. "PRJ-2154"). */
  recordId?: ReactNode;
  statusTone?: PageShellStatusTone;
  statusLabel?: ReactNode;
  /** Bullet-separated meta line, e.g. `['Singapore', 'Created 12 Apr', 'Updated 2h ago']`. */
  meta?: ReactNode[];
  /** Trailing action row — 2a orders it secondary (ghost) then primary (brown). */
  actions?: ReactNode;
  /** Match the PageShell value — `lg` hides inline hero actions on tablet so they only show on desktop, paired with the action bar showing at < lg. Default `md`. */
  actionBarBreakpoint?: PageShellActionBarBreakpoint;
  className?: string;
}

/** Detail-page hero: breadcrumb + h1 + status pill + meta line + action row. */
export function PageShellHero({
  breadcrumb,
  title,
  recordId,
  statusTone = 'neutral',
  statusLabel,
  meta,
  actions,
  actionBarBreakpoint = 'md',
  className,
}: PageShellHeroProps) {
  const actionsShow = actionBarBreakpoint === 'lg' ? 'hidden lg:inline-flex' : 'hidden md:inline-flex';
  return (
    <div
      className={cn(
        PANE_X,
        'pb-4 pt-6 md:pb-5 md:pt-[34px]',
        'border-b border-border',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {breadcrumb && <div className="mb-4">{breadcrumb}</div>}
      <div className="flex flex-col items-start gap-3.5 md:flex-row md:items-end md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            {/* 2a type scale: the DETAIL title is the 38px step (the list frame
                keeps PageTitle's 28px default). Family/weight stay locked in
                the primitive — only the archetype's size is set here. */}
            <PageTitle className="text-[30px] md:text-[38px]">{title}</PageTitle>
            {statusLabel && <PageShellStatusPill tone={statusTone}>{statusLabel}</PageShellStatusPill>}
          </div>
          {(recordId || (meta && meta.length > 0)) && (
            /* --fg-dim, not --fg-muted: this line sits on the PAGE cream, where
               #7D6B5B is 4.12:1 and fails AA at 13px; #5D4F3F clears 6.40:1 —
               same call as PageDescription/Breadcrumb. */
            <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[13px] text-[color:var(--fg-dim)]">
              {recordId && <span className="font-medium">{recordId}</span>}
              {meta?.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-2.5">
                  {(recordId || i > 0) && <span aria-hidden="true">·</span>}
                  <span>{m}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className={cn(actionsShow, 'items-center gap-2.5')}>{actions}</div>}
      </div>
    </div>
  );
}

// ─── Side-rail container ─────────────────────────────────────

export function PageShellSideRail({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-6', className)}>{children}</div>;
}
