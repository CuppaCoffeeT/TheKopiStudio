/**
 * Reports access + axe a11y seatbelt @p0 @mobile — the two report surfaces
 * (per-client /clients/:id/report + book-wide /crm-reports) honour the role
 * matrix, and every report surface (plus the ConvertResultModal) passes an
 * axe-core WCAG 2.0 A/AA scan with ZERO critical/serious violations
 * (moderate/minor are reported by axe but don't gate; `includedImpacts`
 * filters the assertion). Mirrors tests/workflows/crm/load-a11y.spec.ts.
 *
 * Fixture (request-free path, clients-manager.spec precedent): a beforeAll
 * drives a SEPARATE browser context with the ADVISOR storageState
 * (tests/.auth/advisor.json, minted by tests/auth.setup.ts under
 * playwright.parallel.config.ts) and creates ONE RICH client
 * 'E2E-RptA11y-<project>-<ts>' through the real UI — DOB + income + CPF
 * balances + seed bank balance, a Whole Life policy (cash value ×2
 * projections + ILP fieldset) and a Hospitalization policy, plus one logged
 * interaction — so EVERY conditional report section renders (cash value /
 * hospitalization / ILP / CPF projection / retirement projection incl. the
 * bank-history table / interaction rows) and the big scan covers the fullest
 * report DOM. An afterAll deletes the children (policies / interactions /
 * bank rows) and soft-deletes the client through the UI as the advisor on
 * every exit path (pass, fail, or beforeAll crash — it falls back to a name
 * search when the id was never captured) and logs LOUDLY + rethrows when it
 * cannot finish, because that is real residue on the LIVE shared DB.
 *
 * Surfaces × roles (one test per surface so failures localize):
 *   ACCESS
 *   (a) manager   /clients/:id/report — the advisor-owned fixture renders
 *       read-all (view_all_clients RLS): canvas + foreign financial data
 *   (b) manager   /crm-reports        — portfolio report renders with the
 *       advisor-owned fixture in the all-book client details
 *   (c) anonymous /crm-reports + /clients/<any-uuid>/report → /login redirect;
 *       the report surfaces never render
 *   A11Y (axe wcag2a+wcag2aa, zero critical/serious)
 *   (d) advisor   /clients/:id/report — the big one: scanned only after ALL
 *       15 section testids are visible (never the loading skeleton)
 *   (e) advisor   /crm-reports        — with data (the seeded client's card)
 *   (f) advisor   ConvertResultModal OPEN — a real wizard run saves an
 *       advisor-owned result, the detail's Convert button opens the modal,
 *       the scan runs after its fade-in settles, then Cancel dismisses it
 *       (ZERO conversion — no client row is ever created by this test)
 *
 * DB residue (LIVE shared DB): the beforeAll fixture rows (1 client + 2
 * policies + 1 interaction + 1 seed bank row, all advisor-owned, removed in
 * afterAll) and test (f)'s single advisor-owned `results` row
 * ('E2E-RptConvA11y-…', UI-deleted in-test; an afterEach safety net re-deletes
 * by exact prospect_name under the advisor's OWN RLS — results-advisor.spec
 * precedent). All other tests are read-only. sky/Keane data is never touched.
 *
 * Serialisation: creating/deleting rows in the advisor's book mid-run breaks
 * clients-advisor.spec.ts's dashboard-KPI baseline+delta math, so both write
 * windows (beforeAll seed, afterAll cleanup) hold the cross-worker advisor-
 * book lock (tests/fixtures/advisorBookLock.ts — the lock path is the
 * contract). The wizard result in (f) writes `results`, not the CRM book —
 * no lock needed there. All reads are lock-free.
 *
 * All selectors are real data-testids read from:
 *   src/features/crm/pages/{ClientReportPage,PortfolioReportPage}.tsx
 *   src/features/crm/components/report/*.tsx
 *   src/features/profiler/pages/ResultDetailPage.tsx
 *   src/features/profiler/components/detail/{ResultDetailActions,ConvertResultModal}.tsx
 *   (+ the shared ClientsPage / WizardPage POMs)
 *
 * Run: npx playwright test tests/workflows/reports/access-a11y.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { resolve } from 'path';
import { test, expect, type Browser, type Locator, type Page, type TestInfo } from '@playwright/test';
import { acquireAdvisorBookLock, releaseAdvisorBookLock } from '../../fixtures/advisorBookLock';
import { authFileFor } from '../../fixtures/roleAuth';
import { ClientsPage } from '../../pom/ClientsPage';
import { WizardPage } from '../../pom/WizardPage';
import { expectWcag2aaClean, settleAnimations } from '../../runners/a11yChecks';
import { deleteOwnResultsByProspect } from '../../runners/resultsCleanup';

/** Syntactically valid UUID that matches no row — anonymous redirect probe. */
const ANY_UUID = '00000000-0000-4000-a000-000000000000';

