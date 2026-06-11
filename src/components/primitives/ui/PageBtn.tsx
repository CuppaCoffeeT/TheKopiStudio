/**
 * PageBtn — 32×32 square page button used by Pagination. default/active/hover/disabled.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 32×32 square · CTA slate-800 when active · Geist Mono tabular-nums · hover zinc-100.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface PageBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const PageBtn = forwardRef<HTMLButtonElement, PageBtnProps>(function PageBtn(
  { active = false, disabled, className, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-8 h-8 rounded-md inline-flex items-center justify-center',
        'text-[12px]',
        active ? 'font-semibold' : 'font-medium',
        'border',
        active
          ? 'bg-slate-800 border-slate-800 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900'
          : 'bg-transparent border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        className
      )}
      style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
      {...props}
    >
      {children}
    </button>
  );
});
