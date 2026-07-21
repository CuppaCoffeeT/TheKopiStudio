/* eslint-disable react-refresh/only-export-components -- co-locates mapStatusCodeToVariant heuristic with the StatusVariant type it returns; HMR-only gain not worth a split */
/**
 * StatusBadge — W07 atom (promoted 2026-04-19).
 *
 * Session 1 List/Table archetype output. Consumes v4 status-* tokens from
 * src/index.css: 6 variants (draft · sent · accepted · rejected · expired
 * · revised) × light+dark × bg/fg/border/dot. Each variant = semantic colour
 * per construction-ops domain (draft=grey, sent=blue, accepted=green,
 * rejected=red, expired=orange, revised=purple).
 *
 * Deep import per Q-W07-b. No barrel re-export.
 *
 * @see docs/99-refactor/_system/DESIGN_CATALOG.md — Atoms group
 * @see docs/99-refactor/_system/design/session-01-list-table/ — spec origin
 */
import { cn } from '@/lib/utils';

export type StatusVariant = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'revised';

const STYLE_BY_VARIANT: Record<StatusVariant, string> = {
  draft: 'bg-[var(--status-draft-bg)] text-[var(--status-draft-fg)] border-[color:var(--status-draft-border)]',
  sent: 'bg-[var(--status-sent-bg)] text-[var(--status-sent-fg)] border-[color:var(--status-sent-border)]',
  accepted: 'bg-[var(--status-accepted-bg)] text-[var(--status-accepted-fg)] border-[color:var(--status-accepted-border)]',
  rejected: 'bg-[var(--status-rejected-bg)] text-[var(--status-rejected-fg)] border-[color:var(--status-rejected-border)]',
  expired: 'bg-[var(--status-expired-bg)] text-[var(--status-expired-fg)] border-[color:var(--status-expired-border)]',
  revised: 'bg-[var(--status-revised-bg)] text-[var(--status-revised-fg)] border-[color:var(--status-revised-border)]',
};

const DOT_BY_VARIANT: Record<StatusVariant, string> = {
  draft: 'bg-[var(--status-draft-dot)]',
  sent: 'bg-[var(--status-sent-dot)]',
  accepted: 'bg-[var(--status-accepted-dot)]',
  rejected: 'bg-[var(--status-rejected-dot)]',
  expired: 'bg-[var(--status-expired-dot)]',
  revised: 'bg-[var(--status-revised-dot)]',
};

export interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-medium border whitespace-nowrap capitalize',
        STYLE_BY_VARIANT[variant],
        className,
      )}
    >
      <span className={cn('w-[5px] h-[5px] rounded-full shrink-0', DOT_BY_VARIANT[variant])} />
      {children}
    </span>
  );
}

/**
 * Map a raw workflow status code (Supabase `quotation_workflow_status.code`
 * or similar) to a visual variant. Heuristic — refine per-domain as needed.
 */
export function mapStatusCodeToVariant(code: string | null | undefined): StatusVariant {
  if (!code) return 'draft';
  const lower = code.toLowerCase();
  if (lower.includes('draft')) return 'draft';
  if (lower.includes('sent') || lower.includes('pending') || lower.includes('awaiting')) return 'sent';
  if (lower.includes('accept') || lower.includes('approv') || lower.includes('won')) return 'accepted';
  if (lower.includes('reject') || lower.includes('lost') || lower.includes('declin')) return 'rejected';
  if (lower.includes('expir')) return 'expired';
  if (lower.includes('revis') || lower.includes('amend')) return 'revised';
  return 'draft';
}