/**
 * Every section testid of the seeded client's report — the fixture is built
 * so ALL of them render (conditional sections included): page composition in
 * ClientReportPage.tsx + the components' own self-guards (CPF balances > 0,
 * bank balance > 0, ≥1 cash-value/hospitalization/ILP policy, ≥1 interaction).
 */
const CLIENT_REPORT_SECTIONS = [
  'report-hero',
  'report-health-snapshot',
  'report-client-profile',
  'report-coverage-analysis',
  'report-cash-value',
  'report-hospitalization',
  'report-ilp-analysis',
  'report-cpf-projection',
  'report-cpf-ra-panel',
  'report-retirement-projection',
  'report-retirement-bank-history',
  'report-policy-portfolio',
  'report-coverage-gaps',
  'report-interaction-history',
  'report-disclaimer',
] as const;

// Both helpers lived here in full until 2026-08-13; they are now shared with
// crm/load-a11y and profiler/load-a11y. expectWcag2aaClean settles the page's
// animations itself — see the note in the runner for why every scan needs that.

function successToast(page: Page, text: string): Locator {
  return page.getByTestId('toast-success').filter({ hasText: text }).first();
}

/**
 * Detail actions render twice (DetailPageFrame hero + sticky mobile bar) with
 * `-mobile`-suffixed testids — target the visible one for this viewport.
 */
function visibleDetailButton(page: Page, base: string): Locator {
  return page.locator(`[data-testid="${base}"]:visible, [data-testid="${base}-mobile"]:visible`);
}

/**
 * The results list mounts BOTH the desktop table and the mobile card list
 * (hidden via CSS at the other breakpoint) — match whichever is visible.
 */
function visibleResultRows(page: Page): Locator {
  return page.locator(
    '[data-testid^="results-row-"]:visible, [data-testid^="results-mobile-card-"]:visible',
  );
}

/**
 * Drive the results list's server-side search and wait until the debounced
 * (350ms) term lands in the URL (`?search=`) — polling row counts before that
 * point would race the debounce and read the UNFILTERED list.
 */
async function searchResults(page: Page, term: string): Promise<void> {
  await page.getByTestId('results-search').fill(term);
  await page.waitForURL((url) => url.searchParams.get('search') === term);
}

/**
 * Run `fn` on a page authed as the ADVISOR in an isolated context — the
 * request-free setup path: the storageState file already holds a live session,
 * so no UI sign-in (and no Supabase auth round-trip) happens here.
 */
