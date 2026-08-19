/**
 * ToolCustomerBar — "who is this for?", asked INSIDE the tool.
 *
 * WHAT THIS REPLACED (2026-08-18): `ToolCustomerPickerModal`, a dialog that
 * stood between the advisor and the tool. Choosing a tool from navigation
 * opened a modal asking for a customer, and only then did the tool appear. That
 * inverted the real order of the work twice over — the advisor often has no
 * customer yet (a walk-in, a what-if), and even when they do, being stopped by
 * a dialog before seeing the page is a gate, not an aid.
 *
 * PRESENTATIONAL ONLY (hoisted here 2026-08-19). It takes options and hands
 * back a choice; it fetches nothing. That split is what lets two feature
 * workspaces share it without either importing the other: `crm` wraps it with
 * `useOwnClientOptions`, `profiler` with its own `useOwnCustomerOptions`, and
 * each keeps its own query key, its own service and its own own-book boundary.
 * Hoisting the DATA instead would have put the customer record in a shared lane
 * — the exact move planning/decisions.md 2026-07-28 rejected.
 *
 * SCOPE is the caller's job and it is not a formality: both wrappers filter on
 * `user_id` rather than leaning on RLS, which would put the whole firm's book
 * in a manager's dropdown (crm/lib/lessons.md 2026-08-13: RLS answers *may I
 * read this row*, never *is this row mine*).
 *
 * `SearchableMultiSelect` in single-select mode is the mandated picker
 * (.claude/rules/ui-components.md). It is NOT inside a Dialog here, so the
 * Portal caveat that applies in modals does not arise.
 *
 * CLEARING gets its own real `<button>` rather than relying on the primitive's
 * inline X. That X is a `<span aria-hidden>` inside the trigger — fine as a
 * mouse shortcut, but not reachable by keyboard and not announced at all, and
 * "put this tool back to blank" is a first-class action here, not a shortcut.
 * (The primitive's own affordance is left alone; fixing it is a shared-component
 * change with its own blast radius.)
 */

import { X } from 'lucide-react';
import {
  SearchableMultiSelect,
  type SMSOption,
} from '@/components/primitives/overlays';
import { Button } from '@/components/primitives/shell/Button';

interface ToolCustomerBarProps {
  /** Currently chosen customer id, or null for the blank tool. */
  value: string | null;
  onChange: (next: string | null) => void;
  /** id + name of the viewer's OWN customers — see the scope note above. */
  options: SMSOption[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /**
   * What the tool does with no customer. Honest per-tool variants, because the
   * tools differ: a calculator is useful blank, a saved plan is not.
   */
  blankHint: string;
  /** Shown in place of `blankHint` once a customer is chosen. */
  chosenHint?: string;
  testId?: string;
}

export function ToolCustomerBar({
  value,
  onChange,
  options,
  isLoading = false,
  isError = false,
  onRetry,
  blankHint,
  // Was "…edit anything here without changing it", which stopped being true on
  // 2026-08-19 when the tax calculator and the SRS planner gained a Save.
  // Editing still changes nothing on its own; the promise now names what does.
  chosenHint = 'Pre-filled from their record — edits stay here until you save.',
  testId = 'tool-customer-bar',
}: ToolCustomerBarProps) {
  return (
    <div
      data-testid={testId}
      className="mb-7 rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-end gap-2 sm:max-w-[520px] sm:flex-1">
          <div className="min-w-0 flex-1">
            <SearchableMultiSelect
              label="Customer"
              options={options}
              value={value}
              onValueChange={onChange}
              clearable
              searchable
              disabled={isLoading || isError}
              placeholder={
                isLoading
                  ? 'Loading your customers…'
                  : isError
                    ? 'Customers could not be loaded'
                    : options.length === 0
                      ? 'No customers in your book yet'
                      : 'Search your customers…'
              }
              triggerTestId={`${testId}-select`}
              optionTestIdPrefix={`${testId}-option`}
            />
          </div>
          {value && (
            <Button
              variant="outline"
              size="sm"
              className="flex-none pointer-coarse:min-h-11"
              leadingIcon={<X className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => onChange(null)}
              data-testid={`${testId}-clear`}
            >
              Clear
            </Button>
          )}
        </div>

        <p className="m-0 text-[12px] leading-[1.6] text-[color:var(--fg-dim)] sm:max-w-[46%] sm:text-right">
          {isError ? (
            <>
              Your customer list didn&rsquo;t load.{' '}
              <button
                type="button"
                onClick={() => onRetry?.()}
                className="underline underline-offset-2 hover:text-[color:var(--brown-text)]"
              >
                Try again
              </button>
              .
            </>
          ) : value ? (
            chosenHint
          ) : (
            blankHint
          )}
        </p>
      </div>
    </div>
  );
}
