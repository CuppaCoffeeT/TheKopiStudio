/**
 * Shared presentation atoms for the app's TOOLS — the numbered things an
 * advisor opens to do one job: 01 Prospect Profiler, 04 Tax calculator,
 * 05 SRS planner, 06 Legacy Map, plus the Client Report.
 *
 * HOISTED HERE 2026-08-19 from `features/crm/planning/components/PlanningAtoms`.
 * They were written for the three planning tools, but `src/lib/toolRoutes` has
 * always presented the profiler as tool 01 of the same set while the profiler
 * page rendered none of this — one rail, two visual languages. The profiler is
 * a feature workspace of its own and may not import from `crm`
 * (.dependency-cruiser `no-cross-feature-imports`), so the MARKUP moves to a
 * shared lane and the DATA stays in each feature. See `tools/CONTEXT.md`.
 *
 * These are the 2a spec's panel/stat treatments, not inventions — KOPI_2A_SPEC
 * → "Archetype — detail" → Panels: `#faf6ee`, 1px `#d9ccc0`, radius 12px,
 * padding 22px, opening with the uppercase 11px `.12em` muted label.
 *
 * Formatting helpers live beside their own tools — pure functions exported
 * next to components trip `react-refresh/only-export-components`.
 */

import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import {
  SelectMenu,
  SelectMenuContent,
  SelectMenuItem,
  SelectMenuTrigger,
  SelectMenuValue,
} from '@/components/primitives/overlays/SelectMenu';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Override the label colour. The default `text-muted-foreground` is AA on
   * the two flat cream grounds (4.72:1 on card cream) and ONLY there. A panel
   * that paints its own tint — the profiler's DISC-tinted report sections —
   * drops it to 3.73–3.83:1, so those pass `text-[color:var(--fg-dim)]`
   * (5.78–5.95:1 on the same tints). Never widen the default instead.
   */
  labelClassName?: string;
  /**
   * Escape hatch for a panel whose surface is computed at runtime — the
   * profiler's report sections tint themselves with the winning DISC hue, which
   * no static utility can express. Pair it with `labelClassName`: a tint is a
   * new ground, and the default label colour is calibrated for flat cream.
   */
  style?: CSSProperties;
  /**
   * `-1` makes the panel programmatically focusable — for a control elsewhere
   * that must move the reader here when scrolling alone would not (the
   * profiler's "See how it works", which targets a panel already on screen).
   */
  tabIndex?: number;
  testId?: string;
}

/**
 * A cream panel with the 2a uppercase tracked label.
 *
 * Forwards its ref — `Card`, the primitive it replaces on the tool pages, does
 * too, and the profiler's intake screen scrolls one of these into view.
 */
export const ToolPanel = forwardRef<HTMLElement, ToolPanelProps>(function ToolPanel(
  { label, children, className, labelClassName, style, tabIndex, testId },
  ref,
) {
  return (
    <section
      ref={ref}
      data-testid={testId}
      style={style}
      tabIndex={tabIndex}
      className={cn(
        'rounded-xl border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)]',
        className,
      )}
    >
      <h2
        className={cn(
          'm-0 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
          labelClassName,
        )}
      >
        {label}
      </h2>
      {children}
    </section>
  );
});

export interface ToolStat {
  label: string;
  value: string;
  hint?: string;
  /** `positive` reads sage, `negative` terracotta — fills only, never raw text. */
  tone?: 'neutral' | 'positive' | 'negative';
  testId?: string;
}

const STAT_TONE: Record<NonNullable<ToolStat['tone']>, string> = {
  neutral: 'text-foreground',
  positive: 'text-[color:var(--sage-text)]',
  negative: 'text-[color:var(--negative-text)]',
};

/** The headline figures for a tool — serif numerals over sans labels. */
export function ToolStatGrid({ stats, testId }: { stats: ToolStat[]; testId?: string }) {
  return (
    <dl
      className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-[color:var(--border-soft)] lg:grid-cols-4"
      data-testid={testId}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card px-[18px] py-4" data-testid={stat.testId}>
          <dd
            className={cn('m-0 text-[26px] leading-none', STAT_TONE[stat.tone ?? 'neutral'])}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {stat.value}
          </dd>
          <dt className="mt-1.5 text-[12px] font-medium leading-tight text-foreground">
            {stat.label}
          </dt>
          {stat.hint && (
            <p className="m-0 mt-0.5 text-[11.5px] leading-tight text-muted-foreground">
              {stat.hint}
            </p>
          )}
        </div>
      ))}
    </dl>
  );
}

interface SummaryRowProps {
  label: ReactNode;
  value: ReactNode;
  /** Renders the row as the bottom-line total — heavier, hairline above. */
  total?: boolean;
  /** Deduction styling: the value reads as a subtraction. */
  muted?: boolean;
  testId?: string;
}

/** One line of a running summary ladder (assessable → reliefs → chargeable → tax). */
export function SummaryRow({ label, value, total, muted, testId }: SummaryRowProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex items-baseline justify-between gap-4 py-2',
        total && 'mt-1 border-t border-border pt-3',
      )}
    >
      <span
        className={cn(
          'text-[12.5px]',
          total ? 'font-semibold text-foreground' : 'text-[color:var(--fg-dim)]',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'flex-none tabular-nums',
          total ? 'text-[22px] text-foreground' : 'text-[13px]',
          !total && muted && 'text-muted-foreground',
          !total && !muted && 'text-foreground',
        )}
        style={total ? { fontFamily: 'var(--font-pixel)' } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export interface ToolSelectOption {
  value: string;
  label: string;
}

interface ToolSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: ToolSelectOption[];
  /** Required — these selects sit inside `Field`, which renders no <label>. */
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  testId?: string;
}

/**
 * The tools' dropdown.
 *
 * Wraps `SelectMenu` (Radix) rather than the native `Select`, which
 * `no-restricted-imports` bans app-wide — native OS dropdown chrome cannot be
 * themed to the 2a palette. Collapsing the five-part composition into one
 * options-array call keeps the tool pages readable; they use selects in five
 * places between them.
 */
export function ToolSelect({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder,
  className,
  testId,
}: ToolSelectProps) {
  return (
    <SelectMenu value={value} onValueChange={onChange}>
      <SelectMenuTrigger aria-label={ariaLabel} className={className} data-testid={testId}>
        <SelectMenuValue placeholder={placeholder} />
      </SelectMenuTrigger>
      <SelectMenuContent>
        {options.map((option) => (
          <SelectMenuItem key={option.value} value={option.value}>
            {option.label}
          </SelectMenuItem>
        ))}
      </SelectMenuContent>
    </SelectMenu>
  );
}

/** A quiet note under a tool — assumptions, caveats, statutory references. */
export function ToolNote({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <p
      className="m-0 mt-[22px] text-[12px] leading-[1.6] text-[color:var(--fg-dim)]"
      data-testid={testId}
    >
      {children}
    </p>
  );
}
