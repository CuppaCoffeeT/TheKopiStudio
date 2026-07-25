/**
 * AIClassificationPanel — AI category annotation + reasoning + feedback actions.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (AI panel #1 · `green` accent — sage under 2a)
 * Adopters: email-inbox detail pane.
 *
 * Composes: `AIPanel` (`green` accent = sage positive) + `EmailCategoryBadge` (badge variant)
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

/** 2a status pills: tint fill + darkened same-hue text, never a saturated fill.
 *  `yes` = sage positive · `maybe` = brown in-progress · `no` = inert neutral. */
const REPLY_NEEDED_TONE = {
  yes: 'bg-[color:var(--status-accepted-bg)] text-[color:var(--status-accepted-fg)] border-[color:var(--status-accepted-border)]',
  no: 'bg-secondary text-muted-foreground border-border',
  maybe: 'bg-[color:var(--status-sent-bg)] text-[color:var(--status-sent-fg)] border-[color:var(--status-sent-border)]',
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
            <span className={cn('text-[11px] whitespace-nowrap shrink-0', 'text-muted-foreground')}>
              · reply: <span className="font-medium text-muted-foreground">{replyNeeded}</span>
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
          <strong className="font-medium text-foreground">Summary · </strong>
          {summary}
        </p>
      )}
      {reasoning && (
        <p
          className={cn(
            'text-[12px] text-muted-foreground pt-2 mt-2',
            'border-t border-dashed border-border',
          )}
        >
          <strong className="font-medium text-muted-foreground">Reasoning · </strong>
          {reasoning}
        </p>
      )}
    </AIPanel>
  );
}
