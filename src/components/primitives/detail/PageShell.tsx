/**
 * PageShell — Heavyweight detail-page shell (hero · optional tabs · main + optional side-rail).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-pageshell.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/PageShell.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: hero padding 28/40/20/40 desktop (T/R/B/L) · 18/20/14/20 mobile · variants `withSideRail`
 *  (flex row · 2/3 main + 1/3 aside) + `fullWidth` · mobile stacks the side-rail beneath main with a
 *  sticky bottom action bar · h1 = `<PageTitle>` (primitives/shell/PageTitle.tsx), sized/family-locked there.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageTitle } from '@/components/primitives/shell';

export type PageShellVariant = 'withSideRail' | 'fullWidth';

export type PageShellStatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

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
  /** Override aside width classes. Default = locked 300px; pass `md:w-auto` to let the rail content size the column (e.g. collapsible inbox). W09 P3 · 2026-04-21. */
  sideRailClassName?: string;
  /** Breakpoint below which the action bar is visible. Default `md`; pass `lg` for pages that collapse to one column at < lg. */
  actionBarBreakpoint?: PageShellActionBarBreakpoint;
  className?: string;
}

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
      {hero}
      {tabs}
      {/* Single render path — responsive via flex-col→md:flex-row. A second path mounts
          children twice, breaking hook state + form ownership. W09 P2 · fix 2026-04-21. */}
      <div className="flex flex-col md:flex-row md:items-start md:gap-8 px-4 py-4 md:px-10 md:pt-6 md:pb-10">
        <main className="flex-1 min-w-0">{main}</main>
        {showSideRail && (
          <aside
            className={cn(
              'mt-4 md:mt-0 flex flex-col gap-4',
              sideRailClassName ?? 'md:w-[300px] md:flex-shrink-0',
            )}
          >
            {sideRail}
          </aside>
        )}
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
  /** Monospace record ID chip (e.g. "PRJ-2154"). */
  recordId?: ReactNode;
  statusTone?: PageShellStatusTone;
  statusLabel?: ReactNode;
  /** Bullet-separated mono meta line, e.g. `['Singapore', 'Created 12 Apr', 'Updated 2h ago']`. */
  meta?: ReactNode[];
  /** Trailing action button row (ghost + ghost + primary is the canonical pattern). */
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
        'px-5 md:px-10 pt-[18px] md:pt-7 pb-3.5 md:pb-5',
        'bg-background',
        'border-b border-border',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {breadcrumb}
      <div className="mt-3 flex flex-col md:flex-row md:items-end items-start gap-3.5 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <PageTitle>{title}</PageTitle>
            {statusLabel && <PageShellStatusPill tone={statusTone}>{statusLabel}</PageShellStatusPill>}
          </div>
          {(recordId || (meta && meta.length > 0)) && (
            /* --fg-dim, not --fg-muted: on the hero's page cream #7D6B5B is 4.12:1 and fails
               AA at 11.5px; #5D4F3F clears 6.40:1 — same call as PageDescription/Breadcrumb. */
            <div
              className="mt-2 flex flex-wrap items-center gap-2.5 text-[11.5px] text-[color:var(--fg-dim)] tracking-wide"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {recordId && <span className="text-[color:var(--fg-dim)] font-medium">{recordId}</span>}
              {meta?.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-2.5">
                  {(recordId || i > 0) && <span aria-hidden="true" className="text-[color:var(--fg-dim)]">·</span>}
                  <span>{m}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className={cn(actionsShow, 'items-center gap-2')}>{actions}</div>}
      </div>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────

/** 2a status = three meanings — sage positive · brown in-progress · terracotta error, with
 *  muted neutrals for inert. Tone NAMES are the frozen prop API; each resolves to a
 *  `--status-*` pair (tint fill + darkened same-hue text), never a saturated Tailwind swatch.
 *
 *  These pills sit on PageShellHero's `bg-background` (page cream) — one step DARKER than
 *  the card cream the pairs were tuned on. Only `info` is affected: brown@14% tint composites
 *  to ~#E2D5C2 there and drops --status-revised-fg to 4.05:1 at 10.5px, so it takes the
 *  page-ground step (5.00:1); the other four clear unchanged. Deepen the TEXT, not the tint —
 *  the pill sits on the lighter ground here, not the darker one. */
const STATUS_PILL: Record<PageShellStatusTone, string> = {
  neutral: 'bg-[color:var(--status-expired-bg)] text-[color:var(--status-expired-fg)]',
  success: 'bg-[color:var(--status-accepted-bg)] text-[color:var(--status-accepted-fg)]',
  warning: 'bg-[color:var(--status-sent-bg)] text-[color:var(--status-sent-fg)]',
  danger: 'bg-[color:var(--status-rejected-bg)] text-[color:var(--status-rejected-fg)]',
  info: 'bg-[color:var(--status-revised-bg)] text-[color:var(--status-revised-fg-on-page)]',
};

function PageShellStatusPill({ tone, children }: { tone: PageShellStatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full',
        'text-[10.5px] font-medium uppercase tracking-wide leading-snug',
        STATUS_PILL[tone]
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

// ─── Side-rail container ─────────────────────────────────────

export function PageShellSideRail({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>;
}
