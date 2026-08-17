import { expect, type Page } from '@playwright/test';

/**
 * ToolShortcutsPage — POM for the /dashboard Overview tool shortcuts: the
 * button row (ToolShortcutRow) and the customer picker each button opens
 * (ToolCustomerPickerModal), plus the seed/cleanup pair those tests need.
 *
 * Selectors are real data-testids from
 *   src/features/crm/components/ToolShortcutRow.tsx
 *   src/features/crm/components/modals/ToolCustomerPickerModal.tsx
 *   src/features/crm/components/modals/{AddCustomerChoiceModal,ClientFormModal}.tsx
 *
 * THE `clients-table` WAITS ARE LOAD-BEARING, not defensive. Counting rows
 * straight after `goto('/clients')` reads a list that has not fetched yet:
 * cleanup then concludes "already clean" and returns while its seeded customer
 * is still live in the advisor's book, which turns dashboard.spec's zero-KPI
 * assertions red on the NEXT run. A teardown that can silently skip is worse
 * than no teardown (tests/lessons.md 2026-08-17).
 */
export class ToolShortcutsPage {
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
    await this.page.getByTestId('crm-client-email-input').fill('e2e-shortcut@example.com');
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

  /** Press a tool's shortcut and pick `customerName` out of the picker. */
  async launchTool(key: string, customerName: string): Promise<void> {
    await this.page.goto('/dashboard');
    await this.page.getByTestId(`home-tool-shortcut-${key}`).click();
    await this.page.getByTestId('home-tool-customer-picker').waitFor({ timeout: 30_000 });
    await this.page.getByTestId('home-tool-customer-select').click();
    await this.page
      .locator('[data-testid^="home-tool-customer-option"]')
      .filter({ hasText: customerName })
      .first()
      .click();
    await this.page.getByTestId('home-tool-customer-picker-confirm').click();
  }
}
