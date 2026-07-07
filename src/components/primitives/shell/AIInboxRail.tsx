/**
 * AIInboxRail — three composable surfaces for AI/agent inboxes on detail
 * pages. Designed to be domain-neutral so the same pattern works for
 * quotations, projects, work permits, and any other record that needs
 * a "what's going on" summary strip plus an agent task panel.
 *
 * Exports:
 *   • SituationBar — horizontal bar: [info sentence] + [InboxChip]. Includes
 *     a scroll-aware floating clone of the chip so it stays reachable after
 *     the bar scrolls out of view.
 *   • InboxChip — standalone rounded-rectangle trigger (icon + count + chevron).
 *   • InboxRailPanel — the expanded rail's shell: header-as-collapse-button +
 *     empty state + children slot (callers inject their own task rows).
 *
 * Feature code composes these with feature-specific data hooks and task-row
 * components. See `features/quotations/components/AgentInbox.tsx` for the
 * reference adopter.
 *
 * ─── Primitive compliance ──────────────────────────────────────────────
 * NOTE: This primitive does NOT have a Claude Design spec bundle, unlike
 * most primitives in `primitives/**`. It was promoted from feature code
 * (W09 P3 · M2 AgentInbox, 2026-04-23) when the pattern was needed on
 * multiple pages. All other primitive requirements are honoured:
 *   - v4 tokens only (--font-sans, --font-mono, slate/zinc/red scale)
 *   - All 5 interactive states (default / hover / active / focus-visible / disabled)
 *   - Registered in primitives/CONTEXT.md + DESIGN_CATALOG.md
 *   - Re-exported from primitives/shell/index.ts
 *   - JSDoc header (this block) cites the intended callers
 * Future redesigns should commission a Claude Design session and back-fill the
 * `Spec:` line above.
 *
 * Adopters: tracked in DESIGN_CATALOG.md.
 */

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Inbox, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── InboxChip ───────────────────────────────────────────────────────

export interface InboxChipProps {
  /** Tasks / notifications pending. Renders inside the inner count pill. */
  count: number;
  /** Promotes the inner count pill + icon color to red-700 (blocker tone). */
  hasBlocker?: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** Native tooltip (shown on hover). E.g. `"Hidden while editing"`. */
  title?: string;
  /** Override aria-label; default derives from `count`. */
  ariaLabel?: string;
  className?: string;
}

