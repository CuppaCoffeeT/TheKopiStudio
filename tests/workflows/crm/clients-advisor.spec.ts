/**
 * Advisor CRM full journey @p0 @mobile — REAL writes into the advisor's live
 * book (clients / policies / interactions / bank_balance_history), exercised
 * end-to-end through the UI and fully soft-deleted through the UI at the end.
 *
 * Runs as the e2e ADVISOR via the saved storageState (tests/.auth/advisor.json,
 * written by tests/auth.setup.ts under playwright.parallel.config.ts).
 *
 * Flow (one test, step-structured): dashboard KPI baseline → create client
 * 'E2E-Crm-<suffix>' (seed balance 5000 + income 60000) → list search opens
 * the detail → Overview shows the financials and the DERIVED total $5,000.00 →
 * Bank history shows the 'Initial client onboarding' seed row → add a record
 * (7000, LATER date) → derived total recomputes to $7,000.00 → edit the FIRST
 * (earlier-dated) record to 9999 → derived total STAYS $7,000.00 (latest-by-
 * date wins — the corrected legacy drift bug) → Policies: Life Insurance
 * (premium 200 Monthly, death 500000, one-shot TPD copy, cash value with two
 * projection rows) + Hospitalization (premium/coverage forced 0, IS fields) →
 * Interactions: follow-up in 3 days flips the header badge from blue (next
 * review +30d) to AMBER → /crm dashboard KPIs = baseline + (1 client, 2 active
 * policies, $2,400 annualised premium = 200×12, 1 follow-up) → list search →
 * rename persists → CLEANUP: soft-delete policies/interactions/bank rows, then
 * the client; the list shows no match and the KPIs drop back to baseline.
 *
 * Data safety (LIVE shared DB): every row is created by this spec under the
 * e2e advisor's own account with an 'E2E-Crm-' + per-run unique name, and
 * deleted through the UI as the final step. An afterEach safety net re-runs
 * the same UI cleanup when the test failed mid-flow (hook-based rather than a
 * `finally` inside the test body so it still runs with a LIVE page after a
 * test timeout — mirrors profiler results-advisor.spec.ts). RLS confines every
 * write to the advisor's own book; sky/Keane data is untouchable by design.
 *
 * Serialisation: the dashboard KPI deltas read the WHOLE advisor book, so the
 * chromium-desktop and mobile-safari projects must not interleave writes — the
 * describe holds the same cross-worker mkdir lock as profiler
 * account-settings.spec.ts (per-host, exactly the scope of one invocation).
 *
 * All selectors are real data-testids read from src/features/crm/** via the
 * shared ClientsPage POM (tests/pom/ClientsPage.ts). Badge `data-tone` support
 * was added to src/components/primitives/shell/Badge.tsx with this spec for
 * the amber/blue follow-up assertions.
 */

import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { ClientsPage } from '../../pom/ClientsPage';

/**
 * Cross-worker mutex for the advisor's CRM book (same pattern as the
 * profiler account-settings advisor-row lock). Both Playwright projects run
 * this file concurrently at workers≥2 and the dashboard-KPI assertions read
 * the whole RLS-scoped book, so the journeys must not interleave.
 */
const ADVISOR_BOOK_LOCK = join(tmpdir(), 'crm-e2e-advisor-book.lock');

function bookLockIsStale(): boolean {
  try {
    const pid = Number(readFileSync(join(ADVISOR_BOOK_LOCK, 'pid'), 'utf8'));
    process.kill(pid, 0); // throws if the holder process is gone
    return false;
  } catch {
    // No live holder — but a JUST-created lock may not have written its pid
    // yet. Only treat it as stale once it has had ample time to do so.
    try {
      return Date.now() - statSync(ADVISOR_BOOK_LOCK).mtimeMs > 10_000;
    } catch {
      return false; // lock dir vanished — the next mkdir attempt resolves it
    }
  }
}

