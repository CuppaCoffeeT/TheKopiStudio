/**
 * AIDraftReplyPanel — review + approve/edit/decline an AI-generated draft reply.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (AI panel #3 · blue accent, conditional)
 * Adopters: email-inbox detail pane.
 *
 * Composes: `AIPanel` (blue accent) + raw-draft status pill + subject + body
 * preview + three actions (Approve / Edit / Decline).
 *
 * Supports three modes: view, editing (inline textarea + Save + Cancel), and
 * declining (optional reason input + Confirm decline + Cancel).
 */

import { useState } from 'react';
import { PenLine, Check, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIPanel, AIPanelStatusPill, AIPanelActionButton } from './AIPanel';

interface AIDraftReplyPanelProps {
  draftSubject?: string | null;
  draftBodyPlain?: string | null;
  /** If true, the panel renders a "Raw draft" chip indicating pre-humanize state. */
  isRawDraft?: boolean;

  onApprove?: (editedBody?: string) => void;
  onDecline?: (reason?: string) => void;

  /** When true, buttons disable & primary button shows a loading label. */
  isPending?: boolean;

  className?: string;
}

type Mode = 'view' | 'editing' | 'declining';

export function AIDraftReplyPanel({
  draftSubject,
  draftBodyPlain,
  isRawDraft = false,
  onApprove,
  onDecline,
  isPending = false,
  className,
}: AIDraftReplyPanelProps) {
  const [mode, setMode] = useState<Mode>('view');
  const [editedBody, setEditedBody] = useState(draftBodyPlain ?? '');
  const [declineReason, setDeclineReason] = useState('');

  const reset = () => {
    setMode('view');
    setEditedBody(draftBodyPlain ?? '');
    setDeclineReason('');
  };

  const handleApprove = () => {
    if (mode === 'editing') {
      onApprove?.(editedBody);
    } else {
      onApprove?.();
    }
    reset();
  };

  const handleDecline = () => {
    onDecline?.(declineReason.trim() || undefined);
    reset();
  };

  return (
    <AIPanel
      accent="blue"
      icon={<PenLine className="w-full h-full" />}
      title="AI Draft Reply"
      statusPill={
        <div className="flex items-center gap-1.5">
          {isRawDraft && <AIPanelStatusPill tone="amber">Raw draft</AIPanelStatusPill>}
          <AIPanelStatusPill tone="blue">Pending review</AIPanelStatusPill>
        </div>
      }
      className={className}
      actions={
        mode === 'view' ? (
          <>
            <AIPanelActionButton kind="primary" onClick={handleApprove} disabled={isPending}>
              <Check className="w-3.5 h-3.5" aria-hidden />
              {isPending ? 'Approving…' : 'Approve'}
            </AIPanelActionButton>
            <AIPanelActionButton onClick={() => setMode('editing')} disabled={isPending}>
              <Pencil className="w-3.5 h-3.5" aria-hidden />
              Edit
            </AIPanelActionButton>
            <AIPanelActionButton
              kind="ghost"
              onClick={() => setMode('declining')}
              disabled={isPending}
              className="text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
              Decline
            </AIPanelActionButton>
          </>
        ) : mode === 'editing' ? (
          <>
            <AIPanelActionButton kind="primary" onClick={handleApprove} disabled={isPending}>
              Save & Approve
            </AIPanelActionButton>
            <AIPanelActionButton onClick={reset} disabled={isPending}>
              Cancel
            </AIPanelActionButton>
          </>
        ) : (
          <>
            <AIPanelActionButton kind="danger" onClick={handleDecline} disabled={isPending}>
              Confirm decline
            </AIPanelActionButton>
            <AIPanelActionButton onClick={reset} disabled={isPending}>
              Cancel
            </AIPanelActionButton>
          </>
        )
      }
    >
      {draftSubject && mode === 'view' && (
        <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mb-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Subject · </span>
          {draftSubject}
        </p>
      )}

      {mode === 'view' && (
        <div
          className={cn(
            'px-3 py-2.5 rounded-lg border whitespace-pre-wrap',
            'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/60',
            'text-[12.5px] text-zinc-700 dark:text-zinc-300',
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {draftBodyPlain?.trim() || <span className="italic">(empty draft)</span>}
        </div>
      )}

      {mode === 'editing' && (
        <textarea
          value={editedBody}
          onChange={(e) => setEditedBody(e.target.value)}
          rows={8}
          className={cn(
            'w-full min-h-[160px] px-3 py-2 rounded-lg border resize-y text-[12.5px] leading-[1.55]',
            'bg-white dark:bg-zinc-950',
            'border-zinc-200 dark:border-zinc-800',
            'text-zinc-900 dark:text-zinc-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      )}

      {mode === 'declining' && (
        <input
          type="text"
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="Reason for declining (optional)"
          className={cn(
            'w-full h-8 px-2.5 rounded-md border text-[12px]',
            'bg-white dark:bg-zinc-950',
            'border-zinc-200 dark:border-zinc-800',
            'text-zinc-900 dark:text-zinc-100',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
      )}
    </AIPanel>
  );
}
