/**
 * AIClassificationPanel — AI category annotation + reasoning + feedback actions.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (AI panel #1 · green accent)
 * Adopters: email-inbox detail pane.
 *
 * Composes: `AIPanel` (green accent) + `EmailCategoryBadge` (badge variant)
 * + reply-needed pill + reasoning + summary + three actions (Correct /
 * Wrong category / Notes).
 *
 * Reviewed-state transitions are handled by parent (controlled) — this primitive
 * renders the shell, caller owns the state machine.
 */

import { Bot, Check, Tag, MessageSquare, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIPanel, AIPanelStatusPill, AIPanelActionButton } from './AIPanel';
import { EmailCategoryBadge } from '@/components/primitives/shell/EmailCategoryBadge';

export type ReplyNeeded = 'yes' | 'no' | 'maybe' | null;

interface AIClassificationPanelProps {
  category: string;
  confidence: number;
  isManualOverride?: boolean;
  replyNeeded?: ReplyNeeded;

  /** AI-generated one-line summary. */
  summary?: string | null;
  /** AI reasoning paragraph. */
  reasoning?: string | null;

  /** Panel status. `null` = unreviewed. `confirmed` = feedback_correct true. `corrected` = feedback_correct false. */
  reviewState?: 'unreviewed' | 'confirmed' | 'corrected';

  onConfirm?: () => void;
  onCorrect?: () => void;
  onAddNotes?: () => void;
  onReopen?: () => void;

  className?: string;
  isPending?: boolean;
}

const REPLY_NEEDED_TONE = {
  yes: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
  no: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
  maybe: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
} as const;

export function AIClassificationPanel({
  category,
  confidence,
  isManualOverride,
  replyNeeded,
  summary,
  reasoning,
  reviewState = 'unreviewed',
  onConfirm,
  onCorrect,
  onAddNotes,
  onReopen,
  className,
  isPending = false,
}: AIClassificationPanelProps) {
  const statusPill =
    reviewState === 'confirmed' ? (
      <AIPanelStatusPill tone="green">
        <Check className="inline w-3 h-3 mr-0.5 -mt-0.5" aria-hidden />
        Confirmed
      </AIPanelStatusPill>
    ) : reviewState === 'corrected' ? (
      <AIPanelStatusPill tone="blue">Corrected</AIPanelStatusPill>
    ) : (
      <AIPanelStatusPill tone="amber">Unreviewed</AIPanelStatusPill>
    );

  return (
    <AIPanel
      accent="green"
      icon={<Bot className="w-full h-full" />}
      title="AI Classification"
      statusPill={statusPill}
      className={className}
      collapsible
      defaultCollapsed={reviewState !== 'unreviewed'}
      summary={
        <>
          <EmailCategoryBadge
            category={category}
            confidence={confidence}
            isManualOverride={isManualOverride}
          />
          {replyNeeded && (
            <span className={cn('text-[11px] whitespace-nowrap shrink-0', 'text-zinc-500 dark:text-zinc-400')}>
              · reply: <span className="font-medium text-zinc-700 dark:text-zinc-300">{replyNeeded}</span>
            </span>
          )}
        </>
      }
      actions={
        reviewState === 'unreviewed' ? (
          <>
            <AIPanelActionButton kind="primary" onClick={onConfirm} disabled={isPending}>
              <Check className="w-3.5 h-3.5" aria-hidden />
              Correct
            </AIPanelActionButton>
            <AIPanelActionButton onClick={onCorrect} disabled={isPending}>
              <Tag className="w-3.5 h-3.5" aria-hidden />
              Wrong category
            </AIPanelActionButton>
            <AIPanelActionButton kind="ghost" onClick={onAddNotes} disabled={isPending}>
              <MessageSquare className="w-3.5 h-3.5" aria-hidden />
              Notes
            </AIPanelActionButton>
          </>
        ) : (
          <AIPanelActionButton kind="ghost" onClick={onReopen} disabled={isPending}>
            <PenLine className="w-3.5 h-3.5" aria-hidden />
            Change feedback
          </AIPanelActionButton>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <EmailCategoryBadge
          category={category}
          confidence={confidence}
          isManualOverride={isManualOverride}
        />
        {replyNeeded && (
          <span
            className={cn(
              'inline-flex items-center h-[22px] px-2 rounded-full border text-[11px] font-medium',
              REPLY_NEEDED_TONE[replyNeeded],
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Reply: {replyNeeded}
          </span>
        )}
      </div>
      {summary && (
        <p className="mb-1.5">
          <strong className="font-medium text-zinc-900 dark:text-zinc-100">Summary · </strong>
          {summary}
        </p>
      )}
      {reasoning && (
        <p
          className={cn(
            'text-[12px] text-zinc-500 dark:text-zinc-400 pt-2 mt-2',
            'border-t border-dashed border-zinc-100 dark:border-zinc-800/60',
          )}
        >
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">Reasoning · </strong>
          {reasoning}
        </p>
      )}
    </AIPanel>
  );
}
