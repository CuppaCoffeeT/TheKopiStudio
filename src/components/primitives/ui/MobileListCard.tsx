/**
 * MobileListCard — mobile row replacement: title · subtitle · meta · right-slot.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: min-h 72 (>= 44h tap target) · selected = --row-selected brown wash +
 * 3px brown left rail · meta in the mono stack, tabular-nums.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type MobileListCardState = 'default' | 'hover' | 'selected';

export interface MobileListCardProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: MobileListCardState;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  /**
   * When true, drop the spec's `whitespace-nowrap overflow-hidden text-ellipsis`
   * from the subtitle slot. Use for structured subtitles like `<ProjectCell>`
   * that have their own multi-line clamp (line-clamp-3 + break-words). When
   * false (default), short plain-text subtitles single-line + ellipsis per
   * design spec.
   */
  subtitleWrap?: boolean;
}

export const MobileListCard = forwardRef<HTMLDivElement, MobileListCardProps>(
  function MobileListCard(
    { state = 'default', title, subtitle, meta, right, className, subtitleWrap = false, ...props },
    ref
  ) {
    const hasOnClick = !!props.onClick;
    return (
      <div
        ref={ref}
        // Always role="listitem" so the parent role="list" wrapper (in DataTable) has
        // valid children. Clickability is preserved via onClick (div handlers work);
        // adding role="button" would (a) invalidate the parent list role and (b) trip
        // axe's nested-interactive when the right slot contains buttons.
        role="listitem"
        tabIndex={hasOnClick ? 0 : undefined}
        aria-current={hasOnClick && state === 'selected' ? 'true' : undefined}
        className={cn(
          'group relative flex items-center gap-3 px-[14px] py-3',
          'min-h-[72px]',
          hasOnClick && 'cursor-pointer',
          'border-b border-border',
          'bg-card',
          state === 'hover' && 'bg-secondary',
          state !== 'selected' && hasOnClick && 'hover:bg-secondary',
          state === 'selected' &&
            'bg-[color:var(--row-selected)] hover:bg-primary/[0.16]',
          'text-foreground',
          hasOnClick && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        {state === 'selected' && (
          <span
            aria-hidden
            className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </div>
          {subtitle && (
            <div
              className={cn(
                'text-[12px] text-[color:var(--fg-dim)] mt-[2px]',
                subtitleWrap ? 'break-words' : 'whitespace-nowrap overflow-hidden text-ellipsis',
              )}
            >
              {subtitle}
            </div>
          )}
          {meta && (
            <div
              className="flex flex-wrap gap-2 mt-1 text-[11px] text-[color:var(--fg-dim)]"
              style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}
            >
              {meta}
            </div>
          )}
        </div>
        {right && (
          <div className="shrink-0 flex items-center gap-2">{right}</div>
        )}
      </div>
    );
  }
);
