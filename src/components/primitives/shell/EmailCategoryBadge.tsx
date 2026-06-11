/**
 * EmailCategoryBadge — AI-classification category pill with color-coded dot.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-cbadge` · `.ei-cat`)
 * Palette: src/lib/design/emailCategoryTones.ts (12 tone pairs · light + dark)
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Two variants:
 *   - `badge` — static display (thread rows, detail header, override panel)
 *   - `filter` — toggle chip (sidebar AI-category section; on/off states)
 *
 * Replaces `src/components/email/EmailClassificationBadge.tsx` in Commit 2.
 * Locked formula: same-hue dot, 50-tint bg, 700-sat fg, 200-hue border.
 */

import { forwardRef } from 'react';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/design/ThemeProvider';
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

function useResolvedTones(category: string): EmailCategoryToneSet | null {
  const { resolved } = useTheme();
  const def = getEmailCategoryDef(category);
  if (!def) return null;
  return resolved === 'dark' ? def.tones.dark : def.tones.light;
}

export const EmailCategoryBadge = forwardRef<HTMLSpanElement, EmailCategoryBadgeProps>(
  function EmailCategoryBadge(props, ref) {
    const { category, label, className } = props;
    const tones = useResolvedTones(category);
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
              ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-[inset_0_1px_1px_rgba(0,0,0,0.03)]'
              : 'bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300',
            'hover:border-zinc-400 dark:hover:border-zinc-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            className,
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <span
            aria-hidden
            className={cn('w-[6px] h-[6px] rounded-full shrink-0', !toggled && 'opacity-45')}
            style={{ background: tones?.dot ?? '#71717a' }}
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
          style={{ background: tones?.dot ?? '#71717a' }}
        />
        <span>{displayLabel}</span>
        {confidencePercent !== null && (
          <span className="opacity-60 text-[10px] tabular-nums">{confidencePercent}%</span>
        )}
      </span>
    );
  },
);