/** Compact inbox trigger — rounded-rectangle shape matching SituationBar. */
export function InboxChip({
  count,
  hasBlocker = false,
  onClick,
  disabled = false,
  title,
  ariaLabel,
  className,
}: InboxChipProps) {
  const label = ariaLabel ?? (count === 0 ? 'Agent inbox · no tasks' : `Agent inbox · ${count} task${count === 1 ? '' : 's'}`);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={cn(
        'inline-flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 h-10',
        'border border-border',
        'bg-card',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:bg-secondary active:bg-zinc-100 dark:active:bg-white/[0.05]',
        className,
      )}
    >
      <Inbox className={cn('w-3.5 h-3.5 flex-shrink-0', hasBlocker ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
      <span
        className={cn(
          'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] tabular-nums',
          hasBlocker ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
        )}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {count}
      </span>
      <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
    </button>
  );
}

// ─── SituationBar ─────────────────────────────────────────────────────

export interface SituationBarProps {
  /** Info line to display. When empty AND `count === 0`, the bar self-hides. */
  sentence: string;
  /** Red left-accent + red icon when the record is in a blocked state. */
  isBlocker?: boolean;
  /** Chip props — the inbox count to badge + whether it shows the blocker tone. */
  count: number;
  hasBlocker?: boolean;
  /** True while the rail is expanded (parent shows panel elsewhere) — hides the chip. */
  expanded: boolean;
  /** Called when user clicks the chip. Parent flips to expanded state. */
  onExpand: () => void;
  /** Disable the chip (edit mode, etc.); still renders for visual parity. */
  chipDisabled?: boolean;
  chipTitle?: string;
  className?: string;
}

/**
 * Horizontal status bar + inline inbox chip. Renders a portal'd floating
 * clone of the chip when the bar scrolls out of view so the inbox stays
 * one click away on long pages.
 */
export function SituationBar({
  sentence,
  isBlocker = false,
  count,
  hasBlocker = false,
  expanded,
  onExpand,
  chipDisabled = false,
  chipTitle,
  className,
}: SituationBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [barInView, setBarInView] = useState(true);

  useEffect(() => {
    const check = () => {
      const el = barRef.current;
      if (!el) return;
      setBarInView(el.getBoundingClientRect().bottom > 64);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  // Nothing to show at all — skip the bar entirely.
  if (!sentence && count === 0) return null;

  const showFloating = !barInView && !expanded && !chipDisabled;

  const chip = (
    <InboxChip
      count={count}
      hasBlocker={hasBlocker}
      onClick={onExpand}
      disabled={chipDisabled}
      title={chipTitle}
    />
  );

  return (
    <>
      <div
        ref={barRef}
        className={cn('flex items-center gap-3 rounded-[10px] transition-opacity duration-200', className)}
      >
        {sentence ? (
          <div
            className={cn(
              'flex-1 min-w-0 flex items-center gap-2.5 rounded-[10px] h-10',
              'border border-border',
              'bg-card',
              'px-3.5 py-2.5',
              isBlocker && 'border-l-[3px] border-l-primary',
            )}
            role="note"
            aria-label="Situation summary"
            title={sentence}
          >
            <Info
              className={cn('w-3.5 h-3.5 flex-shrink-0', isBlocker ? 'text-primary' : 'text-muted-foreground')}
              aria-hidden
            />
            <p
              className="flex-1 min-w-0 truncate text-[13px] leading-snug text-muted-foreground"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {sentence}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-w-0" />
        )}

        {!expanded && (
          <div className={cn('flex-shrink-0 transition-opacity duration-200', showFloating && 'opacity-0 pointer-events-none')}>
            {chip}
          </div>
        )}
      </div>

      {!expanded && typeof document !== 'undefined' && createPortal(
        <div
          className={cn(
            // Position matches the sticky expanded rail (md:top-16 + page md:px-10) so the
            // chevron sits at the same viewport coordinates in floating + expanded states.
            'fixed right-4 md:right-10 top-[64px] md:top-16 z-40',
            'transition-opacity duration-200',
            showFloating ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          // When not visible, hide from a11y tree AND remove from focus order to
          // satisfy WCAG aria-hidden-focus (no focusable descendants while hidden).
          aria-hidden={!showFloating}
          {...(!showFloating ? { inert: '' as unknown as boolean } : {})}
        >
          <InboxChip
            count={count}
            hasBlocker={hasBlocker}
            onClick={onExpand}
            disabled={chipDisabled}
            title={chipTitle}
            className="shadow-lg"
          />
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── InboxRailPanel ───────────────────────────────────────────────────

export interface InboxRailPanelProps {
  /** Label shown in the header, e.g. "Agent Inbox". */
  title: string;
  /** Count rendered next to the title as `"${title} · ${count}"`. */
  count: number;
  /** Collapse callback — also fired when the header itself is clicked. */
  onCollapse: () => void;
  /** True when there are no task rows to render — shows the empty-state card. */
  isEmpty?: boolean;
  /** Empty-state copy. Defaults to a neutral observer line. */
  emptyLabel?: string;
  /** Task rows (caller composes with feature-specific row component). */
  children?: ReactNode;
  className?: string;
}

/**
 * Expanded rail shell. The entire header row is a clickable Collapse button
 * (matching the `SituationBar`'s silhouette), and `children` renders below it.
 */
export function InboxRailPanel({
  title,
  count,
  onCollapse,
  isEmpty = false,
  emptyLabel = 'No actions needed. Agent is observing.',
  children,
  className,
}: InboxRailPanelProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-2',
        'motion-safe:animate-[slidein-right_220ms_ease-out]',
        className,
      )}
      aria-label={`${title} · ${count} task${count === 1 ? '' : 's'}`}
    >
      <button
        type="button"
        onClick={onCollapse}
        aria-label={`Collapse ${title.toLowerCase()}`}
        className={cn(
          // sticky top-0 keeps the collapse trigger visible while the rail's
          // internal content scrolls (parent container uses overflow-y-auto on
          // sticky desktop layouts). z-10 sits above task rows.
          'sticky top-0 z-10',
          'flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 w-full h-10',
          'border border-border',
          'bg-card',
          'hover:bg-secondary active:bg-zinc-100 dark:active:bg-white/[0.05]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <Inbox className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" aria-hidden />
        <h3
          className="flex-1 text-left text-[11px] font-semibold uppercase tracking-widest text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {title} · {count}
        </h3>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
      </button>

      {isEmpty ? (
        <div className="rounded-[10px] border border-dashed border-border bg-card px-4 py-6 text-center">
          <p className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>
            {emptyLabel}
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
