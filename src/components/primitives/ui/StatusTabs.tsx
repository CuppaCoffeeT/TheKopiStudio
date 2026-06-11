/**
 * StatusTabs — segment tabs with count pills (e.g. "All 487 · Drafts 24 · Sent 186").
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTable.html
 * Updated: docs/99-refactor/_system/design/handoffs/2026-04-28-OOvqzmEe/project/preview/component-status-tabs.html
 *          (axe-playwright fixes · 2026-04-28 · contrast bump + opt-in aria-controls)
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/DataTable.jsx#L450-L481 (PageChrome STATES.map)
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: desktop underline tab (2px fg bar, marginBottom:-1 overlap) · count badge (red tone for alert).
 *
 * Responsive behaviour (added 2026-05-27):
 *  - Auto-detects when the tab strip overflows the container and swaps to a
 *    dropdown trigger that opens the full list. The strip stays mounted
 *    off-screen for continued measurement so the component flips back to
 *    tabs once the container widens enough.
 *  - See `src/hooks/useTabsOverflow.ts` + mobile-web rule.
 *
 * 2026-04-28 axe-playwright fixes:
 *  · contrast — inactive label `text-zinc-500` → `text-zinc-600` (light), `dark:text-zinc-400` → `dark:text-zinc-300`
 *  · aria-valid-attr-value — `aria-controls` is now opt-in via the `panelIdPrefix` prop.
 */

import { forwardRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTabsOverflow } from '@/hooks/useTabsOverflow';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/primitives/overlays/Popover';

export type StatusTabTone = 'default' | 'warn' | 'alert';

export interface StatusTab {
  key: string;
  label: string;
  count?: number;
  tone?: StatusTabTone;
  /** Forwarded as `data-testid` on the tab button — for Playwright per-tab selection. */
  testId?: string;
}

export interface StatusTabsProps {
  tabs: StatusTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
  'aria-label'?: string;
  /**
   * When provided, each tab button emits `aria-controls={`${panelIdPrefix}-panel-${tab.key}`}`.
   * The caller MUST render a matching `<div id="{prefix}-panel-{key}" role="tabpanel">` for each tab.
   * Omit for filter-chip usage where there are no paired panels (the default).
   */
  panelIdPrefix?: string;
}

function CountPill({ count, tone, active }: { count: number; tone?: StatusTabTone; active: boolean }) {
  const alert = tone === 'alert';
  const warn = tone === 'warn';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-1.5 py-px text-[10px]',
        alert
          ? 'bg-red-700 text-white border-red-700 dark:bg-red-400 dark:text-zinc-900 dark:border-red-400'
          : warn
            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
            : active
              ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700'
              : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800'
      )}
      style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
    >
      {count.toLocaleString('en-SG')}
    </span>
  );
}

export const StatusTabs = forwardRef<HTMLDivElement, StatusTabsProps>(function StatusTabs(
  { tabs, activeTab, onTabChange, className, 'aria-label': ariaLabel = 'Filter by status', panelIdPrefix },
  ref
) {
  const { stripRef, overflow } = useTabsOverflow();
  const [open, setOpen] = useState(false);
  const active = tabs.find((t) => t.key === activeTab);

  return (
    <div
      ref={ref}
      className={cn(
        'relative border-b border-zinc-200 dark:border-zinc-800',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Tab strip — always mounted so the overflow hook can measure it.
       * `role="tablist"` stays on this container in BOTH modes so the child
       * `role="tab"` buttons always have a valid tablist parent (axe
       * `aria-required-parent` rule). When overflow, the strip is positioned
       * off-screen + opacity-0 + pointer-events-none and children carry
       * tabIndex=-1 — it's measurable but not user-reachable. */}
      <div
        ref={stripRef}
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'flex flex-nowrap items-center gap-1',
          overflow && 'absolute inset-x-0 top-0 opacity-0 pointer-events-none -z-10'
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const ariaControls = panelIdPrefix ? `${panelIdPrefix}-panel-${tab.key}` : undefined;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={ariaControls}
              tabIndex={overflow ? -1 : 0}
              data-state={isActive ? 'active' : 'inactive'}
              data-testid={tab.testId}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] flex-shrink-0 whitespace-nowrap',
                '-mb-px border-b-2 transition-colors',
                isActive
                  ? 'border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50 font-semibold'
                  : 'border-transparent text-zinc-600 dark:text-zinc-300 font-medium hover:text-zinc-900 dark:hover:text-zinc-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              <span>{tab.label}</span>
              {tab.count != null && <CountPill count={tab.count} tone={tab.tone} active={isActive} />}
            </button>
          );
        })}
      </div>

      {/* Dropdown fallback — only rendered when the strip overflows the container. */}
      {overflow && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full px-3 py-2 inline-flex items-center justify-between gap-2',
                'border-b-2 border-zinc-900 dark:border-zinc-50 -mb-px',
                'text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400'
              )}
            >
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span className="truncate">{active?.label ?? 'Select…'}</span>
                {active?.count != null && <CountPill count={active.count} tone={active.tone} active />}
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform', open && 'rotate-180')} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] flex flex-col p-1"
          >
            <ul role="tablist" aria-label={ariaLabel} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <li key={tab.key} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      data-testid={tab.testId}
                      onClick={() => {
                        onTabChange(tab.key);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 inline-flex items-center justify-between gap-2 rounded text-[12.5px]',
                        isActive
                          ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-left">{tab.label}</span>
                        {tab.count != null && <CountPill count={tab.count} tone={tab.tone} active={isActive} />}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});
