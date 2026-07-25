/**
 * EditableListCard — mobile inline-edit row primitive (peer of MobileListCard).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-26-9eon4QqA/project/project/preview/component-editable-list-card.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-05-26-9eon4QqA/project/ui_kits/appbase/src/ui/EditableListCard.jsx
 * Adopters: tracked in DESIGN_CATALOG_PRIMITIVES.md.
 *
 * Locked: bg-card (#FAF6EE card cream — LIFTS off the #F0E6D6 page; the 2a
 *         surface ladder runs page → card → raised, lightest last) ·
 *         1px --border hairline · radius 10 · pad 12 · gap 10 ·
 *         disabled = opacity-50 + pointer-events-none on whole card ·
 *         same 14px outer gutter as MobileListCard so mixed lists align.
 *
 * Hard contract: primitive owns NO state. Controls + footer are caller-rendered.
 *                Disabled blocks pointer events on the whole card.
 *
 * Choose by archetype:
 *   - LIST (click-through to detail) → MobileListCard
 *   - TOOL (inline edit) → EditableListCard
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type EditableListCardState = 'default' | 'hover' | 'active' | 'focus' | 'disabled';

/**
 * Visual chrome variant.
 * - `'flat'` (default) — border-b divider only, no outer border/radius. For use inside
 *   `<DataTable mobileBody>` where the DataTable shell already provides the outer rounded
 *   border. Matches `MobileListCard` so mixed lists read as one continuous container.
 * - `'card'` — full per-row card with border + rounded-10 + p-3. For standalone use
 *   outside a list (e.g. a single editable row on a detail page).
 */
export type EditableListCardVariant = 'flat' | 'card';

export interface EditableListCardHeader {
  index?: number | string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailingBadge?: React.ReactNode;
}

export interface EditableListCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  state?: EditableListCardState;
  variant?: EditableListCardVariant;
  header?: EditableListCardHeader;
  /** Flex-wrap row of caller-rendered form controls (Select, Input, Checkbox, TimePicker, …). */
  controls?: React.ReactNode[];
  /** Optional full-width secondary row — typically a remarks Input or Textarea. */
  footer?: React.ReactNode;
  /** Escape hatch — rarely needed. */
  children?: React.ReactNode;
  testId?: string;
}

export const EditableListCard = forwardRef<HTMLDivElement, EditableListCardProps>(
  function EditableListCard(
    { state = 'default', variant = 'flat', header, controls, footer, children, testId, className, onClick, ...rest },
    ref,
  ) {
    const isDisabled = state === 'disabled';
    const isFocus = state === 'focus';
    const isHoverOrActive = state === 'hover' || state === 'active';
    const isCard = variant === 'card';

    return (
      <div
        ref={ref}
        data-testid={testId}
        tabIndex={onClick && !isDisabled ? 0 : undefined}
        onClick={isDisabled ? undefined : onClick}
        {...rest}
        className={cn(
          'flex flex-col gap-2.5 transition-[background,border-color,box-shadow] duration-150',
          'bg-card',
          'text-foreground',
          isCard
            ? 'rounded-[10px] border border-border p-3'
            : 'border-b border-border last:border-b-0 px-[14px] py-3',
          isHoverOrActive && 'bg-secondary',
          isFocus && isCard && 'border-ring ring-[3px] ring-ring/15',
          isFocus && !isCard && 'ring-2 ring-inset ring-ring',
          isDisabled && 'opacity-50 pointer-events-none cursor-not-allowed',
          !isDisabled && onClick && 'cursor-pointer',
          !isDisabled && onClick && isCard && 'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15',
          !isDisabled && onClick && !isCard && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          '[-webkit-tap-highlight-color:transparent]',
          className,
        )}
      >
        {header && (
          <div className="flex items-center gap-2 min-w-0">
            {header.index != null && (
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className="w-5 shrink-0 text-[11px] tabular-nums text-[color:var(--fg-dim)] tracking-[0.02em]"
              >
                {header.index}
              </span>
            )}
            <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
              <span className="text-sm font-semibold tracking-[-0.005em] text-foreground truncate max-w-full">
                {header.title}
              </span>
              {header.subtitle && (
                <span
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="text-[11px] text-[color:var(--fg-dim)] tabular-nums whitespace-nowrap"
                >
                  {header.subtitle}
                </span>
              )}
            </div>
            {header.trailingBadge && (
              <span className="shrink-0 ml-auto">{header.trailingBadge}</span>
            )}
          </div>
        )}

        {controls && controls.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {controls.map((ctrl, i) => (
              <span key={i} className="contents">
                {ctrl}
              </span>
            ))}
          </div>
        )}

        {footer && <div className="w-full">{footer}</div>}

        {children}
      </div>
    );
  },
);
