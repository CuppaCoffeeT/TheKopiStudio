import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  /** Collapse to first + … + last-two if more than 4 segments. */
  truncate?: boolean;
  className?: string;
}

/**
 * Segmented breadcrumb nav — replaces back-button on every page.
 * Last segment bold. Hover underline red-700. Middle-ellipsis /…/ when deep.
 */
export function Breadcrumb({ segments, truncate = true, className }: BreadcrumbProps) {
  const visible =
    truncate && segments.length > 4
      ? [segments[0], { label: '…', ellipsis: true }, segments[segments.length - 2], segments[segments.length - 1]]
      : segments.map((s) => ({ ...s, ellipsis: false }));

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('inline-flex items-center gap-2 text-[13px] leading-none', className)}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {visible.map((s, i) => {
        const isLast = i === visible.length - 1;
        const isEllipsis = 'ellipsis' in s && s.ellipsis;
        return (
          <span key={i} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-zinc-600 dark:text-zinc-500 text-xs" aria-hidden="true">/</span>}
            {isEllipsis ? (
              <span className="text-zinc-600 dark:text-zinc-500">…</span>
            ) : s.href || s.onClick ? (
              <Link
                to={s.href ?? '#'}
                onClick={
                  s.onClick
                    ? (e) => {
                        if (!s.href) e.preventDefault();
                        s.onClick?.();
                      }
                    : undefined
                }
                className={cn(
                  'hover:underline decoration-red-700 dark:decoration-red-400 underline-offset-[3px]',
                  isLast
                    ? 'font-semibold text-zinc-900 dark:text-zinc-50'
                    : 'font-normal text-zinc-600 dark:text-zinc-400'
                )}
              >
                {s.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast
                    ? 'font-semibold text-zinc-900 dark:text-zinc-50'
                    : 'font-normal text-zinc-600 dark:text-zinc-400'
                )}
              >
                {s.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
