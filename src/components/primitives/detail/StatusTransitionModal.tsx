/**
 * StatusTransitionModal — Confirm a state transition (accept · mark-paid · approve · archive) with a required reason.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-status-modal.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/StatusTransitionModal.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Composes: <Modal> + <ModalPrimaryAction> + <ModalGhostAction>.
 * Locked:
 *  - Primary action blocked until reason ≥ `minReasonLength` chars.
 *  - `destructive` turns primary CTA + title red-700 (archive · delete flows).
 *  - Status transition row: FROM pill → arrow → TO pill, both in Geist Mono uppercase.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '../overlays/Modal';

interface StatusTransitionModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  description?: string;
  from: string;
  to: string;
  destructive?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  minReasonLength?: number;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
}

export function StatusTransitionModal({
  open,
  onOpenChange,
  title,
  description,
  from,
  to,
  destructive = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  minReasonLength = 20,
  reasonLabel = 'reason · required',
  reasonPlaceholder,
  loading = false,
  onConfirm,
}: StatusTransitionModalProps) {
  const [reason, setReason] = useState('');
  const ok = reason.length >= minReasonLength;
  const placeholder = reasonPlaceholder ?? `Why are we making this transition? (min ${minReasonLength} chars)`;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
      title={title}
      destructive={destructive}
      size="lg"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)}>{cancelLabel}</ModalGhostAction>
          <ModalPrimaryAction
            destructive={destructive}
            disabled={!ok || loading}
            onClick={() => onConfirm(reason)}
          >
            {loading && (
              <span
                aria-hidden
                className="inline-block w-3 h-3 mr-1 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin"
              />
            )}
            {confirmLabel}
          </ModalPrimaryAction>
        </>
      }
    >
      <div className="flex items-center gap-2 mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
        <span className="px-2 py-[3px] rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10.5px] uppercase tracking-wider">
          {from}
        </span>
        <svg width="14" height="10" viewBox="0 0 14 10" className="text-zinc-500" aria-hidden>
          <path
            d="M1 5 H12 M9 2 L12 5 L9 8"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={cn(
            'px-2 py-[3px] rounded-full text-[10.5px] uppercase tracking-wider',
            destructive
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
          )}
        >
          {to}
        </span>
      </div>
      {description && (
        <div className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{description}</div>
      )}

      <div>
        <div
          className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {reasonLabel}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={cn(
            'w-full min-h-[88px] px-3 py-2.5 rounded-md resize-y',
            'text-[13px] leading-relaxed text-zinc-900 dark:text-zinc-50',
            'bg-white dark:bg-zinc-950',
            'border border-zinc-200 dark:border-zinc-800',
            'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
            'focus:outline-none focus:border-red-700 dark:focus:border-red-400',
            'focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/20',
            'disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed'
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        />
        <div
          className="mt-1.5 flex justify-between text-[10.5px] text-zinc-500"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span>
            {reason.length} / {minReasonLength} min
          </span>
          <span className={ok ? 'text-emerald-700 dark:text-emerald-400' : undefined}>
            {ok ? '✓ ready' : 'awaiting reason'}
          </span>
        </div>
      </div>
    </Modal>
  );
}
