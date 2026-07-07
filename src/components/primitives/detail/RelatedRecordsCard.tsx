/**
 * RelatedRecordsCard — Side-rail card listing related entities (contacts · projects · invoices).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-related-records.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/RelatedRecordsCard.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked:
 *  - Hover = white bg + shadow-sm (not zinc-100, which matches page-bg → invisible).
 *  - Row min-height 44px — matches mobile tap-target rule.
 *  - Avatar is initials-based; falls back to `•` glyph when initials omitted.
 */

import type { ElementType, MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/** External URL guard — SPA <Link> only for internal paths. */
const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

export type RelatedRecordItem = {
  id: string;
  name: ReactNode;
  subLabel?: ReactNode;
  initials?: string;
  href?: string;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
};

interface RelatedRecordsCardProps {
  title: string;
  count?: number;
  items: RelatedRecordItem[];
  onAdd?: () => void;
  onMenu?: () => void;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
  emptyLabel?: string;
}

export function RelatedRecordsCard({
  title,
  count,
  items,
  onAdd,
  onMenu,
  viewAllHref,
  viewAllLabel,
  className,
  emptyLabel = 'No related records',
}: RelatedRecordsCardProps) {
  const effectiveCount = count ?? items.length;
  return (
    <section
      className={cn(
        'rounded-[10px] overflow-hidden',
        'border border-border',
        'bg-card',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Header */}
      <header
        className="px-3.5 pt-3 pb-2.5 flex items-center gap-2 border-b border-border"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <span className="text-[10.5px] text-muted-foreground tracking-wide">· {effectiveCount}</span>
        <div className="flex-1" />
        {onMenu && (
          <button
            type="button"
            aria-label={`${title} menu`}
            onClick={onMenu}
            className={cn(
              'w-5.5 h-5.5 rounded inline-flex items-center justify-center text-muted-foreground',
              'hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
        )}
      </header>

      {/* Rows */}
      <div>
        {items.length === 0 ? (
          <div className="px-3.5 py-6 text-center text-[12.5px] text-muted-foreground">{emptyLabel}</div>
        ) : (
          items.map((item, i) => {
            const isLast = i === items.length - 1;
            const useLink = item.href && !isExternal(item.href);
            const Tag: ElementType = useLink ? Link : item.href ? 'a' : 'button';
            return (
              <Tag
                key={item.id}
                {...(useLink ? { to: item.href } : item.href ? { href: item.href } : {})}
                type={item.href ? undefined : 'button'}
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  'group flex items-center gap-2.5 w-full text-left',
                  'min-h-11 px-3.5 py-2 no-underline',
                  !isLast && 'border-b border-border',
                  'text-foreground',
                  'hover:bg-card hover:shadow-[inset_0_0_0_1px_#ececee,0_1px_2px_rgba(24,24,27,0.04)]',
                  'dark:hover:bg-white/[0.04] dark:hover:shadow-none',
                  'active:translate-x-[1px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-ring-offset-2',
                  item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                )}
              >
                <span
                  className="w-7 h-7 rounded-full inline-flex items-center justify-center flex-shrink-0 text-[10.5px] font-semibold bg-primary text-primary-foreground"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {item.initials ?? '•'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{item.name}</div>
                  {item.subLabel && (
                    <div
                      className="mt-px text-[10.5px] text-muted-foreground tracking-wide"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {item.subLabel}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              </Tag>
            );
          })
        )}
      </div>

      {/* Footer */}
      {(onAdd || viewAllHref) && (
        <footer className="flex items-center gap-1.5 px-2.5 py-2 border-t border-border">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className={cn(
                'h-7 px-2.5 rounded-[5px] inline-flex items-center gap-1.5',
                'text-[12px] font-medium text-muted-foreground',
                'hover:bg-secondary',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <Plus className="w-2.5 h-2.5" />
              Add
            </button>
          )}
          <div className="flex-1" />
          {viewAllHref && (
            isExternal(viewAllHref) ? (
              <a
                href={viewAllHref}
                className="px-1.5 text-[11.5px] text-muted-foreground hover:text-foreground no-underline"
              >
                {viewAllLabel ?? `View all ${effectiveCount}`} →
              </a>
            ) : (
              <Link
                to={viewAllHref}
                className="px-1.5 text-[11.5px] text-muted-foreground hover:text-foreground no-underline"
              >
                {viewAllLabel ?? `View all ${effectiveCount}`} →
              </Link>
            )
          )}
        </footer>
      )}
    </section>
  );
}