async function acquireBookLock(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      mkdirSync(ADVISOR_BOOK_LOCK); // atomic — exactly one worker wins
      writeFileSync(join(ADVISOR_BOOK_LOCK, 'pid'), String(process.pid));
      return;
    } catch {
      if (bookLockIsStale()) {
        rmSync(ADVISOR_BOOK_LOCK, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error(
          `[clients-advisor.spec] timed out waiting for the advisor-book lock (${ADVISOR_BOOK_LOCK}) — ` +
            'is another worker/invocation stuck mid-journey?',
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

function releaseBookLock(): void {
  rmSync(ADVISOR_BOOK_LOCK, { recursive: true, force: true });
}

// ── Dashboard KPI helpers ────────────────────────────────────────────────────

const KPI = {
  clients: 'crm-kpi-total-clients',
  policies: 'crm-kpi-active-policies',
  premium: 'crm-kpi-annual-premium',
  followUps: 'crm-kpi-upcoming-follow-ups',
} as const;

interface DashboardStats {
  clients: number;
  policies: number;
  premium: number;
  followUps: number;
}

/**
 * Numeric value of one KPI tile. The label/subtitle carry no digits, so the
 * first number-ish token IS the value. NumberTicker quirks handled: the tile
 * must be scrolled into view to start ticking, and a value of 0 never writes
 * text at all — an empty ticker reads as 0.
 */
async function kpiValue(page: Page, testId: string): Promise<number> {
  const tile = page.getByTestId(testId);
  await tile.scrollIntoViewIfNeeded();
  const text = await tile.innerText();
  const match = text.match(/[\d,]+(?:\.\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : 0;
}

/** Tile value once the count-up animation has settled (two stable samples). */
async function settledKpiValue(page: Page, testId: string): Promise<number> {
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 30_000 });
  let prev = await kpiValue(page, testId);
  await expect
    .poll(
      async () => {
        const next = await kpiValue(page, testId);
        const settled = next === prev;
        prev = next;
        return settled;
      },
      { timeout: 20_000, intervals: [500, 500, 500, 1_000] },
    )
    .toBe(true);
  return prev;
}

/** Read all four settled KPI values on an already-open /crm dashboard. */
async function readDashboardStats(page: Page): Promise<DashboardStats> {
  await page.getByTestId('crm-dashboard').waitFor({ state: 'visible', timeout: 30_000 });
  return {
    clients: await settledKpiValue(page, KPI.clients),
    policies: await settledKpiValue(page, KPI.policies),
    premium: await settledKpiValue(page, KPI.premium),
    followUps: await settledKpiValue(page, KPI.followUps),
  };
}

/** Poll each tile to the exact expected value (refetch + ticker race-proof). */
async function expectDashboardStats(page: Page, expected: DashboardStats): Promise<void> {
  await page.getByTestId('crm-dashboard').waitFor({ state: 'visible', timeout: 30_000 });
  for (const key of Object.keys(KPI) as Array<keyof typeof KPI>) {
    await expect
      .poll(() => kpiValue(page, KPI[key]), { timeout: 30_000, message: `KPI tile "${key}"` })
      .toBe(expected[key]);
  }
}

// ── Spec utilities ───────────────────────────────────────────────────────────

function successToast(page: Page, text: string): Locator {
  return page.getByTestId('toast-success').filter({ hasText: text }).first();
}

/** Singapore calendar date `days` from now, as ISO 'YYYY-MM-DD' (en-CA trick). */
function sgDateInDays(days: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + days * 86_400_000));
}

/**
 * Shared by the test's final step and the afterEach safety net. Within-file
 * serial (fullyParallel: false), never shared across workers.
 */
let clientName = '';
let clientId = '';
let cleanedUp = true;

/**
 * Best-effort UI cleanup for a mid-flow failure: find the client (by id, else
 * by name), soft-delete all child rows, then the client. Logs LOUDLY when it
 * cannot finish — that is real residue on the live shared DB.
 */
async function emergencyCleanup(page: Page): Promise<void> {
  const crm = new ClientsPage(page);
  try {
    if (!clientId) {
      await crm.gotoList();
      await crm.search(clientName);
      try {
        await crm.visibleRows().first().waitFor({ state: 'visible', timeout: 10_000 });
      } catch {
        cleanedUp = true; // nothing was created — zero residue
        return;
      }
      clientId = await crm.idFromRow(crm.visibleRows().first());
    }
    await page.goto(`/clients/${clientId}`);
    const overview = page.getByTestId('clients-detail-overview');
    const notFound = page.getByTestId('clients-detail-not-found');
    await overview.or(notFound).first().waitFor({ state: 'visible', timeout: 30_000 });
    if (await notFound.count()) {
      cleanedUp = true; // already soft-deleted
      return;
    }
    for (const kind of ['policies', 'interactions', 'bank'] as const) {
      await crm.deleteAllChildRows(kind);
    }
    await crm.deleteClientFromDetail();
    cleanedUp = true;
    console.warn(
      `[clients-advisor] afterEach safety net removed residue client "${clientName}" — ` +
        'the spec failed before its UI cleanup step.',
    );
  } catch (error) {
    console.error(
      `[clients-advisor] EMERGENCY CLEANUP FAILED — possible residue client "${clientName}" ` +
        `(id: ${clientId || 'unknown'}) on the LIVE shared DB. Soft-delete it via the UI as the e2e advisor.`,
      error,
    );
  }
}

test.describe('clients — advisor full CRM journey', () => {
  test.use({ storageState: authFileFor('advisor') });

  // Serialise the WHOLE journey across projects/workers — the dashboard KPI
  // baseline+delta assertions read the entire advisor book.
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // The peer project may hold the lock for its full journey (≤300s) — widen
    // this hook's budget well beyond the per-test timeout.
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireBookLock(660_000);
  });
  test.afterAll(() => {
    releaseBookLock();
  });

  // Safety net: re-runs the UI cleanup when the test failed (or timed out)
  // before its final cleanup step. No-op on the happy path.
  test.afterEach(async ({ page }, testInfo) => {
    if (cleanedUp) return;
    testInfo.setTimeout(testInfo.timeout + 180_000);
    await emergencyCleanup(page);
  });

  test('create → bank recompute (latest-by-date wins) → policies → follow-up badge → dashboard → rename → cleanup @p0 @mobile', async ({
    page,
  }, testInfo) => {
    // Long single journey (4 modals, 3 dashboard visits, full UI cleanup).
    test.setTimeout(300_000);

    // Per-run unique, retry-safe, parallel-project-safe — and free of every
    // character the list's sanitizeSearchTerm strips, so search matches verbatim.
    const suffix = `${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;
    clientName = `E2E-Crm-${suffix}`;
    clientId = '';
    cleanedUp = false;

    const renamedClient = `${clientName}-edited`;
    const todayIso = sgDateInDays(0);
    const crm = new ClientsPage(page);
    let baseline: DashboardStats = { clients: 0, policies: 0, premium: 0, followUps: 0 };
    let seedRowId = '';

    await test.step('dashboard KPI baseline (pre-create)', async () => {
      await page.goto('/crm');
      baseline = await readDashboardStats(page);
    });

    await test.step('create client with seed balance 5000 + income 60000', async () => {
      await crm.gotoList();
      await crm.addClientButton.click();
      await expect(crm.clientModal).toBeVisible();
      await crm.fillClientForm({
        name: clientName,
        email: `e2e-crm-${Date.now()}@example.com`,
        phone: '9123 0000',
        dateOfBirth: '1990-06-15',
        occupation: 'E2E Engineer',
        annualIncome: '60000',
        riskProfile: 'Aggressive',
        notes: 'E2E journey client — safe to soft-delete.',
        // createdDate left blank → defaults to today (seeds the bank row date).
        nextReviewDate: sgDateInDays(30), // >7 days → blue badge until the interaction lands
        reviewFrequency: 'Semi-Annual',
        totalBankBalance: '5000',
        cpfOA: '10000',
        cpfSA: '20000',
        cpfMA: '30000',
      });
      await crm.submitClientForm();
      await expect(successToast(page, 'Client added')).toBeVisible({ timeout: 20_000 });
    });

    await test.step('list search finds the client → detail opens', async () => {
      clientId = await crm.openClientByName(clientName);
      await expect(page.getByTestId('clients-detail')).toContainText(clientName);
    });

    await test.step('Overview shows the financials; derived total = $5,000.00', async () => {
      const overview = page.getByTestId('clients-detail-overview');
      await expect(overview).toContainText('$60,000.00'); // annual income
      await expect(overview).toContainText('$10,000.00'); // CPF OA
      await expect(overview).toContainText('$20,000.00'); // CPF SA
      await expect(overview).toContainText('$30,000.00'); // CPF MA
      await expect(overview).toContainText('Aggressive');
      await expect(crm.overviewTotalBalance).toHaveText('$5,000.00');
      // Next review +30d → the header badge starts blue ("upcoming").
      await expect(crm.followUpBadge).toHaveAttribute('data-tone', 'info');
    });

    await test.step("Bank history shows the 'Initial client onboarding' seed row", async () => {
      await crm.switchTab('bank');
      await expect(crm.childRows('bank')).toHaveCount(1, { timeout: 30_000 });
      const seedRow = crm.childRows('bank').first();
      await expect(seedRow).toContainText('Initial client onboarding');
      await expect(seedRow).toContainText('$5,000.00');
      seedRowId = await crm.idFromRow(seedRow);
      await expect(crm.bankCurrentTotal).toContainText('$5,000.00');
    });

    await test.step('add bank record 7000 (later date) → derived total recomputes to $7,000.00', async () => {
      await crm.bankAddButton.click();
      await expect(crm.bankModal).toBeVisible();
      await crm.fillBankForm({
        date: sgDateInDays(1),
        balance: '7000',
        notes: 'E2E later-dated balance snapshot',
      });
      await crm.submitBankForm();
      await expect(successToast(page, 'Bank balance recorded')).toBeVisible({ timeout: 20_000 });
      await expect(crm.childRows('bank')).toHaveCount(2, { timeout: 30_000 });
      await expect(crm.bankCurrentTotal).toContainText('$7,000.00');
    });

    await test.step('edit the FIRST record to 9999 → derived total STAYS $7,000.00 (latest-by-date wins)', async () => {
      await crm.childEditButton('bank', seedRowId).click();
      await expect(crm.bankModal).toBeVisible();
      await crm.fillBankForm({ balance: '9999' }); // date stays on the earlier seed date
      await crm.submitBankForm();
      await expect(successToast(page, 'Bank record updated')).toBeVisible({ timeout: 20_000 });
      // The refetched row proves the recompute round-trip landed…
      await expect(page.getByTestId(`clients-bank-row-${seedRowId}`)).toContainText('$9,999.00');
      // …and the derived total still follows the LATEST-dated record, not the
      // edited one (the corrected legacy copy-the-touched-row drift bug).
      await expect(crm.bankCurrentTotal).toContainText('$7,000.00');
    });

    await test.step('add Life Insurance policy (200 Monthly, 500k death, TPD copy, cash value ×2 rows)', async () => {
      await crm.switchTab('policies');
      await crm.policiesAddButton.click();
      await expect(crm.policyModal).toBeVisible();
      await crm.fillPolicyForm({
        type: 'Life Insurance',
        provider: 'E2E Assurance',
        policyNumber: `E2E-POL-LIFE-${suffix}`,
        startDate: todayIso,
        premium: '200',
        frequency: 'Monthly',
        coverageAmount: '500000',
        tpdSameAsDeath: true,
        criticalIllnessCoverage: '100000',
        ciNotes: 'E2E CI rider',
        hasCashValue: true,
        currentCashValue: '12000',
        projections: [
          { age: '45', value: '20000' },
          { age: '55', value: '45000' },
        ],
      });
      // One-shot "same as death benefit" copy landed in the TPD input.
      await expect(page.getByTestId('crm-policy-tpd-input')).toHaveValue('500000');
      await crm.submitPolicyForm();
      await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });

      await expect(crm.childRows('policies')).toHaveCount(1, { timeout: 30_000 });
      const lifeRow = crm.childRows('policies').first();
      await expect(lifeRow).toContainText('Life Insurance');
      await expect(lifeRow).toContainText('Active');
      await expect(lifeRow).toContainText('$200.00 / Monthly');
      await expect(lifeRow).toContainText('Death $500K');
      await expect(lifeRow).toContainText('TPD $500K');
    });

    await test.step('add Hospitalization policy (premium/coverage forced 0; Integrated Shield fields)', async () => {
      await crm.policiesAddButton.click();
      await expect(crm.policyModal).toBeVisible();
      const hospitalPolicyNumber = `E2E-POL-HOSP-${suffix}`;
      await crm.fillPolicyForm({
        type: 'Hospitalization',
        provider: 'E2E Shield',
        policyNumber: hospitalPolicyNumber,
        startDate: todayIso,
        hospital: {
          hospitalType: 'Public - Class A',
          integratedShieldCPF: '300',
          integratedShieldCash: '150',
          riderCash: '50',
        },
      });
      // The type switch swapped premium/coverage out for the amber fieldset —
      // both are force-set to '0' and no longer rendered as inputs.
      await expect(page.getByTestId('crm-policy-hospital-section')).toBeVisible();
      await expect(page.getByTestId('crm-policy-premium-input')).toHaveCount(0);
      await expect(page.getByTestId('crm-policy-coverage-input')).toHaveCount(0);
      await crm.submitPolicyForm();
      await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });

      await expect(crm.childRows('policies')).toHaveCount(2, { timeout: 30_000 });
      const hospitalRow = crm.childRows('policies').filter({ hasText: hospitalPolicyNumber });
      await expect(hospitalRow).toContainText('Hospitalization');
      await expect(hospitalRow).toContainText('$0.00 / Annual'); // forced-zero premium
      await expect(hospitalRow).toContainText('Public - Class A');
    });

    await test.step('log interaction with follow-up in 3 days → header badge turns amber', async () => {
      await crm.switchTab('interactions');
      await crm.interactionsAddButton.click();
      await expect(crm.interactionModal).toBeVisible();
      await crm.fillInteractionForm({
        date: todayIso,
        type: 'Meeting',
        notes: `E2E meeting for ${clientName} — follow-up scheduled`,
        followUp: sgDateInDays(3),
      });
      await crm.submitInteractionForm();
      await expect(successToast(page, 'Interaction logged')).toBeVisible({ timeout: 20_000 });

      await expect(crm.childRows('interactions')).toHaveCount(1, { timeout: 30_000 });
      await expect(crm.childRows('interactions').first()).toContainText('Follow-up');
      // ≤7 days out → the urgent (amber) tone replaces the blue next-review badge.
      await expect(crm.followUpBadge).toHaveAttribute('data-tone', 'warning', { timeout: 15_000 });
      await expect(crm.followUpBadge).toHaveText(/\d+ days/);
    });

    await test.step('dashboard: +1 client, +2 active policies, +$2,400 annualised, +1 follow-up', async () => {
      await page.goto('/crm');
      await expectDashboardStats(page, {
        clients: baseline.clients + 1,
        policies: baseline.policies + 2,
        premium: baseline.premium + 2400, // 200 × 12 — annualised, not the raw sum
        followUps: baseline.followUps + 1,
      });
      // The annualised figure itself renders on the tile.
      await expect(page.getByTestId(KPI.premium)).toContainText(
        (baseline.premium + 2400).toLocaleString('en-SG'),
      );
    });

    await test.step('list search finds the client again → rename persists on the detail', async () => {
      await crm.gotoList();
      const reopenedId = await crm.openClientByName(clientName);
      expect(reopenedId).toBe(clientId);

      // Let the detail's trailing child queries settle before opening the edit
      // modal — a refetch landing mid-edit re-renders the page, and the form
      // must not be re-seeded under the typed rename (same trailing-query
      // settle as profiler account-settings; root cause also fixed via the
      // memoized model in ClientDetailPage).
      await page.waitForLoadState('networkidle');

      await crm.detailButton('clients-detail-edit-btn').click();
      await expect(crm.clientModal).toBeVisible();
      await crm.fillClientForm({ name: renamedClient });
      await crm.submitClientForm();
      await expect(successToast(page, 'Client updated')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('clients-detail')).toContainText(renamedClient);
    });

    await test.step('CLEANUP: soft-delete children, then the client; book returns to baseline', async () => {
      for (const kind of ['policies', 'interactions', 'bank'] as const) {
        await crm.deleteAllChildRows(kind);
      }
      // Zero bank rows → the recompute zeroes the derived total.
      await expect(crm.bankCurrentTotal).toContainText('$0.00');

      await crm.deleteClientFromDetail();
      await expect(successToast(page, 'Client deleted')).toBeVisible({ timeout: 20_000 });

      await crm.search(clientName);
      await expect.poll(() => crm.visibleRows().count(), { timeout: 30_000 }).toBe(0);
      await expect(page.getByTestId('clients-table')).toContainText(
        `No matches for "${clientName}"`,
      );

      await page.goto('/crm');
      await expectDashboardStats(page, baseline);
      cleanedUp = true;
    });
  });
});
