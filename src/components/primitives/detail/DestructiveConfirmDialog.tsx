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
 * Tier 3 (high) = typed confirm + irreversibility checkbox + terracotta strip (delete).
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
  /**
   * Testid forwarded to the Modal surface; the footer actions derive
   * `${testId}-cancel-btn` / `${testId}-confirm-btn` from it (Playwright).
   */
  testId?: string;
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
  testId,
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
              className="-mx-5 -mt-4.5 mb-3 px-5 py-1.5 flex items-center gap-2 bg-[color:var(--red-soft)] border-b border-[color:var(--status-rejected-border)] text-[10.5px] font-medium uppercase tracking-widest text-[color:var(--negative-text)]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--brand-terracotta)]" />
              Tier 3 · irreversible · admin audit-logged
            </div>
          )}
          {effectiveTitle}
        </>
      }
      destructive
      size={tier === 1 ? 'sm' : 'md'}
      testId={testId}
      footer={
        <>
          <ModalGhostAction
            data-testid={testId ? `${testId}-cancel-btn` : undefined}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </ModalGhostAction>
          <ModalPrimaryAction
            destructive
            disabled={!canConfirm || loading}
            onClick={onConfirm}
            data-testid={testId ? `${testId}-confirm-btn` : undefined}
          >
            {loading && (
              <span
                aria-hidden
                className="inline-block w-3 h-3 mr-1 rounded-full border-[1.5px] border-current/30 border-t-current animate-spin"
              />
            )}
            {effectiveConfirm}
          </ModalPrimaryAction>
        </>
      }
    >
      <div className="text-[12.5px] text-muted-foreground leading-relaxed">
        {description ?? defaultDescription}
      </div>

      {/* Consequences (tier 2 + 3) */}
      {tier !== 1 && consequences && consequences.length > 0 && (
        <div>
          <div
            className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            cascading effects · {consequences.length}
          </div>
          <div className="rounded-md border border-[color:var(--status-rejected-border)] bg-[color:var(--red-soft)] px-3 py-2.5 grid gap-1.5">
            {consequences.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-[12.5px] text-[color:var(--negative-text)] leading-relaxed"
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
            className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground mb-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            type <span className="text-[color:var(--negative-text)]">{resource}</span> to confirm
          </div>
          <div className="relative">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className={cn(
                'w-full h-9 px-3 rounded-md text-[13px] tracking-wide',
                'bg-card text-foreground',
                'border',
                // A border is a fill, so it takes raw sage; the "matches" label
                // below is 10.5px type and takes the AA-safe --sage-text.
                matches
                  ? 'border-[color:var(--brand-sage)]'
                  : 'border-border',
                'focus:outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/15'
              )}
              style={{ fontFamily: 'var(--font-mono)' }}
              spellCheck={false}
              autoComplete="off"
            />
            {matches && (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] tracking-wide text-[color:var(--sage-text)] pointer-events-none"
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
              ? 'border-[color:var(--status-rejected-border)] bg-[color:var(--red-soft)]'
              : 'border-border bg-secondary'
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
                ? 'border-[color:var(--cta-destructive-bg)] bg-[color:var(--cta-destructive-bg)] text-[color:var(--cta-primary-fg)]'
                : 'border-border bg-transparent'
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
            <div className="text-[13px] font-medium text-foreground">
              I understand this is irreversible
            </div>
            <div
              className="mt-0.5 text-[10.5px] text-muted-foreground tracking-wide"
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
      className="text-foreground font-semibold"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </strong>
  );
}
