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
 * Now the tool opens immediately and this bar sits at the top of it. Picking a
 * customer writes `?customer=<id>` and the page re-seeds from their record;
 * clearing it returns the tool to a blank, independent scratch pad. The URL is
 * the state, so a filled-in tool is a shareable, bookmarkable link and the
 * browser Back button steps between customers.
 *
 * SCOPE: the advisor's OWN customers only — `useOwnClientOptions` filters on
 * `user_id` rather than leaning on RLS, which would put the whole firm's book
 * in a manager's dropdown (lib/lessons.md 2026-08-13: RLS answers *may I read
 * this row*, never *is this row mine*).
 *
 * `SearchableMultiSelect` in single-select mode is the mandated picker
 * (.claude/rules/ui-components.md). It is NOT inside a Dialog here, so the
 * Portal caveat that applies in modals does not arise.
 */

import { SearchableMultiSelect, type SMSOption } from '@/components/primitives/overlays';
import { useOwnClientOptions } from '../hooks/useOwnClientOptions';

interface ToolCustomerBarProps {
  /** Currently chosen customer id, or null for the blank tool. */
  value: string | null;
  onChange: (next: string | null) => void;
  /**
   * What the tool does with no customer. Two honest variants, because the
   * tools differ: a calculator is useful blank, a saved plan is not.
   */
  blankHint: string;
  testId?: string;
}

export function ToolCustomerBar({
  value,
  onChange,
  blankHint,
  testId = 'tool-customer-bar',
}: ToolCustomerBarProps) {
  const { data: customers, isLoading, isError, refetch } = useOwnClientOptions(true);

  const options: SMSOption[] = (customers ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  return (
    <div
      data-testid={testId}
      className="mb-7 rounded-xl border border-border bg-card px-4 py-3.5 sm:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 sm:max-w-[420px] sm:flex-1">
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

        <p className="m-0 text-[12px] leading-[1.6] text-[color:var(--fg-dim)] sm:max-w-[46%] sm:text-right">
          {isError ? (
            <>
              Your customer list didn&rsquo;t load.{' '}
              <button
                type="button"
                onClick={() => void refetch()}
                className="underline underline-offset-2 hover:text-[color:var(--brown-text)]"
              >
                Try again
              </button>
              .
            </>
          ) : value ? (
            'Pre-filled from their record — edit anything here without changing it.'
          ) : (
            blankHint
          )}
        </p>
      </div>
    </div>
  );
}
