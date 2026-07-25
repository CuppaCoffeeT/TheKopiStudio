/**
 * Email category tone palette — single source of truth for the 12 AI categories.
 *
 * Consumed by:
 * - `primitives/shell/EmailCategoryBadge.tsx` (badge + filter variants)
 * - `primitives/shell/EmailSidebar.tsx` (AI-category toggle chips)
 * - `services/email/emailClassificationService.ts` re-exports `EMAIL_CATEGORIES`
 *   that references these tones (Commit 2 of EMAIL_INBOX_PRIMITIVE_LIFT_PLAN).
 *
 * Kopi 2a (2026-07-25): the categorical rainbow is gone. 2a collapses colour to
 * three meanings plus warm neutrals, so every tone below is an alias of a
 * `--status-*` family already defined in src/index.css — no literal hexes here,
 * and retuning a status pill retunes these badges with it:
 *
 *   brown "in flight"  → --status-sent-*    (deep tint) · --status-revised-* (light tint)
 *   sage  "settled"    → --status-accepted-*
 *   terracotta "wrong" → --status-rejected-*
 *   warm neutral       → --status-expired-* (inert) · --status-draft-* (faint)
 *
 * Within a family the DOT carries the sub-distinction; the label text is the
 * real differentiator, colour is support. Badge text renders at 10.5px, so each
 * bg/fg pair clears WCAG AA 4.5:1 composited over card cream #FAF6EE — measured
 * 4.57–6.84, except the error pill at the system-wide locked 4.50.
 *
 * LIGHT-PINNED: one tone set per category. The former `light`/`dark` pair was
 * dead code — ThemeProvider resolves 'light' permanently.
 */

export type EmailCategoryValue =
  | 'quotation_request'
  | 'quotation_response'
  | 'purchase_order'
  | 'invoice_query'
  | 'payment_notification'
  | 'project_update'
  | 'scheduling'
  | 'permit_regulatory'
  | 'complaint_issue'
  | 'internal'
  | 'spam_marketing'
  | 'general';

export interface EmailCategoryToneSet {
  bg: string;
  fg: string;
  border: string;
  dot: string;
}

export interface EmailCategoryDef {
  value: EmailCategoryValue;
  label: string;
  tones: EmailCategoryToneSet;
}

export const EMAIL_CATEGORY_DEFS: readonly EmailCategoryDef[] = [
  {
    value: 'quotation_request',
    label: 'Quotation Request',
    // brown deep tint — 4.61:1
    tones: {
      bg: 'var(--status-sent-bg)',
      fg: 'var(--status-sent-fg)',
      border: 'var(--status-sent-border)',
      dot: 'var(--chart-ramp-1)',
    },
  },
  {
    value: 'quotation_response',
    label: 'Quotation Response',
    // sage — a quote came back — 4.76:1
    tones: {
      bg: 'var(--status-accepted-bg)',
      fg: 'var(--status-accepted-fg)',
      border: 'var(--status-accepted-border)',
      dot: 'var(--brand-sage)',
    },
  },
  {
    value: 'purchase_order',
    label: 'Purchase Order',
    // sage — committed work — 4.76:1
    tones: {
      bg: 'var(--status-accepted-bg)',
      fg: 'var(--status-accepted-fg)',
      border: 'var(--status-accepted-border)',
      dot: 'var(--status-accepted-fg)',
    },
  },
  {
    value: 'invoice_query',
    label: 'Invoice Query',
    // brown light tint — 4.57:1
    tones: {
      bg: 'var(--status-revised-bg)',
      fg: 'var(--status-revised-fg)',
      border: 'var(--status-revised-border)',
      dot: 'var(--chart-ramp-1)',
    },
  },
  {
    value: 'payment_notification',
    label: 'Payment Notification',
    // sage — money landed — 4.76:1
    tones: {
      bg: 'var(--status-accepted-bg)',
      fg: 'var(--status-accepted-fg)',
      border: 'var(--status-accepted-border)',
      dot: 'var(--sage-text)',
    },
  },
  {
    value: 'project_update',
    label: 'Project Update',
    // brown light tint — 4.57:1
    tones: {
      bg: 'var(--status-revised-bg)',
      fg: 'var(--status-revised-fg)',
      border: 'var(--status-revised-border)',
      dot: 'var(--cta-primary-bg-active)',
    },
  },
  {
    value: 'scheduling',
    label: 'Scheduling',
    // brown deep tint — 4.61:1
    tones: {
      bg: 'var(--status-sent-bg)',
      fg: 'var(--status-sent-fg)',
      border: 'var(--status-sent-border)',
      dot: 'var(--cta-primary-bg-active)',
    },
  },
  {
    value: 'permit_regulatory',
    label: 'Permit / Regulatory',
    // warm neutral — administrative, not a business outcome — 6.20:1
    tones: {
      bg: 'var(--status-expired-bg)',
      fg: 'var(--status-expired-fg)',
      border: 'var(--status-expired-border)',
      dot: 'var(--chart-ramp-1)',
    },
  },
  {
    value: 'complaint_issue',
    label: 'Complaint / Issue',
    // terracotta — the one negative category — 4.50:1 (system-wide error-pill lock)
    tones: {
      bg: 'var(--status-rejected-bg)',
      fg: 'var(--status-rejected-fg)',
      border: 'var(--status-rejected-border)',
      dot: 'var(--status-rejected-dot)',
    },
  },
  {
    value: 'internal',
    label: 'Internal',
    // warm neutral — 6.20:1
    tones: {
      bg: 'var(--status-expired-bg)',
      fg: 'var(--status-expired-fg)',
      border: 'var(--status-expired-border)',
      dot: 'var(--fg-muted)',
    },
  },
  {
    value: 'spam_marketing',
    label: 'Spam / Marketing',
    // faintest neutral — deliberately the quietest chip — 6.84:1
    tones: {
      bg: 'var(--status-draft-bg)',
      fg: 'var(--status-draft-fg)',
      border: 'var(--status-draft-border)',
      dot: 'var(--fg-muted)',
    },
  },
  {
    value: 'general',
    label: 'General',
    // faintest neutral — the unclassified default — 6.84:1
    tones: {
      bg: 'var(--status-draft-bg)',
      fg: 'var(--status-draft-fg)',
      border: 'var(--status-draft-border)',
      dot: 'var(--fg-dim)',
    },
  },
] as const;

const DEFS_BY_VALUE = new Map(EMAIL_CATEGORY_DEFS.map((d) => [d.value, d]));

export function getEmailCategoryDef(value: string): EmailCategoryDef | null {
  return DEFS_BY_VALUE.get(value as EmailCategoryValue) ?? null;
}
