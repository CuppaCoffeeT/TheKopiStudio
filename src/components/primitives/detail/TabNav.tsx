/**
 * TabNav — Horizontal detail-page tabs with red-700 active underline.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-tabnav.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/TabNav.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked:
 *  - 40px (md) / 36px (sm) row height. 2px underline on active (red-700 · dark:red-400).
 *  - Count chip right-aligned in tab, red-tint background when the tab is active.
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
        isActive
          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
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
        'relative bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md backdrop-saturate-150',
        'border-b border-zinc-100 dark:border-zinc-900',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Tab strip — always mounted so the overflow hook can measure it.
       * `role="tablist"` lives on the strip itself, NOT the outer container,
       * so when overflow trips and the strip goes `inert`, the role+children
       * leave the a11y tree together. Putting it on the outer container left
       * an empty <div role="tablist"> (axe aria-required-children) because
       * inert hides the children from a11y. */}
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
              tabIndex={overflow ? -1 : 0}
              onClick={() => !isDisabled && onChange?.(tab.value)}
              className={cn(
                rowH,
                fontSize,
                'px-3.5 -mb-px inline-flex items-center gap-2 flex-shrink-0 whitespace-nowrap',
                'border-b-2 transition-colors',
                isActive
                  ? 'border-red-700 dark:border-red-400 font-semibold text-zinc-900 dark:text-zinc-50'
                  : 'border-transparent font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-white dark:hover:bg-zinc-900',
                'active:translate-y-[1px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:rounded',
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
                'border-b-2 border-red-700 dark:border-red-400 -mb-px',
                'font-semibold text-zinc-900 dark:text-zinc-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400'
              )}
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="truncate">{activeTab?.label ?? 'Select…'}</span>
                {activeTab?.count != null && renderCount(activeTab.count, true)}
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-500 transition-transform', open && 'rotate-180')} />
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
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold'
                          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900',
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
