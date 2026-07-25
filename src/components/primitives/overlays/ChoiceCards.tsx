/**
 * ChoiceCards — entry-type chooser (modal step 0 composition recipe).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-23-M2TVjKyQ/project/project/preview/component-choice-cards.html
 *
 * 2-large-button picker used as the entry step of Add Work Entry (Trial Trench/General Works)
 * AND Add OT Entry (Work Entry/Leave). Desktop grid-cols-2 · mobile stack inside Drawer.
 *
 * All 5 states per card: default / hover / active / focus-visible / disabled. The app is
 * light-pinned, so no `dark:` counterparts are declared.
 * Accent tones are the 2a semantic set: brown (authority/primary) · sage (positive) ·
 * terracotta (negative) · muted (neutral ink). No categorical green/blue/purple.
 *
 * Composition: native button styled via Tailwind v4 tokens — no new primitive .jsx. Built
 * to compose cleanly inside primitive Modal/Drawer body slot.
 */

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentTone = 'brown' | 'sage' | 'terracotta' | 'muted';

export interface ChoiceCardOption {
  key: string;
  icon: LucideIcon;
  accent: AccentTone;
  title: string;
  description: string;
  /** When true, card renders as filled (brown CTA background); otherwise outline. */
  variant?: 'outline' | 'primary';
  disabled?: boolean;
  testId?: string;
}

interface ChoiceCardsProps {
  options: ChoiceCardOption[];
  onSelect: (key: string) => void;
}

/**
 * Icon chips: an AA-safe glyph on a low-alpha wash of the same hue, all four
 * carrying the shared hairline — hairline borders carry the layout in 2a.
 */
const accentIcon: Record<AccentTone, string> = {
  brown:      'text-[color:var(--brown-text)] bg-[color:var(--accent-red-soft-bg)] border-border',
  sage:       'text-[color:var(--sage-text)] bg-[color:var(--delta-positive-bg)] border-border',
  terracotta: 'text-[color:var(--negative-text)] bg-[color:var(--delta-negative-bg)] border-border',
  muted:      'text-[color:var(--fg-dim)] bg-[color:var(--status-expired-bg)] border-border',
};

export function ChoiceCards({ options, onSelect }: ChoiceCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isPrimary = opt.variant === 'primary';
        return (
          <button
            key={opt.key}
            type="button"
            disabled={opt.disabled}
            onClick={() => onSelect(opt.key)}
            data-testid={opt.testId}
            aria-label={opt.title}
            className={cn(
              'group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
              'min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              isPrimary
                ? 'bg-[color:var(--cta-primary-bg)] text-[color:var(--cta-primary-fg)] hover:bg-[color:var(--cta-primary-bg-hover)] active:scale-[0.98] border-transparent'
                : 'bg-card border-border text-foreground hover:bg-[color:var(--row-hover)] hover:border-[color:var(--border-hover)] active:scale-[0.98]',
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center h-10 w-10 rounded-md border',
                isPrimary
                  ? 'bg-[color:var(--cta-primary-bg-active)] border-[color:var(--border-hover)] text-[color:var(--cta-primary-fg)]'
                  : accentIcon[opt.accent],
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className={cn('text-base font-semibold leading-tight', isPrimary ? 'text-[color:var(--cta-primary-fg)]' : 'text-foreground')}>
              {opt.title}
            </span>
            {/* Full-strength cream, not a faded one: cream on brown is 4.58:1 and
                any alpha on top of that drops the 12px description under AA. */}
            <span className={cn('text-xs leading-relaxed', isPrimary ? 'text-[color:var(--cta-primary-fg)]' : 'text-muted-foreground')}>
              {opt.description}
            </span>
            <ChevronRight
              className={cn(
                'absolute right-3 top-3 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity',
                isPrimary ? 'text-[color:var(--cta-primary-fg)]' : 'text-muted-foreground',
              )}
              aria-hidden
              strokeWidth={2.4}
            />
          </button>
        );
      })}
    </div>
  );
}
