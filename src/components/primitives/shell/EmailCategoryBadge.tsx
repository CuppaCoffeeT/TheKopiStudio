/**
 * EmailCategoryBadge — AI-classification category pill with color-coded dot.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-cbadge` · `.ei-cat`)
 * Palette: src/lib/design/emailCategoryTones.ts (12 tone sets; the app is light-pinned)
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Two variants:
 *   - `badge` — static display (thread rows, detail header, override panel)
 *   - `filter` — toggle chip (sidebar AI-category section; on/off states)
 *
 * Replaces `src/components/email/EmailClassificationBadge.tsx` in Commit 2.
 * Locked formula: same-hue dot, tinted bg, darkened same-hue fg, hairline border.
 */

import { forwardRef } from 'react';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEmailCategoryDef, type EmailCategoryToneSet } from '@/lib/design/emailCategoryTones';

export type EmailCategoryBadgeVariant = 'badge' | 'filter';

interface EmailCategoryBadgeBaseProps {
  category: string;
  variant?: EmailCategoryBadgeVariant;
  /** Override the displayed label. Defaults to the category def's label. */
  label?: string;
  className?: string;
}

interface EmailCategoryBadgeDisplayProps extends EmailCategoryBadgeBaseProps {
  variant?: 'badge';
  /** Optional confidence (0–1) to show next to label. */
  confidence?: number;
  /** If true, prefix with pencil icon to indicate manual override. */
  isManualOverride?: boolean;
}

interface EmailCategoryBadgeFilterProps extends EmailCategoryBadgeBaseProps {
  variant: 'filter';
  /** Whether the toggle is active. */
  toggled?: boolean;
  /** Toggle handler. */
  onToggle?: () => void;
  disabled?: boolean;
  /** Optional `data-testid` forwarded to the underlying button. */
  'data-testid'?: string;
}

export type EmailCategoryBadgeProps =
  | EmailCategoryBadgeDisplayProps
  | EmailCategoryBadgeFilterProps;

function resolveTones(category: string): EmailCategoryToneSet | null {
  return getEmailCategoryDef(category)?.tones ?? null;
}

export const EmailCategoryBadge = forwardRef<HTMLSpanElement, EmailCategoryBadgeProps>(
  function EmailCategoryBadge(props, ref) {
    const { category, label, className } = props;
    const tones = resolveTones(category);
    const def = getEmailCategoryDef(category);
    const displayLabel = label ?? def?.label ?? category;

    if (props.variant === 'filter') {
      const { toggled = false, onToggle, disabled } = props;
      const testId = props['data-testid'];
      return (
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          data-testid={testId}
          data-toggled={toggled}
          className={cn(
            'inline-flex items-center gap-1.5 h-[22px] pl-[7px] pr-2 rounded-full',
            'text-[11px] font-medium whitespace-nowrap',
            'border transition-colors cursor-pointer',
            toggled
              ? 'bg-card border-border text-foreground shadow-[inset_0_1px_1px_rgb(58_46_36_/_0.03)]'
              : 'bg-secondary border-border text-[color:var(--fg-dim)]',
            'hover:border-[color:var(--border-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            className,
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <span
            aria-hidden
            className={cn('w-[6px] h-[6px] rounded-full shrink-0', !toggled && 'opacity-45')}
            style={{ background: tones?.dot ?? 'var(--fg-muted)' }}
          />
          <span>{displayLabel}</span>
        </button>
      );
    }

    // badge variant
    const { confidence, isManualOverride } = props;
    const confidencePercent =
      typeof confidence === 'number' ? Math.round(confidence * 100) : null;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-[7px] py-[2px] rounded-full',
          'text-[10.5px] font-medium whitespace-nowrap border',
          className,
        )}
        style={
          tones
            ? {
                fontFamily: 'var(--font-sans)',
                background: tones.bg,
                color: tones.fg,
                borderColor: tones.border,
              }
            : { fontFamily: 'var(--font-sans)' }
        }
      >
        {isManualOverride && <PenLine className="w-3 h-3 shrink-0" aria-hidden />}
        <span
          aria-hidden
          className="w-[5px] h-[5px] rounded-full shrink-0"
          style={{ background: tones?.dot ?? 'var(--fg-muted)' }}
        />
        <span>{displayLabel}</span>
        {confidencePercent !== null && (
          <span className="opacity-60 text-[10px] tabular-nums">{confidencePercent}%</span>
        )}
      </span>
    );
  },
);
