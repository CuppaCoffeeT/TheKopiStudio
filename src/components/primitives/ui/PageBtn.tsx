/**
 * PageBtn — 32×32 square page button used by Pagination. default/active/hover/disabled.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 32×32 square · brown CTA fill + cream label when active (--primary /
 * --primary-foreground) · tabular-nums figures · idle is a hairline outline
 * with a --fg-dim numeral, which survives the tint hover fill (bg-secondary) at
 * 6.79:1 — --fg-muted would drop to 4.37:1 there and fail AA at 12px.
 *
 * 2a "Kopi House" (2026-07-25): the numeral is IBM Plex Sans with tabular
 * figures, not the mono stack — 2a has no mono anywhere, and `tabular-nums`
 * already keeps every page button the same width.
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
          ? 'bg-primary border-primary text-primary-foreground'
          : 'bg-transparent border-border text-[color:var(--fg-dim)] hover:bg-secondary',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}
      {...props}
    >
      {children}
    </button>
  );
});