async function withAdvisorPage(
  browser: Browser,
  testInfo: TestInfo,
  fn: (page: Page) => Promise<void>,
): Promise<void> {
  const baseURL = testInfo.project.use.baseURL;
  if (!baseURL) {
    throw new Error('[reports access-a11y] no baseURL on the project — run via a repo config');
  }
  const context = await browser.newContext({
    baseURL,
    storageState: resolve(process.cwd(), authFileFor('advisor')),
  });
  const page = await context.newPage();
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

// ── Fixture lifecycle (rich advisor-owned client, UI-created + UI-deleted) ───

/**
 * Per-worker fixture identity (fullyParallel: false → the whole file runs in
 * ONE worker per project; a retry's fresh worker re-runs beforeAll with a new
 * suffix and cleans up its own client in its own afterAll).
 */
let clientName = '';
let clientId = '';

test.beforeAll(async ({ browser }, testInfo) => {
  // clients-advisor may hold the book lock for its full journey (≤300s per
  // project instance) — widen the hook budget well past the lock wait.
  testInfo.setTimeout(testInfo.timeout + 720_000);

  // Per-run unique, retry-safe, parallel-project-safe — and free of every
  // character the list's sanitizeSearchTerm strips, so search matches verbatim.
  const suffix = `${testInfo.project.name}-${Date.now()}`;
  clientName = `E2E-RptA11y-${suffix}`;
  clientId = '';

  await acquireAdvisorBookLock(660_000, 'reports access-a11y beforeAll');
  try {
    await withAdvisorPage(browser, testInfo, async (page) => {
      const crm = new ClientsPage(page);

      // Client: DOB (age math), income, CPF balances (CPF projection guard)
      // and a seed bank balance (retirement-projection guard + the
      // 'Initial client onboarding' row for the bank-history table).
      await crm.gotoList();
      await crm.openAddClientForm();
      await expect(crm.clientModal).toBeVisible();
      await crm.fillClientForm({
        name: clientName,
        email: `e2e-rpt-a11y-${Date.now()}@example.com`,
        phone: '9123 0002',
        dateOfBirth: '1990-03-15',
        occupation: 'Engineer',
        annualIncome: '85000',
        riskProfile: 'Moderate',
        notes: 'E2E report-a11y fixture — safe to soft-delete.',
        totalBankBalance: '25000',
        cpfOA: '40000',
        cpfSA: '30000',
        cpfMA: '20000',
      });
      await crm.submitClientForm();
      await expect(successToast(page, 'Client added')).toBeVisible({ timeout: 20_000 });
      // Round-trip through the list proves the row landed and captures its id.
      clientId = await crm.openClientByName(clientName);

      // Policy 1 — Whole Life with cash value (×2 projection rows) AND the
      // ILP fieldset → renders report-cash-value + report-ilp-analysis (and
      // the ILP keeps the retirement projection meaningful).
      await crm.switchTab('policies');
      await crm.policiesAddButton.click();
      await expect(crm.policyModal).toBeVisible();
      await crm.fillPolicyForm({
        type: 'Whole Life',
        provider: 'E2E Assurance',
        policyNumber: `E2E-POL-WL-${suffix}`,
        startDate: '2024-01-15',
        premium: '250',
        frequency: 'Monthly',
        coverageAmount: '400000',
        tpdSameAsDeath: true,
        criticalIllnessCoverage: '150000',
        earlyCriticalIllnessCoverage: '50000',
        hasCashValue: true,
        currentCashValue: '18000',
        projections: [
          { age: '45', value: '30000' },
          { age: '55', value: '60000' },
        ],
        investmentLinked: {
          currentAccountValue: '22000',
          investmentAllocation: 'Global equities 70/30',
          illustratedValueAge55: '80000',
          illustratedValueAge65: '140000',
          ilpPremiumInclusionPercent: '50',
        },
      });
      await crm.submitPolicyForm();
      await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });

      // Policy 2 — Hospitalization (premium/coverage forced '0'; amber
      // Integrated Shield fieldset) → renders report-hospitalization.
      await crm.policiesAddButton.click();
      await expect(crm.policyModal).toBeVisible();
      await crm.fillPolicyForm({
        type: 'Hospitalization',
        provider: 'E2E Shield',
        policyNumber: `E2E-POL-HOSP-${suffix}`,
        startDate: '2024-01-15',
        hospital: {
          hospitalType: 'Private',
          integratedShieldCPF: '300',
          integratedShieldCash: '150',
          riderCash: '50',
        },
      });
      await crm.submitPolicyForm();
      await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });

      // Interaction → the interaction-history table renders a real row.
      await crm.switchTab('interactions');
      await crm.interactionsAddButton.click();
      await expect(crm.interactionModal).toBeVisible();
      await crm.fillInteractionForm({
        date: '2026-01-10',
        type: 'Meeting',
        notes: `E2E report fixture meeting for ${clientName}`,
      });
      await crm.submitInteractionForm();
      await expect(successToast(page, 'Interaction logged')).toBeVisible({ timeout: 20_000 });
    });
  } finally {
    releaseAdvisorBookLock();
  }
});

