/**
 * DestructiveConfirmDialog — 3-tier destructive confirm (deactivate · archive · delete).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-destructive.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/detail/DestructiveConfirmDialog.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Composes: <Modal destructive> + <ModalGhostAction> + <ModalPrimaryAction destructive>.
 * Tier 1 (low)  = plain AlertDialog (deactivate / unlink / remove).
 * Tier 2 (mid)  = typed confirm — user types resource name (archive · merge).
 * Tier 3 (high) = typed confirm + irreversibility checkbox + red strip (delete).
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '../overlays/Modal';

export type DestructiveTier = 1 | 2 | 3;

interface DestructiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  tier: DestructiveTier;
  resource: string;
  resourceKind: string;
  /** Optional override — otherwise auto-generates `delete quotation?` etc. */
  title?: string;
  description?: React.ReactNode;
  /** Cascading-effects bullet list (tier 2+3). */
  consequences?: React.ReactNode[];
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
}

const AUTO_TITLE: Record<DestructiveTier, (kind: string) => string> = {
  1: (k) => `deactivate ${k}?`,
  2: (k) => `archive ${k}?`,
  3: (k) => `delete ${k}?`,
};

const AUTO_CONFIRM: Record<DestructiveTier, string> = {
  1: 'Deactivate',
  2: 'Archive',
  3: 'Delete',
};

export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  tier,
  resource,
  resourceKind,
  title,
  description,
  consequences,
  confirmLabel,
  loading = false,
  onConfirm,
}: DestructiveConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [irreversibleChecked, setIrreversibleChecked] = useState(false);

  useEffect(() => {
    if (!open) {
      setTyped('');
      setIrreversibleChecked(false);
    }
  }, [open]);

  const matches = typed === resource;
  const canConfirm =
    tier === 1 || (tier === 2 && matches) || (tier === 3 && matches && irreversibleChecked);

  const effectiveTitle = title ?? AUTO_TITLE[tier](resourceKind);
  const effectiveConfirm = confirmLabel ?? `${AUTO_CONFIRM[tier]} ${resourceKind}`;

  const defaultDescription =
    tier === 1 ? (
      <>
        This pauses <ResourceChip>{resource}</ResourceChip> but keeps its history intact. Can be reactivated
        later.
      </>
    ) : tier === 2 ? (
      <>
        Archiving moves <ResourceChip>{resource}</ResourceChip> out of active lists. History stays searchable.
      </>
    ) : (
      <>
        This will permanently remove <ResourceChip>{resource}</ResourceChip> and cannot be undone.
      </>
    );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          {tier === 3 && (
            <div
              className="-mx-5 -mt-4.5 mb-3 px-5 py-1.5 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/40 text-[10.5px] font-medium uppercase tracking-widest text-red-700 dark:text-red-400"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-700 dark:bg-red-400" />
              Tier 3 · irreversible · admin audit-logged
            </div>
          )}
          {effectiveTitle}
        </>
      }
      destructive
      size={tier === 1 ? 'sm' : 'md'}
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)}>Cancel</ModalGhostAction>
          <ModalPrimaryAction destructive disabled={!canConfirm || loading} onClick={onConfirm}>
            {loading && (
              <span
                aria-hidden
                className="inline-block w-3 h-3 mr-1 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin"
              />
            )}
            {effectiveConfirm}
          </ModalPrimaryAction>
        </>
      }
    >
      <div className="text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
        {description ?? defaultDescription}
      </div>

      {/* Consequences (tier 2 + 3) */}
      {tier !== 1 && consequences && consequences.length > 0 && (
        <div>
          <div
            className="text-[10.5px] font-medium uppercase tracking-widest text-zinc-500 mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            cascading effects · {consequences.length}
          </div>
          <div className="rounded-md border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10 px-3 py-2.5 grid gap-1.5">
            {consequences.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[12.5px] text-red-800 dark:text-red-400 leading-relaxed"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" className="mt-1 flex-shrink-0" aria-hidden>
                  <path
                    d="M1.5 5 L4 7.5 L8.5 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Typed confirm (tier 2 + 3) */}
      {tier !== 1 && (
        <div>
          <div
            className="text-[10.5px] font-medium uppercase tracking-widest text-zinc-500 mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            type <span className="text-red-700 dark:text-red-400">{resource}</span> to confirm
          </div>
          <div className="relative">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className={cn(
                'w-full h-9 px-3 rounded-md text-[13px] tracking-wide',
                'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50',
                'border',
                matches
                  ? 'border-emerald-500 dark:border-emerald-400'
                  : 'border-zinc-200 dark:border-zinc-800',
                'focus:outline-none focus:border-red-700 focus:ring-[3px] focus:ring-red-700/15 dark:focus:ring-red-400/20'
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
              spellCheck={false}
              autoComplete="off"
            />
            {matches && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] tracking-wide text-emerald-600 dark:text-emerald-400 pointer-events-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ✓ matches
              </span>
            )}
          </div>
        </div>
      )}

      {/* Irreversibility checkbox (tier 3 only) */}
      {tier === 3 && (
        <label
          className={cn(
            'flex items-start gap-2.5 px-3 py-2.5 rounded-md cursor-pointer',
            'border',
            irreversibleChecked
              ? 'border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10'
              : 'border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900'
          )}
        >
          <input
            type="checkbox"
            checked={irreversibleChecked}
            onChange={(e) => setIrreversibleChecked(e.target.checked)}
            className="sr-only peer"
          />
          <span
            className={cn(
              'w-4 h-4 rounded-sm mt-px flex-shrink-0 inline-flex items-center justify-center',
              'border-[1.5px]',
              irreversibleChecked
                ? 'border-red-700 bg-red-700 text-white'
                : 'border-zinc-400 dark:border-zinc-600 bg-transparent'
            )}
            aria-hidden
          >
            {irreversibleChecked && (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M2 5 L4.5 7.5 L8 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
              I understand this is irreversible
            </div>
            <div
              className="mt-0.5 text-[10.5px] text-zinc-500 tracking-wide"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Logged to admin audit trail
            </div>
          </div>
        </label>
      )}
    </Modal>
  );
}

function ResourceChip({ children }: { children: React.ReactNode }) {
  return (
    <strong
      className="text-zinc-900 dark:text-zinc-50 font-semibold"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </strong>
  );
}
