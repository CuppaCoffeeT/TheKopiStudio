/**
 * ChoiceCards — entry-type chooser (modal step 0 composition recipe).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-23-M2TVjKyQ/project/project/preview/component-choice-cards.html
 *
 * 2-large-button picker used as the entry step of Add Work Entry (Trial Trench/General Works)
 * AND Add OT Entry (Work Entry/Leave). Desktop grid-cols-2 · mobile stack inside Drawer.
 *
 * All 5 states per card: default / hover / active / focus-visible / disabled (light + dark).
 * Accent colors: blue (TT) · green (GW) · slate-primary (OT Work) · amber-outline (OT Leave).
 *
 * Composition: native button styled via Tailwind v4 tokens — no new primitive .jsx. Built
 * to compose cleanly inside primitive Modal/Drawer body slot.
 */

import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentTone = 'blue' | 'green' | 'slate' | 'amber';

export interface ChoiceCardOption {
  key: string;
  icon: LucideIcon;
  accent: AccentTone;
  title: string;
  description: string;
  /** When true, card renders as filled (slate-700 background); otherwise outline. */
  variant?: 'outline' | 'primary';
  disabled?: boolean;
  testId?: string;
}

interface ChoiceCardsProps {
  options: ChoiceCardOption[];
  onSelect: (key: string) => void;
}

const accentIcon: Record<AccentTone, string> = {
  blue:   'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
  green:  'text-green-600 dark:text-green-400 bg-green-50/60 dark:bg-green-950/40 border-green-200 dark:border-green-900',
  slate:  'text-white bg-slate-700 dark:bg-slate-200 dark:text-slate-900',
  amber:  'text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
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
                ? 'bg-slate-700 text-white hover:bg-slate-800 active:scale-[0.98] border-transparent dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                : 'bg-card border-border text-foreground hover:bg-secondary hover:border-border active:scale-[0.98]',
            )}
          >
            <span
              className={cn(
                'inline-flex items-center justify-center h-10 w-10 rounded-md border',
                isPrimary
                  ? 'bg-white/15 border-white/20 text-white dark:bg-slate-900/10 dark:border-slate-900/20 dark:text-slate-900'
                  : accentIcon[opt.accent],
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className={cn('text-base font-semibold leading-tight', isPrimary ? 'text-white dark:text-slate-900' : 'text-foreground')}>
              {opt.title}
            </span>
            <span className={cn('text-xs leading-relaxed', isPrimary ? 'text-white/85 dark:text-slate-900/80' : 'text-muted-foreground')}>
              {opt.description}
            </span>
            <ChevronRight
              className={cn(
                'absolute right-3 top-3 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity',
                isPrimary ? 'text-white dark:text-slate-900' : 'text-muted-foreground',
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
