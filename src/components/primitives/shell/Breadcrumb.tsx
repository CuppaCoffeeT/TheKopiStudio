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
 *
 * Since the 2a masthead retirement (2026-07-25) this is CONTENT, not chrome:
 * it renders as quiet inline text at the top of the content column, exactly as
 * the 2a Detail comp shows it ("Clients / Marcus Tan"). 12px per KOPI_2A_SPEC →
 * Type scale; the current segment is plain ink, earlier segments + separators
 * take `--fg-dim` (not `--fg-muted`, which measures 4.12:1 on the page cream and
 * misses AA — same call as PageShellHero's meta line).
 *
 * Hover underline is brown (`decoration-primary`). Middle-ellipsis /…/ when deep.
 */
export function Breadcrumb({ segments, truncate = true, className }: BreadcrumbProps) {
  const visible =
    truncate && segments.length > 4
      ? [segments[0], { label: '…', ellipsis: true }, segments[segments.length - 2], segments[segments.length - 1]]
      : segments.map((s) => ({ ...s, ellipsis: false }));

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('inline-flex flex-wrap items-center gap-2 text-[12px] leading-none', className)}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {visible.map((s, i) => {
        const isLast = i === visible.length - 1;
        const isEllipsis = 'ellipsis' in s && s.ellipsis;
        return (
          <span key={i} className="inline-flex items-center gap-2">
            {i > 0 && <span className="text-[color:var(--fg-dim)] text-xs" aria-hidden="true">/</span>}
            {isEllipsis ? (
              <span className="text-[color:var(--fg-dim)]">…</span>
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
                  'font-normal hover:underline decoration-primary underline-offset-[3px]',
                  isLast ? 'text-foreground' : 'text-[color:var(--fg-dim)]'
                )}
              >
                {s.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'font-normal',
                  isLast ? 'text-foreground' : 'text-[color:var(--fg-dim)]'
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
