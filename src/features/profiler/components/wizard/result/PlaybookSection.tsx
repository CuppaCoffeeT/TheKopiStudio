/**
 * PlaybookSection — Communication Playbook (legacy `resultHTML` playbook):
 * 5 categories in frozen order engage/appt/followup/objections/close, every
 * statement copyable. No clipboard primitive exists — tap-to-copy is
 * IconButton + navigator.clipboard + showSuccess (per PRD building-blocks
 * note); promote to a primitive later if reused.
 */

import { Copy } from 'lucide-react';
import { Card } from '@/components/primitives/shell/Card';
import { IconButton } from '@/components/primitives/IconButton';
import { showError, showSuccess } from '@/utils/toastHelper';
import type { DiscLetter, DiscProfile, PlaybookCategoryKey } from '../../../types';
import { Eyebrow } from '../WizardAtoms';

const CATEGORY_ORDER: readonly PlaybookCategoryKey[] = [
  'engage',
  'appt',
  'followup',
  'objections',
  'close',
];

async function copyStatement(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Copied');
  } catch (error) {
    showError('Copy failed', error instanceof Error ? error : undefined);
  }
}

interface PlaybookSectionProps {
  primary: DiscLetter;
  profile: DiscProfile;
}

export function PlaybookSection({ primary, profile }: PlaybookSectionProps) {
  // Border-only accent — `bg-accent/5` replaced Card's bg-card (twMerge) and
  // composited over the page cream, taking the eyebrow + intro to 3.90:1.
  // On card cream the intro reads 4.72:1.
  return (
    <Card className="border-accent/30" data-testid="result-playbook">
      <Eyebrow>Communication Playbook — DISC-{primary}</Eyebrow>
      <p className="m-0 mb-3.5 text-[12px] leading-6 text-muted-foreground">
        Ready-to-use statements. Replace [Name], [Day], [detail] with real info. Tap the copy icon
        to copy a statement.
      </p>

      <div className="flex flex-col gap-3.5">
        {CATEGORY_ORDER.map((cat, ci) => {
          const section = profile.msgs[cat];
          return (
            <div
              key={cat}
              className="overflow-hidden rounded-xl border border-border/80 bg-card"
              data-testid={`result-playbook-${cat}`}
            >
              {/* The legacy `catIcons` emoji (💬📅📲🛡✅) that used to prefix
                  each label are gone — no emoji anywhere in /profiler. The
                  categories are a frozen ordered set, so the spec's device for
                  one replaces them: a zero-padded index, same size and same
                  --brown-text as the label it leads. */}
              <div className="border-b border-border px-3.5 py-2.5">
                <span
                  className="uppercase text-[color:var(--brown-text)]"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em' }}
                >
                  {String(ci + 1).padStart(2, '0')} · {section.lbl}
                </span>
              </div>
              <ol className="m-0 flex list-none flex-col p-0">
                {section.items.map((statement, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 border-b border-border px-3.5 py-2.5 last:border-b-0"
                  >
                    <span
                      className="mt-0.5 flex-shrink-0 text-muted-foreground"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}
                    >
                      {i + 1}.
                    </span>
                    <span className="flex-1 text-[13px] leading-6 text-muted-foreground">
                      {statement}
                    </span>
                    <IconButton
                      size="md"
                      className="print-hide -my-1 flex-shrink-0"
                      aria-label={`Copy statement ${i + 1} of ${section.lbl}`}
                      onClick={() => void copyStatement(statement)}
                      data-testid={`result-copy-${cat}-${i}`}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
