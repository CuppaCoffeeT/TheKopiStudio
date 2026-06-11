/**
 * AIOverrideClassificationPanel — staff-facing manual override for AI classification.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (AI panel #2 · blue accent)
 * Adopters: email-inbox detail pane.
 *
 * Composes: `AIPanel` (blue accent) + AI-picked vs Manual-override grid
 * + reason textarea + save/clear actions + collapsible `HistoryTrailList`.
 *
 * Controlled: caller passes selected category + reason and handles save.
 */

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIPanel, AIPanelStatusPill, AIPanelActionButton } from './AIPanel';
import { EmailCategoryBadge } from '@/components/primitives/shell/EmailCategoryBadge';
import { HistoryTrailList, type HistoryTrailEntry } from './HistoryTrailList';

export interface AIOverrideOption {
  value: string;
  label: string;
}

interface AIOverrideClassificationPanelProps {
  /** Current AI-picked category value. */
  aiCategory: string | null;
  /** Currently committed manual override (if any). */
  manualCategory: string | null;
  /** Options to select from — typically OVERRIDE_CATEGORIES (superset of EMAIL_CATEGORIES). */
  options: AIOverrideOption[];

  /** Controlled selection (pending save). */
  selectedCategory: string;
  onSelectedCategoryChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;

  onSave?: () => void;
  onClear?: () => void;
  isPending?: boolean;

  history: HistoryTrailEntry[];
  className?: string;
}

export function AIOverrideClassificationPanel({
  aiCategory,
  manualCategory,
  options,
  selectedCategory,
  onSelectedCategoryChange,
  reason,
  onReasonChange,
  onSave,
  onClear,
  isPending = false,
  history,
  className,
}: AIOverrideClassificationPanelProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const dirty =
    selectedCategory && selectedCategory !== (manualCategory ?? aiCategory ?? '');
  const correctedCount = history.length;

  return (
    <AIPanel
      accent="blue"
      icon={<ShieldCheck className="w-full h-full text-blue-700 dark:text-blue-400" />}
      title="Override classification"
      statusPill={
        correctedCount > 0 ? (
          <AIPanelStatusPill tone="blue">Corrected · {correctedCount}</AIPanelStatusPill>
        ) : undefined
      }
      className={className}
      collapsible
      defaultCollapsed
      summary={
        <span className="flex items-center gap-1.5 text-[11.5px] min-w-0 text-zinc-500 dark:text-zinc-400">
          {manualCategory ? (
            <>
              <span className="shrink-0">manual:</span>
              <EmailCategoryBadge category={manualCategory} />
            </>
          ) : aiCategory ? (
            <>
              <span className="shrink-0">AI:</span>
              <EmailCategoryBadge category={aiCategory} />
            </>
          ) : (
            <span className="italic">No classification</span>
          )}
        </span>
      }
      actions={
        <>
          <AIPanelActionButton
            kind="primary"
            onClick={onSave}
            disabled={!dirty || isPending}
          >
            {isPending ? 'Saving…' : 'Save'}
          </AIPanelActionButton>
          <AIPanelActionButton onClick={onClear} disabled={isPending || !selectedCategory}>
            Clear
          </AIPanelActionButton>
          <div className="flex-1" />
          <AIPanelActionButton
            kind="ghost"
            onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen}
          >
            History {historyOpen ? '▴' : '▾'}
          </AIPanelActionButton>
        </>
      }
      footer={
        historyOpen ? (
          <HistoryTrailList
            entries={history}
            emptyLabel="No manual overrides yet."
            heading={`History · ${correctedCount} correction${correctedCount === 1 ? '' : 's'}`}
          />
        ) : null
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end mb-3">
        <FieldLabelWrap label="AI picked">
          {aiCategory ? (
            <EmailCategoryBadge category={aiCategory} />
          ) : (
            <span className="text-[11.5px] italic text-zinc-500 dark:text-zinc-400">—</span>
          )}
        </FieldLabelWrap>
        <FieldLabelWrap label="Manual override">
          <select
            value={selectedCategory}
            onChange={(e) => onSelectedCategoryChange(e.target.value)}
            className={cn(
              'w-full h-8 px-2.5 rounded-md border text-[12px]',
              'border-zinc-200 dark:border-zinc-800',
              'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <option value="">Select a category…</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FieldLabelWrap>
      </div>
      <FieldLabelWrap label="Reason (optional)">
        <textarea
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={2}
          placeholder="Why is the AI wrong? Helps the feedback loop."
          className={cn(
            'w-full min-h-[44px] px-2.5 py-2 rounded-md border resize-y text-[12.5px] leading-[1.5]',
            'border-zinc-200 dark:border-zinc-800',
            'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      </FieldLabelWrap>
    </AIPanel>
  );
}

function FieldLabelWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span
        className="text-[9.5px] uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
