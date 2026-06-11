/**
 * Email category tone palette — single source of truth for the 12 AI categories.
 *
 * Consumed by:
 * - `primitives/shell/EmailCategoryBadge.tsx` (badge + filter variants)
 * - `primitives/shell/EmailSidebar.tsx` (AI-category toggle chips)
 * - `services/email/emailClassificationService.ts` re-exports `EMAIL_CATEGORIES`
 *   that references these tones (Commit 2 of EMAIL_INBOX_PRIMITIVE_LIFT_PLAN).
 *
 * Design locks (W17 v3.1): brand red is ACCENT only — used for focus rings,
 * status markers, and the `complaint_issue` category. Other categories use
 * hue-matched Tailwind palettes at the 50/200/700 + 900/30 shades.
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

export interface EmailCategoryTonePair {
  light: EmailCategoryToneSet;
  dark: EmailCategoryToneSet;
}

export interface EmailCategoryDef {
  value: EmailCategoryValue;
  label: string;
  tones: EmailCategoryTonePair;
}

export const EMAIL_CATEGORY_DEFS: readonly EmailCategoryDef[] = [
  {
    value: 'quotation_request',
    label: 'Quotation Request',
    tones: {
      light: { bg: '#dbeafe', fg: '#1e40af', border: '#bfdbfe', dot: '#1d4ed8' },
      dark: { bg: 'rgba(30, 58, 138, 0.25)', fg: '#bfdbfe', border: 'rgba(30, 58, 138, 0.5)', dot: '#60a5fa' },
    },
  },
  {
    value: 'quotation_response',
    label: 'Quotation Response',
    tones: {
      light: { bg: '#dcfce7', fg: '#15803d', border: '#bbf7d0', dot: '#15803d' },
      dark: { bg: 'rgba(20, 83, 45, 0.25)', fg: '#bbf7d0', border: 'rgba(20, 83, 45, 0.5)', dot: '#4ade80' },
    },
  },
  {
    value: 'purchase_order',
    label: 'Purchase Order',
    tones: {
      light: { bg: '#ede9fe', fg: '#6d28d9', border: '#ddd6fe', dot: '#7e22ce' },
      dark: { bg: 'rgba(76, 29, 149, 0.25)', fg: '#ddd6fe', border: 'rgba(76, 29, 149, 0.5)', dot: '#a78bfa' },
    },
  },
  {
    value: 'invoice_query',
    label: 'Invoice Query',
    tones: {
      light: { bg: '#ffedd5', fg: '#c2410c', border: '#fed7aa', dot: '#c2410c' },
      dark: { bg: 'rgba(154, 52, 18, 0.25)', fg: '#fed7aa', border: 'rgba(154, 52, 18, 0.5)', dot: '#fb923c' },
    },
  },
  {
    value: 'payment_notification',
    label: 'Payment Notification',
    tones: {
      light: { bg: '#cffafe', fg: '#0e7490', border: '#a5f3fc', dot: '#0e7490' },
      dark: { bg: 'rgba(22, 78, 99, 0.25)', fg: '#a5f3fc', border: 'rgba(22, 78, 99, 0.5)', dot: '#22d3ee' },
    },
  },
  {
    value: 'project_update',
    label: 'Project Update',
    tones: {
      light: { bg: '#f3e8ff', fg: '#6d28d9', border: '#e9d5ff', dot: '#6d28d9' },
      dark: { bg: 'rgba(88, 28, 135, 0.25)', fg: '#e9d5ff', border: 'rgba(88, 28, 135, 0.5)', dot: '#c084fc' },
    },
  },
  {
    value: 'scheduling',
    label: 'Scheduling',
    tones: {
      light: { bg: '#fef3c7', fg: '#a16207', border: '#fde68a', dot: '#a16207' },
      dark: { bg: 'rgba(113, 63, 18, 0.25)', fg: '#fde68a', border: 'rgba(113, 63, 18, 0.5)', dot: '#facc15' },
    },
  },
  {
    value: 'permit_regulatory',
    label: 'Permit / Regulatory',
    tones: {
      light: { bg: '#ffe4e6', fg: '#be123c', border: '#fecdd3', dot: '#be123c' },
      dark: { bg: 'rgba(136, 19, 55, 0.25)', fg: '#fecdd3', border: 'rgba(136, 19, 55, 0.5)', dot: '#fb7185' },
    },
  },
  {
    value: 'complaint_issue',
    label: 'Complaint / Issue',
    tones: {
      light: { bg: '#fee2e2', fg: '#b91c1c', border: '#fecaca', dot: '#b91c1c' },
      dark: { bg: 'rgba(127, 29, 29, 0.25)', fg: '#fecaca', border: 'rgba(127, 29, 29, 0.5)', dot: '#f87171' },
    },
  },
  {
    value: 'internal',
    label: 'Internal',
    tones: {
      light: { bg: '#f4f4f5', fg: '#52525b', border: '#e4e4e7', dot: '#71717a' },
      dark: { bg: 'rgba(39, 39, 42, 0.6)', fg: '#d4d4d8', border: 'rgba(63, 63, 70, 0.7)', dot: '#a1a1aa' },
    },
  },
  {
    value: 'spam_marketing',
    label: 'Spam / Marketing',
    tones: {
      light: { bg: '#f4f4f5', fg: '#a1a1aa', border: '#e4e4e7', dot: '#a1a1aa' },
      dark: { bg: 'rgba(24, 24, 27, 0.6)', fg: '#a1a1aa', border: 'rgba(63, 63, 70, 0.5)', dot: '#71717a' },
    },
  },
  {
    value: 'general',
    label: 'General',
    tones: {
      light: { bg: '#f1f5f9', fg: '#475569', border: '#e2e8f0', dot: '#64748b' },
      dark: { bg: 'rgba(30, 41, 59, 0.5)', fg: '#cbd5e1', border: 'rgba(51, 65, 85, 0.5)', dot: '#94a3b8' },
    },
  },
] as const;

const DEFS_BY_VALUE = new Map(EMAIL_CATEGORY_DEFS.map((d) => [d.value, d]));

export function getEmailCategoryDef(value: string): EmailCategoryDef | null {
  return DEFS_BY_VALUE.get(value as EmailCategoryValue) ?? null;
}
