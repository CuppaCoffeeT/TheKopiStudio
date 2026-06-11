import type { Page } from '@playwright/test';

/**
 * Drive a `SelectMenu` primitive (Radix `Select` combobox) from a test.
 *
 * Since the 2026-06 "migrate native form Select → SelectMenu" refactor, the
 * dropdowns that used to be native `<select>` elements are now Radix comboboxes
 * (`<button role="combobox">` trigger + portaled `role="listbox"` of
 * `role="option"` items). `locator.selectOption()` ONLY works on a native
 * `<select>`, so it now throws `Element is not a <select> element`. Use this
 * helper instead: it opens the trigger, then clicks the option — by a per-option
 * `data-testid` when the component emits one (preferred, value-stable) or by the
 * option's visible text as a fallback.
 *
 * @example
 *   await chooseSelectMenuOption(page, {
 *     trigger: 'engineer-dashboard-sort-by',
 *     optionLabel: 'Status',
 *   });
 */
export async function chooseSelectMenuOption(
  page: Page,
  opts: {
    /** testid of the SelectMenuTrigger button. */
    trigger: string;
    /** Preferred: per-option `data-testid` (value-stable). */
    optionTestId?: string;
    /** Fallback: the option's visible label (accessible name). */
    optionLabel?: string | RegExp;
    timeout?: number;
  },
): Promise<void> {
  const timeout = opts.timeout ?? 10_000;
  const trigger = page.locator(`[data-testid="${opts.trigger}"]:visible`).first();
  await trigger.waitFor({ state: 'visible', timeout });
  await trigger.click();

  // Radix Select content is portaled; its options carry role="option".
  const listbox = page.locator('[role="listbox"]').first();
  await listbox.waitFor({ state: 'visible', timeout: 5_000 });

  const option = opts.optionTestId
    ? page.getByTestId(opts.optionTestId).first()
    : listbox.getByRole('option', { name: opts.optionLabel! }).first();
  await option.waitFor({ state: 'visible', timeout: 5_000 });
  await option.click();

  // Let the listbox close so the caller's next interaction isn't intercepted.
  await listbox.waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {});
}
