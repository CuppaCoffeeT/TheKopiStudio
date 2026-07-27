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

/**
 * --fg-dim, not --fg-muted: the desktop hint renders in the DetailPageFrame
 * hero, which sits on the PAGE cream #F0E6D6. At 10.5px #7D6B5B is 4.12:1
 * there and fails AA; #5D4F3F clears 6.40:1 — the same call the hero's own
 * meta line makes one row above it. The mobile copy rides the sticky
 * `bg-popover/80` bar, whose composite shifts with whatever report block
 * scrolls behind it (4.71:1 for --fg-muted over the DISC-D hero tint, i.e.
 * one repaint from failing), so both variants take the one safe token.
 */
function ReadOnlyHint({ mobile }: { mobile?: boolean }) {
  return (
    <span
      className={
        mobile
          ? 'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 text-[color:var(--fg-dim)]'
          : 'inline-flex items-center gap-1.5 text-[color:var(--fg-dim)]'
      }
      style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, letterSpacing: '0.04em' }}
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
          {/* --negative-text, not the raw terracotta: the label is a 12.5px
              button string, and the sticky mobile bar's translucent cream
              backing blends with report blocks behind it. #AB4925 holds
              4.5:1 over both cream surfaces, which covers that worst case. */}
          <Button
            variant="ghost"
            size={size}
            className={`text-[color:var(--negative-text)] ${grow ?? ''}`}
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
