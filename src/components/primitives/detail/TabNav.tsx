/**
 * TabNav — Horizontal detail-page tabs with a brown active underline.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-tabnav.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/TabNav.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked:
 *  - 40px (md) / 36px (sm) row height. 2px underline on active (`--primary`,
 *    the Kopi brown — one of the sanctioned brown-as-punctuation slots).
 *  - Count chip right-aligned in tab, soft brown tint when the tab is active.
 *
 * Responsive behaviour (added 2026-05-27):
 *  - On narrow viewports (when the natural tab strip exceeds container width),
 *    auto-swap to a dropdown trigger that opens a vertical list of all tabs.
 *    The strip stays mounted off-screen for continued measurement so the
 *    component flips back to tabs once the container widens enough.
 *  - See `src/hooks/useTabsOverflow.ts` + mobile-web rule.
 */

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTabsOverflow } from '@/hooks/useTabsOverflow';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/primitives/overlays';

export type TabNavItem = {
  value: string;
  label: string;
  count?: number | null;
  disabled?: boolean;
  /**
   * Playwright anchor (kebab-case, surface-prefixed, e.g.
   * `account-settings-tab-security`). Rendered on the underline-strip tab
   * button ONLY — the overflow dropdown re-renders the same tabs, and
   * duplicating the id there breaks strict-mode lookups (see
   * tests/lessons.md 2026-06-01, StatusTabs entry).
   */
  testId?: string;
};

export type TabNavSize = 'sm' | 'md';

interface TabNavProps {
  tabs: TabNavItem[];
  value: string;
  onChange?: (next: string) => void;
  size?: TabNavSize;
  sticky?: boolean;
  className?: string;
}

export function TabNav({ tabs, value, onChange, size = 'md', sticky = false, className }: TabNavProps) {
  const rowH = size === 'sm' ? 'h-9' : 'h-10';
  const fontSize = size === 'sm' ? 'text-[12.5px]' : 'text-[13px]';
  const { stripRef, overflow } = useTabsOverflow();
  const [open, setOpen] = useState(false);
  const activeTab = tabs.find((t) => t.value === value);

  const renderCount = (count: number, isActive: boolean) => (
    <span
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-[1px] rounded-full text-[10.5px] font-medium tracking-wide',
        // 10.5px chip → AA-safe --brown-text, never raw --primary (4.00 on page cream, misses
        // AA as small type). Inactive arm takes --fg-dim; --fg-muted is 4.37:1 on the tint.
        isActive
          ? 'bg-[color:var(--accent-red-soft-bg)] text-[color:var(--accent-red-soft-fg)]'
          : 'bg-secondary text-[color:var(--fg-dim)]'
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {count}
    </span>
  );

  return (
    <div
      className={cn(
        sticky && 'sticky top-0 z-20',
        'relative bg-[color:var(--surface-translucent-bg)] backdrop-blur-md backdrop-saturate-150',
        'border-b border-border',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Tab strip — always mounted so the overflow hook can measure it.
       * `role="tablist"` lives on the strip, NOT the outer container: on overflow the strip
       * goes `inert`, so role + children must leave the a11y tree together. On the outer
       * container it left an empty <div role="tablist"> (axe aria-required-children). */}
      <div
        ref={stripRef}
        role="tablist"
        className={cn(
          'flex flex-nowrap px-3 md:px-8',
          overflow && 'absolute inset-x-0 top-0 opacity-0 pointer-events-none -z-10'
        )}
        {...(overflow ? { inert: '' as unknown as undefined } : {})}
      >
        {tabs.map((tab) => {
          const isActive = tab.value === value;
          const isDisabled = !!tab.disabled;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={isDisabled}
              data-testid={tab.testId}
              tabIndex={overflow ? -1 : 0}
              onClick={() => !isDisabled && onChange?.(tab.value)}
              className={cn(
                rowH,
                fontSize,
                'px-3.5 -mb-px inline-flex items-center gap-2 flex-shrink-0 whitespace-nowrap',
                'border-b-2 transition-colors',
                isActive
                  ? 'border-primary font-semibold text-foreground'
                  : 'border-transparent font-medium text-muted-foreground hover:text-foreground hover:bg-secondary',
                'active:translate-y-[1px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {tab.label}
              {tab.count != null && renderCount(tab.count, isActive)}
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
                rowH,
                fontSize,
                'w-full px-3 inline-flex items-center justify-between gap-2',
                'border-b-2 border-primary -mb-px',
                'font-semibold text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="truncate">{activeTab?.label ?? 'Select…'}</span>
                {activeTab?.count != null && renderCount(activeTab.count, true)}
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] flex flex-col p-1"
          >
            <ul role="tablist" className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {tabs.map((tab) => {
                const isActive = tab.value === value;
                const isDisabled = !!tab.disabled;
                return (
                  <li key={tab.value} role="presentation">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        onChange?.(tab.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 inline-flex items-center justify-between gap-2 rounded',
                        fontSize,
                        isActive
                          ? 'bg-[color:var(--accent-red-soft-bg)] text-[color:var(--accent-red-soft-fg)] font-semibold'
                          // --fg-dim survives the hover tint; --fg-muted drops to 4.37:1 on it.
                          : 'text-[color:var(--fg-dim)] hover:bg-secondary',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span className="truncate text-left">{tab.label}</span>
                        {tab.count != null && renderCount(tab.count, isActive)}
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
}
