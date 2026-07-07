/**
 * ResultDetailActions — PDF / CSV always; Edit notes / Delete / Convert only
 * on OWN rows. Foreign and NULL-owner rows (legacy RLS: no update/delete
 * path) get a read-only hint instead — RLS enforces this server-side
 * regardless. A converted row (`clientId` set) swaps Convert for View client.
 *
 * Rendered twice by the page: in the DetailPageFrame hero (desktop) and in
 * the sticky mobile action bar (`mobile`, 44px targets).
 */

import { FileDown, Lock, Printer, StickyNote, Trash2, UserCheck, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/primitives/shell/Button';

interface ResultDetailActionsProps {
  isOwn: boolean;
  /** `results.client_id` — set once the result has been converted/linked. */
  clientId: string | null;
  deleting: boolean;
  converting: boolean;
  onPdf: () => void;
  onCsv: () => void;
  onEditNotes: () => void;
  onDelete: () => void;
  onConvert: () => void;
  mobile?: boolean;
}

function ReadOnlyHint({ mobile }: { mobile?: boolean }) {
  return (
    <span
      className={
        mobile
          ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 text-muted-foreground'
          : 'inline-flex items-center gap-1.5 text-muted-foreground'
      }
      style={{ fontFamily: 'var(--font-pixel)', fontSize: 10.5, letterSpacing: '0.04em' }}
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
  clientId,
  deleting,
  converting,
  onPdf,
  onCsv,
  onEditNotes,
  onDelete,
  onConvert,
  mobile = false,
}: ResultDetailActionsProps) {
  const navigate = useNavigate();
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
          {clientId ? (
            <Button
              variant="outline"
              size={size}
              className={grow}
              leadingIcon={<UserCheck className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => navigate(`/clients/${clientId}`)}
              data-testid={`result-detail-view-client-btn${mobile ? '-mobile' : ''}`}
            >
              View client
            </Button>
          ) : (
            <Button
              variant="outline"
              size={size}
              className={grow}
              leadingIcon={<UserPlus className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={onConvert}
              loading={converting}
              data-testid={`result-detail-convert-btn${mobile ? '-mobile' : ''}`}
            >
              Convert to client
            </Button>
          )}
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
          {/* red-900 (not 700) — the sticky mobile bar's translucent backing
              (bg-white/70) blends with dark report blocks behind it, and axe
              wcag2aa needs the red to hold 4.5:1 over that worst-case mid-gray. */}
          <Button
            variant="ghost"
            size={size}
            className={`text-red-900 dark:text-red-300 ${grow ?? ''}`}
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
