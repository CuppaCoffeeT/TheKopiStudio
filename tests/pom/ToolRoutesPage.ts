import { expect, type Locator, type Page } from '@playwright/test';

/**
 * ToolRoutesPage — POM for the standalone `/tools/*` routes and the customer
 * bar at the top of each one.
 *
 * REPLACES `ToolShortcutsPage` (deleted 2026-08-18) and the modal flow it
 * drove. The tools used to be sub-routes of a customer, so reaching one from
 * navigation meant answering "which customer?" in a dialog BEFORE the page
 * appeared. Each tool is now a route of its own and asks inside itself, via
 * `?customer=<id>`.
 *
 * Selectors are real data-testids from
 *   src/features/crm/planning/components/PlanningToolFrame.tsx
 *   src/features/crm/components/ToolCustomerBar.tsx
 *   src/features/crm/pages/ClientReportPage.tsx
 *
 * THE `clients-table` WAITS ARE LOAD-BEARING, not defensive. Counting rows
 * straight after `goto('/clients')` reads a list that has not fetched yet:
 * cleanup then concludes "already clean" and returns while its seeded customer
 * is still live in the advisor's book, which turns dashboard.spec's zero-KPI
 * assertions red on the NEXT run. A teardown that can silently skip is worse
 * than no teardown (tests/lessons.md 2026-08-17).
 */
export class ToolRoutesPage {
  constructor(readonly page: Page) {}

  /** Create one customer in the signed-in advisor's own book, via the UI. */
  async seedCustomer(name: string): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.getByTestId('home-add-customer-btn').click();
    await this.page.getByTestId('crm-add-customer-choice-modal').waitFor({ timeout: 30_000 });
    await this.page.getByTestId('crm-add-customer-choice-empty').click();
    await this.page.getByTestId('crm-client-form-modal').waitFor({ timeout: 30_000 });
    await this.page.getByTestId('crm-client-name-input').fill(name);
    // Name / email / phone are the add form's required trio.
    await this.page.getByTestId('crm-client-email-input').fill('e2e-tools@example.com');
    await this.page.getByTestId('crm-client-phone-input').fill('91230000');
    await this.page.getByTestId('crm-client-save-btn').click();
    await this.page
      .getByTestId('crm-client-form-modal')
      .waitFor({ state: 'hidden', timeout: 30_000 });
  }

  /** Soft-delete that customer through the UI. Idempotent. */
  async removeCustomer(name: string): Promise<void> {
    await this.page.goto('/clients');
    await this.page.getByTestId('clients-table').waitFor({ state: 'visible', timeout: 30_000 });
    const row = this.page
      .locator(
        '[data-testid^="clients-row-"]:visible, [data-testid^="clients-mobile-card-"]:visible',
      )
      .filter({ hasText: name })
      .first();
    await expect
      .poll(async () => (await row.count()) > 0, { timeout: 15_000 })
      .toBe(true)
      .catch(() => undefined); // genuinely absent (already removed) — fall through
    if ((await row.count()) === 0) return;

    await row.click();
    await this.page.waitForURL(/\/clients\/[0-9a-f-]+$/, { timeout: 30_000 });
    await this.page
      .locator(
        '[data-testid="clients-detail-delete-btn"]:visible, [data-testid="clients-detail-delete-btn-mobile"]:visible',
      )
      .first()
      .click();
    await this.page.getByTestId('clients-detail-delete-dialog').waitFor({ timeout: 20_000 });
    await this.page.getByTestId('clients-detail-delete-dialog-confirm-btn').click();
    await this.page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
  }

  /** The customer bar belonging to one tool (`tax-calculator`, `srs`, …). */
  bar(testId: string): Locator {
    return this.page.getByTestId(`${testId}-customer-bar`);
  }

  /** Choose a customer inside an already-open tool. */
  async pickCustomer(testId: string, customerName: string): Promise<void> {
    await this.page.getByTestId(`${testId}-customer-bar-select`).click();
    await this.page
      .locator(`[data-testid^="${testId}-customer-bar-option"]`)
      .filter({ hasText: customerName })
      .first()
      .click();
  }

  /** Every option the picker offers — the own-book boundary is asserted on it. */
  async customerOptions(testId: string): Promise<string[]> {
    await this.page.getByTestId(`${testId}-customer-bar-select`).click();
    const options = this.page.locator(`[data-testid^="${testId}-customer-bar-option"]`);
    await expect.poll(async () => options.count(), { timeout: 30_000 }).toBeGreaterThan(0);
    return (await options.allInnerTexts()).map((text) => text.trim());
  }
}
