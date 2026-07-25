/**
 * ResultActions — post-generation action block (legacy action grid + CTA
 * buttons): PDF via print, CSV download, the logged-out "keep your results"
 * CTA (legacy parity: shown once the anonymous save succeeded) and the
 * notes button. Entirely `print-hide` — fixes the legacy bug where action
 * buttons appeared on the printed report.
 */

import { useNavigate } from 'react-router-dom';
import { FileText, Sheet, NotebookPen, UserRound } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { Card } from '@/components/primitives/shell/Card';

export type SaveState = 'saving' | 'saved' | 'skipped' | 'error';

interface ResultActionsProps {
  onPdf: () => void;
  onCsv: () => void;
  onOpenNotes: () => void;
  isAuthenticated: boolean;
  saveState: SaveState;
}

export function ResultActions({ onPdf, onCsv, onOpenNotes, isAuthenticated, saveState }: ResultActionsProps) {
  const navigate = useNavigate();
  const showLoginCta = !isAuthenticated && (saveState === 'saved' || saveState === 'skipped');

  return (
    <div className="print-hide flex flex-col gap-2.5" data-testid="result-actions">
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          size="lg"
          variant="outline"
          leadingIcon={<FileText className="h-4 w-4" aria-hidden="true" />}
          onClick={onPdf}
          data-testid="result-pdf-btn"
        >
          PDF · via print
        </Button>
        <Button
          size="lg"
          variant="outline"
          leadingIcon={<Sheet className="h-4 w-4" aria-hidden="true" />}
          onClick={onCsv}
          data-testid="result-csv-btn"
        >
          CSV · download
        </Button>
      </div>

      {isAuthenticated && saveState === 'saving' && (
        // --fg-dim (6.40:1): ResultActions is not inside a Card, so this status
        // line sits on the page cream where --fg-muted is only 4.12:1. The
        // 'saved' arm below is already on the AA-safe --sage-text.
        <p className="m-0 text-center text-[12px] text-[color:var(--fg-dim)]" data-testid="result-save-status">
          Saving to your results…
        </p>
      )}
      {isAuthenticated && (saveState === 'saved' || saveState === 'skipped') && (
        <p
          className="m-0 text-center text-[12px] text-[color:var(--sage-text)]"
          data-testid="result-save-status"
        >
          ✓ Saved to your results
        </p>
      )}

      {showLoginCta && (
        // Border-only accent — `bg-accent/10` replaced Card's bg-card (twMerge)
        // and composited over the page cream, taking the 13px body to 3.68:1.
        <Card className="border-accent/40" data-testid="result-login-cta">
          <div className="flex flex-col items-start gap-2">
            <p className="m-0 text-[13px] leading-6 text-muted-foreground">
              This profile was saved anonymously. Log in to keep your results and view your history.
            </p>
            <Button
              size="lg"
              variant="outline"
              leadingIcon={<UserRound className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate('/login')}
              data-testid="result-login-cta-btn"
            >
              Log in to keep your results
            </Button>
          </div>
        </Card>
      )}

      <Button
        size="lg"
        variant="outline"
        className="w-full"
        leadingIcon={<NotebookPen className="h-4 w-4" aria-hidden="true" />}
        onClick={onOpenNotes}
        data-testid="result-notes-btn"
      >
        Add / Edit Notes
      </Button>
    </div>
  );
}