test.afterAll(async ({ browser }, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 720_000);
  await acquireAdvisorBookLock(660_000, 'reports access-a11y afterAll');
  try {
    await withAdvisorPage(browser, testInfo, async (page) => {
      const crm = new ClientsPage(page);
      if (!clientId) {
        // beforeAll died before capturing the id — fall back to a name search.
        await crm.gotoList();
        await crm.search(clientName);
        try {
          await crm.visibleRows().first().waitFor({ state: 'visible', timeout: 10_000 });
        } catch {
          return; // nothing was created — zero residue
        }
        clientId = await crm.idFromRow(crm.visibleRows().first());
      }
      await page.goto(`/clients/${clientId}`);
      const overview = page.getByTestId('clients-detail-overview');
      const notFound = page.getByTestId('clients-detail-not-found');
      await overview.or(notFound).first().waitFor({ state: 'visible', timeout: 30_000 });
      if (await notFound.count()) return; // already soft-deleted
      // Children first (policies / interactions / seeded bank row), then the
      // client — zero residue. Each helper is idempotent on an empty tab.
      await crm.deleteAllChildRows('policies');
      await crm.deleteAllChildRows('interactions');
      await crm.deleteAllChildRows('bank');
      await crm.deleteClientFromDetail();
    });
  } catch (error) {
    console.error(
      `[reports access-a11y] CLEANUP FAILED — possible residue client "${clientName}" ` +
        `(id: ${clientId || 'unknown'}) on the LIVE shared DB. Soft-delete it (and its ` +
        'policies/interactions/bank rows) via the UI as the e2e advisor.',
      error,
    );
    throw error;
  } finally {
    releaseAdvisorBookLock();
  }
});

// ── (a)+(b) Manager access — read-all on report surfaces ─────────────────────

test.describe('reports — manager access', () => {
  test.use({ storageState: authFileFor('manager') });

  test('manager opens the advisor-owned client report — full read-all render @p0 @mobile', async ({
    page,
  }) => {
    await page.goto(`/clients/${clientId}/report`);
    const canvas = page.getByTestId('report-canvas');
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('report-loading')).toHaveCount(0);

    // Foreign-book data is fully readable (view_all_clients RLS): the hero
    // carries the fixture's name, and the conditional sections render from
    // the advisor-created policies/CPF balances.
    await expect(page.getByTestId('report-hero')).toContainText(clientName);
    await expect(page.getByTestId('report-policy-portfolio')).toContainText('E2E Assurance');
    await expect(page.getByTestId('report-cpf-projection')).toBeVisible();
    await expect(page.getByTestId('report-hospitalization')).toBeVisible();
    // Never the error or not-found branch.
    await expect(page.getByTestId('report-not-found')).toHaveCount(0);
  });

  test('manager /crm-reports renders the all-book portfolio report @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/crm-reports');
    await expect(page.getByTestId('crm-portfolio-report')).toBeVisible({ timeout: 30_000 });
    // Never assert on the skeleton — wait for the real canvas.
    await expect(page.getByTestId('portfolio-report-loading')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByTestId('report-portfolio')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('report-portfolio-hero')).toBeVisible();
    // Manager RLS reads EVERY advisor's book — the advisor-owned fixture's
    // per-client card is in the client details section.
    await expect(page.getByTestId(`report-portfolio-client-${clientId}`)).toBeVisible({
      timeout: 30_000,
    });
  });
});

