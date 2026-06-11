/**
 * AIPanel — shared shell for AI annotations on detail pages.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-ai · .ei-ai-hd · .ei-ai-body · .ei-ai-actions`)
 * Adopters: AIClassificationPanel, AIOverrideClassificationPanel, AIDraftReplyPanel.
 * Reusable anywhere AI surfaces inline annotations on a detail record.
 *
 * Three accent variants:
 *   - `green` — confirmed / successful classification
 *   - `blue`  — informational / override / pending draft
 *   - `amber` — warning / requires attention
 *
 * Slots: `icon` (header leading 14x14) · `title` · `statusPill?` · children
 * (body) · `actions` (footer row).
 */

import { forwardRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AIPanelAccent = 'green' | 'blue' | 'amber';
export type AIPanelStatusTone = 'green' | 'blue' | 'amber' | 'neutral';

interface AIPanelProps {
  accent: AIPanelAccent;
  icon: ReactNode;
  title: string;
  /** Right-aligned mono status pill. */
  statusPill?: ReactNode;
  /** Body content. */
  children: ReactNode;
  /** Footer action row. */
  actions?: ReactNode;
  /** Extra content rendered after actions, inside the card (e.g. history trail). */
  footer?: ReactNode;
  /** Compact summary rendered inside the header when collapsed. */
  summary?: ReactNode;
  /** If true, the card is collapsible via a chevron button in the header. */
  collapsible?: boolean;
  /** Default collapse state when `collapsible`. Defaults to `true`. */
  defaultCollapsed?: boolean;
  className?: string;
}

const ACCENT_STRIP: Record<AIPanelAccent, string> = {
  green: 'bg-emerald-600 dark:bg-emerald-500',
  blue: 'bg-blue-700 dark:bg-blue-500',
  amber: 'bg-amber-600 dark:bg-amber-500',
};

export const AIPanel = forwardRef<HTMLDivElement, AIPanelProps>(function AIPanel(
  {
    accent,
    icon,
    title,
    statusPill,
    children,
    actions,
    footer,
    summary,
    collapsible = false,
    defaultCollapsed = true,
    className,
  },
  ref,
) {
  const [collapsed, setCollapsed] = useState(collapsible ? defaultCollapsed : false);
  const effectiveCollapsed = collapsible && collapsed;

  return (
    <section
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        'bg-white dark:bg-zinc-950',
        'border-zinc-200/80 dark:border-zinc-800/80',
        'shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <span
        aria-hidden
        className={cn('absolute left-0 top-0 bottom-0 w-[3px]', ACCENT_STRIP[accent])}
      />
      <header
        className={cn(
          'flex items-center gap-2 px-4 pl-5 pr-3 py-2.5',
          !effectiveCollapsed && 'border-b border-zinc-100 dark:border-zinc-800/60',
        )}
      >
        <span className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-400">{icon}</span>
        <h3 className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight shrink-0">
          {title}
        </h3>
        {effectiveCollapsed && summary && (
          <div className="flex-1 min-w-0 flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400 overflow-hidden">
            {summary}
          </div>
        )}
        {statusPill && <span className={cn('shrink-0', !effectiveCollapsed && 'ml-auto')}>{statusPill}</span>}
        {collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            className={cn(
              'w-6 h-6 inline-flex items-center justify-center rounded-md shrink-0',
              'text-zinc-500 dark:text-zinc-400',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400',
            )}
          >
            {collapsed ? (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden />
            )}
          </button>
        )}
      </header>
      {!effectiveCollapsed && (
        <>
          <div className="px-4 pl-5 py-3 text-[12.5px] leading-[1.55] text-zinc-700 dark:text-zinc-300">
            {children}
          </div>
          {actions && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-4 pl-5 py-2.5',
                'border-t border-dashed border-zinc-100 dark:border-zinc-800/60',
              )}
            >
              {actions}
            </div>
          )}
          {footer && (
            <div
              className={cn(
                'px-4 pl-5 py-2.5',
                'border-t border-dashed border-zinc-100 dark:border-zinc-800/60',
              )}
            >
              {footer}
            </div>
          )}
        </>
      )}
    </section>
  );
});

interface AIPanelStatusPillProps {
  tone?: AIPanelStatusTone;
  children: React.ReactNode;
  className?: string;
}

const STATUS_TONE: Record<AIPanelStatusTone, string> = {
  green: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
  neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
};

export function AIPanelStatusPill({
  tone = 'neutral',
  children,
  className,
}: AIPanelStatusPillProps) {
  return (
    <span
      className={cn(
        'text-[9.5px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded',
        STATUS_TONE[tone],
        className,
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </span>
  );
}

/**
 * Button variants used inside `AIPanel.actions`. Matches the spec's 3 button kinds.
 */
interface AIPanelActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  kind?: 'outline' | 'primary' | 'danger' | 'ghost';
}

export const AIPanelActionButton = forwardRef<HTMLButtonElement, AIPanelActionButtonProps>(
  function AIPanelActionButton({ kind = 'outline', className, children, type = 'button', ...props }, ref) {
    const variantClass = {
      outline:
        'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900',
      primary:
        'bg-slate-800 hover:bg-slate-900 text-white border border-transparent font-medium dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900',
      danger:
        'bg-red-700 hover:bg-red-800 text-white border border-transparent font-medium',
      ghost:
        'bg-transparent border border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
    }[kind];
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'h-7 px-2.5 rounded-md inline-flex items-center gap-1.5 text-[12px]',
          variantClass,
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        {children}
      </button>
    );
  },
);
