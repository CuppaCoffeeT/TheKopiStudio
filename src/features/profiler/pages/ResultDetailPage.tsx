/**
 * ResultDetailPage — full report for one saved profiling result (DETAIL
 * archetype, route /profiler-results/:id — shares modulePath with the list).
 *
 * The report body reuses the wizard's section components via
 * `StoredResultReport`, reconstructed from the stored row by a scoring replay
 * (faithful MBTI strengths — fixes the legacy fake-3). Notes editing and
 * delete exist only on OWN rows; foreign/NULL-owner rows are read-only (RLS
 * enforces it, the UI explains it). PDF = window.print() + lib/print.css
 * `.print-area`; CSV = lib/export from the stored fields (legacy format).
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DetailPageFrame } from '@/components/primitives/detail/DetailPageFrame';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import type { PageShellStatusTone } from '@/components/primitives/detail/PageShell';
import { Button } from '@/components/primitives/shell/Button';
import { Card } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';
import { useAuth } from '@/contexts/AuthContext';
import { formatDisplayDateLong, getLocalDateString } from '@/utils/timezoneUtils';
import { showSuccess } from '@/utils/toastHelper';
import { buildCsv, downloadCsv } from '../lib/export';
import { PR } from '../lib/content';
import { meetingLabel } from '../lib/meeting';
import type { DiscLetter, ProfilerResult } from '../types';
import { useConvertResult } from '../hooks/useConvertResult';
import { useResultDetail } from '../hooks/useResultDetail';
import { useDeleteResult, useUpdateResultNotes } from '../hooks/useResultMutations';
import { ConvertResultModal } from '../components/detail/ConvertResultModal';
import { ResultDetailActions } from '../components/detail/ResultDetailActions';
import { ResultNotesModal } from '../components/detail/ResultNotesModal';
import { StoredResultReport } from '../components/detail/StoredResultReport';
import '../lib/print.css';

const STATUS_TONES: Record<DiscLetter, PageShellStatusTone> = {
  D: 'danger',
  I: 'warning',
  S: 'success',
  C: 'info',
};

/** Legacy CSV export of a saved row — date is the download date (legacy `dlCSV`). */
function downloadRowCsv(row: ProfilerResult): void {
  const date = getLocalDateString(new Date());
  const csv = buildCsv({
    date,
    advisor: row.advisor_name,
    prospect: row.prospect_name,
    age: row.age_range ?? '',
    occupation: row.occupation ?? '',
    meeting: row.meeting ?? '',
    discPrimary: row.disc_primary,
    discSecondary: row.disc_secondary,
    mbti: row.mbti,
    scoreD: row.score_d,
    scoreI: row.score_i,
    scoreS: row.score_s,
    scoreC: row.score_c,
    questions: row.questions_answered,
    observations: row.observations_count,
    notes: row.notes ?? '',
  });
  downloadCsv(`profile_${row.prospect_name.replace(/\s+/g, '_')}_${date}.csv`, csv);
  showSuccess('CSV saved');
}

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const detail = useResultDetail(id);
  const updateNotes = useUpdateResultNotes(id ?? '');
  const removeResult = useDeleteResult(id ?? '');
  const [notesOpen, setNotesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const row = detail.data ?? null;
  const convert = useConvertResult(row);
  const isOwn = Boolean(row && user && row.user_id === user.id);
  const statusTone = row ? STATUS_TONES[row.disc_primary as DiscLetter] : undefined;

  const actionProps = row
    ? {
        isOwn,
        clientId: row.client_id,
        deleting: removeResult.isPending,
        converting: convert.isPending,
        onPdf: () => window.print(),
        onCsv: () => downloadRowCsv(row),
        onEditNotes: () => setNotesOpen(true),
        onDelete: () => setDeleteOpen(true),
        onConvert: () => setConvertOpen(true),
      }
    : null;

  return (
    <DetailPageFrame
      breadcrumb={[
        { label: 'Workspace', href: '/dashboard' },
        { label: 'Results', href: '/profiler-results' },
        { label: row?.prospect_name ?? 'Result' },
      ]}
      title={row?.prospect_name ?? 'Profiling result'}
      recordId={id ? id.slice(0, 8) : undefined}
      status={
        row && statusTone
          ? { tone: statusTone, label: `DISC-${row.disc_primary} · ${PR[row.disc_primary as DiscLetter].nm}` }
          : undefined
      }
      meta={
        row
          ? [
              formatDisplayDateLong(row.created_at),
              `Advisor: ${row.advisor_name}`,
              meetingLabel(row.meeting),
            ]
          : undefined
      }
      actions={actionProps ? <ResultDetailActions {...actionProps} /> : undefined}
      mobileActionBar={actionProps ? <ResultDetailActions {...actionProps} mobile /> : undefined}
      variant="fullWidth"
      testId="profiler-result-detail"
    >
      {detail.isLoading && (
        <div data-testid="result-detail-loading">
          <LoadingSkeleton variant="table-rows" rowCount={6} />
        </div>
      )}

      {detail.isError && (
        <ErrorState
          variant="compact"
          subhead="This saved result didn't load."
          body="The profiling result could not be read. Check your connection and try again."
          onRetry={() => void detail.refetch()}
        />
      )}

      {!detail.isLoading && !detail.isError && !row && (
        <Card data-testid="result-detail-not-found">
          <NoResultsState query={id} />
          <div className="flex justify-center pb-2">
            <Button
              variant="outline"
              onClick={() => navigate('/profiler-results')}
              data-testid="result-detail-back-link"
            >
              ← Back to results
            </Button>
          </div>
        </Card>
      )}

      {row && <StoredResultReport row={row} />}

      {row && isOwn && !row.client_id && (
        <ConvertResultModal
          open={convertOpen}
          onOpenChange={setConvertOpen}
          prospectName={row.prospect_name}
          converting={convert.isPending}
          onConfirm={() => convert.mutate()}
        />
      )}
      {row && (
        <ResultNotesModal
          open={notesOpen}
          onOpenChange={setNotesOpen}
          prospectName={row.prospect_name}
          initialNotes={row.notes ?? ''}
          saving={updateNotes.isPending}
          onSave={(notes) => updateNotes.mutate(notes, { onSuccess: () => setNotesOpen(false) })}
        />
      )}

      {row && (
        <DestructiveConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          tier={1}
          resource={row.prospect_name}
          resourceKind="result"
          title="delete result?"
          description={`This permanently removes ${row.prospect_name}'s saved profile and playbook. It cannot be undone.`}
          confirmLabel="Delete result"
          loading={removeResult.isPending}
          onConfirm={() => removeResult.mutate()}
          testId="result-detail-delete-dialog"
        />
      )}
    </DetailPageFrame>
  );
}