// ── (c) Anonymous — both report routes bounce to /login ─────────────────────

test.describe('reports — anonymous', () => {
  // Genuinely logged out in EVERY project — overrides the parallel config's
  // super_admin storageState (and is a no-op under the serial config).
  test.use({ storageState: { cookies: [], origins: [] } });

  test('anonymous /crm-reports redirects to /login; the report never renders @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/crm-reports');
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('crm-portfolio-report')).toHaveCount(0);
    await expect(page.getByTestId('report-portfolio')).toHaveCount(0);
  });

  test('anonymous /clients/<uuid>/report redirects to /login; the report never renders @p0 @mobile', async ({
    page,
  }) => {
    await page.goto(`/clients/${ANY_UUID}/report`);
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('report-canvas')).toHaveCount(0);
    await expect(page.getByTestId('report-loading')).toHaveCount(0);
  });
});

// ── (d)+(e)+(f) Advisor a11y scans ───────────────────────────────────────────

test.describe('reports — advisor a11y', () => {
  test.use({ storageState: authFileFor('advisor') });

  /**
   * Test (f)'s wizard-saved result — read by the afterEach safety net. Only
   * that test assigns it; the net no-ops for (d)/(e). Within-file serial
   * (fullyParallel: false), never shared across workers.
   */
  let prospectName = '';

  test.afterEach(async ({ request }) => {
    if (!prospectName) return;
    // Safety net only — the happy path already deleted the row through the
    // UI, so this matches 0 rows. Scoped to the EXACT per-run name and the
    // advisor's OWN RLS (legacy rows / other accounts are untouchable).
    const removed = await deleteOwnResultsByProspect(request, 'advisor', prospectName);
    if (removed > 0) {
      console.warn(
        `[reports access-a11y] afterEach removed ${removed} residue result(s) for "${prospectName}" — ` +
          'the test failed before its UI delete step.',
      );
    }
  });

  test('client report — ALL sections render + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    // 15 sections from 4 queries on a cold dev server — give axe headroom too.
    test.slow();

    await page.goto(`/clients/${clientId}/report`);
    await expect(page.getByTestId('report-canvas')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('report-loading')).toHaveCount(0);
    await expect(page.getByTestId('report-hero')).toContainText(clientName);

    // THE BIG ONE — scan only after every section (conditional ones included)
    // has rendered, so the scan covers the fullest report DOM.
    for (const section of CLIENT_REPORT_SECTIONS) {
      await expect(page.getByTestId(section)).toBeVisible({ timeout: 30_000 });
    }
    // Real child content, not just section shells: a cash-value projection
    // table row, the seeded bank-history row and the logged interaction.
    await expect(
      page.locator('[data-testid^="report-portfolio-group-"]').first(),
    ).toBeVisible();
    await expect(page.locator('[data-testid^="report-interaction-row-"]')).toHaveCount(1);

    await expectWcag2aaClean(page);
  });

  test('/crm-reports portfolio report (with data) + axe wcag2aa clean @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/crm-reports');
    await expect(page.getByTestId('crm-portfolio-report')).toBeVisible({ timeout: 30_000 });
    // Never scan the skeleton — the advisor's own book holds the fixture, so
    // the data canvas (hero + financial summary + client cards) is guaranteed.
    await expect(page.getByTestId('portfolio-report-loading')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByTestId('report-portfolio')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('report-portfolio-hero')).toBeVisible();
    await expect(page.getByTestId('report-portfolio-financial-summary')).toBeVisible();
    await expect(page.getByTestId(`report-portfolio-client-${clientId}`)).toBeVisible({
      timeout: 30_000,
    });
    await expectWcag2aaClean(page);
  });

  test('ConvertResultModal open + axe wcag2aa clean (cancelled — zero conversion) @p0 @mobile', async ({
    page,
  }, testInfo) => {
    // Full wizard drive + list round-trip + scan + UI delete needs headroom.
    test.slow();

    // Per-run unique, retry-safe, parallel-project-safe — and free of every
    // character sanitizeSearchTerm strips, so the list search matches verbatim.
    prospectName = `E2E-RptConvA11y-${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;

    // REAL advisor-owned save into `results` (results-advisor precedent) —
    // the Convert button only renders on own, unconverted rows.
    const wizard = new WizardPage(page);
    await wizard.goto();
    await wizard.fillIntake({
      advisor: 'E2E Advisor',
      prospect: prospectName,
      age: '31-35',
      meeting: '2',
      occupation: 'Engineer',
    });
    await wizard.start();
    await wizard.answerAllQuestions(0);
    await wizard.tickObservations();
    await wizard.advanceThroughObservations();
    await wizard.generate();
    await expect(successToast(page, 'Profile saved to your results')).toBeVisible({
      timeout: 15_000,
    });

    // Locate the saved row via the list (also yields its id for the detail).
    await page.goto('/profiler-results');
    await searchResults(page, prospectName);
    await expect.poll(() => visibleResultRows(page).count(), { timeout: 30_000 }).toBe(1);
    const rowTestId = await visibleResultRows(page).first().getAttribute('data-testid');
    const resultId = rowTestId?.replace(/^results-(?:row|mobile-card)-/, '') ?? '';
    expect(resultId).not.toBe('');

    await visibleResultRows(page).first().click();
    await page.waitForURL(`**/profiler-results/${resultId}`);
    await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });

    try {
      // Open the convert modal — own + unconverted row, so the button exists.
      await visibleDetailButton(page, 'result-detail-convert-btn').click();
      const modal = page.getByTestId('result-detail-convert-modal');
      await expect(modal).toBeVisible();
      await expect(page.getByTestId('result-detail-convert-confirm-btn')).toBeVisible();
      await expect(page.getByTestId('result-detail-convert-cancel-btn')).toBeVisible();
      // Let any lingering save toast unmount (sonner's <li role="status">
      // inside its <ol> trips axe's `list` rule — third-party structure) and
      // never scan mid fade-in/zoom-in — axe reads alpha-blended colors.
      await page.getByTestId('toast-success').waitFor({ state: 'detached', timeout: 15_000 });
      await settleAnimations(modal);
      await expectWcag2aaClean(page);

      // Cancel — ZERO conversion: the modal closes, the row stays unconverted
      // (Convert still offered, no View-client swap) and no client row exists.
      await page.getByTestId('result-detail-convert-cancel-btn').click();
      await expect(modal).toBeHidden();
      await expect(visibleDetailButton(page, 'result-detail-convert-btn')).toBeVisible();
      await expect(page.locator('[data-testid^="result-detail-view-client-btn"]')).toHaveCount(0);
    } finally {
      // Delete the wizard-saved result through the UI even when a scan failed
      // (results-advisor delete step). A thrown cleanup error here would MASK
      // the test's own failure — log loudly and let the afterEach safety net
      // re-delete by exact prospect_name with a fresh budget instead.
      try {
        await page.goto(`/profiler-results/${resultId}`);
        await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
        await visibleDetailButton(page, 'result-detail-delete-btn').click();
        await expect(page.getByTestId('result-detail-delete-dialog')).toBeVisible();
        await page.getByTestId('result-detail-delete-dialog-confirm-btn').click();
        await expect(successToast(page, 'Result deleted')).toBeVisible({ timeout: 15_000 });
        await page.waitForURL(/\/profiler-results(\?.*)?$/);
      } catch (error) {
        console.warn(
          `[reports access-a11y] in-test finally could not delete result "${prospectName}" — ` +
            'deferring to the afterEach safety net.',
          error,
        );
      }
    }
  });
});
