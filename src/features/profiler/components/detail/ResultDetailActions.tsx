/**
 * ResultDetailActions — PDF / CSV always; Edit notes / Delete only on OWN
 * rows. Foreign and NULL-owner rows (legacy RLS: no update/delete path) get a
 * read-only hint instead — RLS enforces this server-side regardless.
 *
 * Rendered twice by the page: in the DetailPageFrame hero (desktop) and in
 * the sticky mobile action bar (`mobile`, 44px targets).
 */

import { FileDown, Lock, Printer, StickyNote, Trash2 } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';

interface ResultDetailActionsProps {
  isOwn: boolean;
  deleting: boolean;
  onPdf: () => void;
  onCsv: () => void;
  onEditNotes: () => void;
  onDelete: () => void;
  mobile?: boolean;
}

function ReadOnlyHint({ mobile }: { mobile?: boolean }) {
  return (
    <span
      className={
        mobile
          ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 text-zinc-500 dark:text-zinc-400'
          : 'inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400'
      }
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.04em' }}
      title="Only the advisor who saved a result can edit its notes or delete it."
      data-testid="result-detail-readonly-hint"
    >
      <Lock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      Read-only — saved by another advisor or anonymously
    </span>
  );
}

export function ResultDetailActions({
  isOwn,
  deleting,
  onPdf,
  onCsv,
  onEditNotes,
  onDelete,
  mobile = false,
}: ResultDetailActionsProps) {
  const size = mobile ? 'lg' : 'md';
  const grow = mobile ? 'flex-1' : undefined;

  return (
    <div
      className={mobile ? 'flex w-full flex-wrap items-center gap-2' : 'flex items-center gap-2'}
      data-testid={mobile ? 'result-detail-actions-mobile' : 'result-detail-actions'}
    >
      {!isOwn && !mobile && <ReadOnlyHint />}
      {isOwn && (
        <>
          <Button
            variant="ghost"
            size={size}
            className={grow}
            leadingIcon={<StickyNote className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={onEditNotes}
            data-testid={`result-detail-edit-notes-btn${mobile ? '-mobile' : ''}`}
          >
            Edit notes
          </Button>
          <Button
            variant="ghost"
            size={size}
            className={`text-red-700 dark:text-red-400 ${grow ?? ''}`}
            leadingIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={onDelete}
            loading={deleting}
            data-testid={`result-detail-delete-btn${mobile ? '-mobile' : ''}`}
          >
            Delete
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size={size}
        className={grow}
        leadingIcon={<FileDown className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={onCsv}
        data-testid={`result-detail-csv-btn${mobile ? '-mobile' : ''}`}
      >
        CSV
      </Button>
      <Button
        variant="primary"
        size={size}
        className={grow}
        leadingIcon={<Printer className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={onPdf}
        data-testid={`result-detail-pdf-btn${mobile ? '-mobile' : ''}`}
      >
        PDF
      </Button>
      {!isOwn && mobile && <ReadOnlyHint mobile />}
    </div>
  );
}
