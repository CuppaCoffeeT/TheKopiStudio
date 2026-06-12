/**
 * Reports module seatbelt @p0 @mobile — two advisor journeys (REPORTS_LINK_PRD
 * P3 + P4) with REAL writes into the e2e advisor's live book, exercised
 * end-to-end through the UI and fully cleaned up through the UI at the end.
 *
 * Runs as the e2e ADVISOR via the saved storageState (tests/.auth/advisor.json,
 * written by tests/auth.setup.ts under playwright.parallel.config.ts).
 *
 * (1) PORTFOLIO REPORT (/crm-reports): baseline read of the report (empty
 *     notice or current totals) → seed ONE client 'E2E-Pf-<suffix>' + ONE
 *     Life Insurance policy ($100 Monthly, $50k coverage) via the ClientsPage
 *     POM → /crm-reports renders the hero stat cards (+1 client/policy/active,
 *     +$50k coverage) and the financial summary shows the ANNUALISED premium
 *     total (+$1,200 = 100×12 — on a clean book the cell reads exactly
 *     "$1,200") with the "(annualised)" footnote visible → the per-client
 *     table includes the seeded client + its "$100/Monthly" policy row → axe
 *     wcag2aa scan of the populated report → window.print is stubbed and the
 *     Print button must call it exactly once → the /crm dashboard quick-action
 *     card navigates to /crm-reports → CLEANUP: soft-delete the policy + the
 *     client via the UI; the report drops back to its baseline.
 *
 * (2) CONVERT ROUND-TRIP (profiler result → CRM client): run the public
 *     wizard via the WizardPage POM with a REAL authed save (prospect
 *     'E2E-Cvt-<suffix>', occupation 'Engineer'), capturing the generated
 *     DISC/MBTI letters from the hero → open the saved result's detail from
 *     /profiler-results → 'Convert to client' is visible (own row) → confirm
 *     the ConvertResultModal → lands on /clients/<id> → Overview shows the
 *     Communication style card with the DISC letters + the 'View full
 *     playbook' link back to the result, and the Notes fact carries the full
 *     provenance block (result id prefix · age range · DISC · MBTI) → back on
 *     the result detail the convert button is replaced by 'View client'
 *     (which navigates) → CLEANUP: soft-delete the client via the UI, delete
 *     the result via the UI; both searches come back empty.
 *
 * Data safety (LIVE shared DB): every row is created by this spec under the
 * e2e advisor's own account with an 'E2E-' + per-run unique name and removed
 * through the UI as the final step. afterEach safety nets re-run the UI
 * client cleanup (and an RLS-scoped PostgREST delete for the result via
 * tests/runners/resultsCleanup.ts) when a test failed mid-flow — hook-based
 * rather than a `finally` inside the test body so they still run with a LIVE
 * page after a test timeout (clients-advisor / results-advisor pattern). RLS
 * confines every write to the advisor's own book; sky/Keane data is
 * untouchable by design.
 *
 * Serialisation: both journeys WRITE into the advisor's book and journey (1)
 * reads BOOK-WIDE report totals, so each describe holds the shared
 * cross-worker advisor-book mkdir lock (tests/fixtures/advisorBookLock.ts —
 * the same tmpdir path clients-advisor / clients-manager / crm dashboard
 * hold) for its whole run; the chromium-desktop and mobile-safari projects
 * never interleave writes.
 *
 * All selectors are real data-testids read from:
 *   src/features/crm/pages/{PortfolioReportPage,CrmDashboardPage}.tsx
 *   src/features/crm/components/report/{PortfolioSummary,PortfolioClientDetails}.tsx
 *   src/features/crm/components/detail/OverviewTab.tsx (comm-style card)
 *   src/features/profiler/components/detail/{ResultDetailActions,ConvertResultModal}.tsx
 *   src/features/profiler/pages/{ResultsListPage,ResultDetailPage}.tsx
 *   plus the shared ClientsPage + WizardPage POMs (tests/pom/*).
 *
 * Run: npx playwright test tests/workflows/reports/portfolio-convert.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { checkA11y, injectAxe } from 'axe-playwright';
import { acquireAdvisorBookLock, releaseAdvisorBookLock } from '../../fixtures/advisorBookLock';
import { authFileFor } from '../../fixtures/roleAuth';
import { ClientsPage } from '../../pom/ClientsPage';
import { WizardPage } from '../../pom/WizardPage';
import { deleteOwnResultsByProspect } from '../../runners/resultsCleanup';

// ── Shared spec utilities ────────────────────────────────────────────────────

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
 * First numeric token of an element's text as a number — the stat tiles /
 * money cells render "$1,200"-style values whose label carries no digits.
 */
function numberFromText(text: string): number {
  const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

/** Display twin of PortfolioSummary's `money()` wrapper (en-US grouping). */
function money(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * Inject axe and assert ZERO critical/serious violations against the WCAG 2.0
 * A+AA rule set — same gate as the crm/profiler load-a11y specs.
 */
async function expectWcag2aaClean(page: Page): Promise<void> {
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    includedImpacts: ['critical', 'serious'],
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
  });
}

/**
 * The results list mounts BOTH the desktop table and the mobile card list
 * (hidden via CSS at the other breakpoint) — match the visible rendering.
 */
function visibleResultRows(page: Page): Locator {
  return page.locator(
    '[data-testid^="results-row-"]:visible, [data-testid^="results-mobile-card-"]:visible',
  );
}

/**
 * Result-detail actions render twice (DetailPageFrame hero + sticky mobile
 * bar) with `-mobile`-suffixed testids — target the visible one.
 */
function visibleDetailButton(page: Page, base: string): Locator {
  return page.locator(`[data-testid="${base}"]:visible, [data-testid="${base}-mobile"]:visible`);
}

/**
 * Drive the results list's server-side search and wait until the debounced
 * (350ms) term lands in the URL — counting rows earlier reads the UNFILTERED
 * list (results-advisor precedent).
 */
async function searchResults(page: Page, term: string): Promise<void> {
  await page.getByTestId('results-search').fill(term);
  await page.waitForURL((url) => url.searchParams.get('search') === term);
}

/**
 * Best-effort UI cleanup for a mid-flow failure: find the client (by id, else
 * by name search — zero matches means it was never created), soft-delete all
 * child rows, then the client. Shared by both describes' afterEach safety
 * nets (clients-advisor emergencyCleanup pattern). Mutates `residue.id` when
 * it had to resolve the id by name so the caller can log it.
 */
async function removeResidueClient(page: Page, residue: { name: string; id: string }): Promise<void> {
  const crm = new ClientsPage(page);
  if (!residue.id) {
    await crm.gotoList();
    await crm.search(residue.name);
    try {
      await crm.visibleRows().first().waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return; // nothing was created — zero residue
    }
    residue.id = await crm.idFromRow(crm.visibleRows().first());
  }
  await page.goto(`/clients/${residue.id}`);
  const overview = page.getByTestId('clients-detail-overview');
  const notFound = page.getByTestId('clients-detail-not-found');
  await overview.or(notFound).first().waitFor({ state: 'visible', timeout: 30_000 });
  if (await notFound.count()) return; // already soft-deleted
  for (const kind of ['policies', 'interactions', 'bank'] as const) {
    await crm.deleteAllChildRows(kind);
  }
  await crm.deleteClientFromDetail();
}

// ═════════════════════════════════════════════════════════════════════════════
// (1) PORTFOLIO — /crm-reports renders the seeded book, annualised
// ═════════════════════════════════════════════════════════════════════════════

/** Book-wide report figures, parsed off /crm-reports (all 0 on the empty notice). */
interface PortfolioBaseline {
  clients: number;
  policies: number;
  active: number;
  coverage: number;
  premium: number;
}

const PF_STATS = {
  clients: 'report-portfolio-stat-clients',
  policies: 'report-portfolio-stat-policies',
  active: 'report-portfolio-stat-active',
  coverage: 'report-portfolio-stat-coverage',
} as const;

/**
 * Open /crm-reports and wait for it to settle into real content: the empty-
 * book notice OR the populated report canvas (never the loading skeleton).
 * Returns the parsed figures — zeros for the empty notice.
 */
async function readPortfolioReport(page: Page): Promise<PortfolioBaseline> {
  await page.goto('/crm-reports');
  await page.getByTestId('crm-portfolio-report').waitFor({ state: 'visible', timeout: 30_000 });
  const empty = page.getByTestId('report-portfolio-empty');
  const report = page.getByTestId('report-portfolio');
  await empty.or(report).first().waitFor({ state: 'visible', timeout: 30_000 });
  if (await empty.count()) {
    return { clients: 0, policies: 0, active: 0, coverage: 0, premium: 0 };
  }
  return {
    clients: numberFromText(await page.getByTestId(PF_STATS.clients).innerText()),
    policies: numberFromText(await page.getByTestId(PF_STATS.policies).innerText()),
    active: numberFromText(await page.getByTestId(PF_STATS.active).innerText()),
    coverage: numberFromText(await page.getByTestId(PF_STATS.coverage).innerText()),
    premium: numberFromText(await page.getByTestId('report-portfolio-total-premium').innerText()),
  };
}

/**
 * Cleanup state for the portfolio journey. Within-file serial
 * (fullyParallel: false), never shared across workers.
 */
const pfResidue = { name: '', id: '' };
let pfCleanedUp = true;

test.describe('portfolio report — advisor seeded book (/crm-reports)', () => {
  test.use({ storageState: authFileFor('advisor') });

  // Hold the advisor-book lock for the whole describe: the report totals read
  // the WHOLE advisor book, and the seed/cleanup writes would break the other
  // CRM specs' baseline+delta math if interleaved.
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // A peer project may hold the lock for its full journey (≤300s) — widen
    // this hook's budget well beyond the per-test timeout.
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireAdvisorBookLock(660_000, 'portfolio-convert.spec portfolio beforeAll');
  });
  test.afterAll(() => {
    releaseAdvisorBookLock();
  });

  // Safety net: re-runs the UI cleanup when the test failed (or timed out)
  // before its final cleanup step. No-op on the happy path.
  test.afterEach(async ({ page }, testInfo) => {
    if (pfCleanedUp) return;
    testInfo.setTimeout(testInfo.timeout + 180_000);
    try {
      await removeResidueClient(page, pfResidue);
      pfCleanedUp = true;
      console.warn(
        `[portfolio-convert] afterEach safety net removed residue client "${pfResidue.name}" — ` +
          'the portfolio test failed before its UI cleanup step.',
      );
    } catch (error) {
      console.error(
        `[portfolio-convert] EMERGENCY CLEANUP FAILED — possible residue client "${pfResidue.name}" ` +
          `(id: ${pfResidue.id || 'unknown'}) on the LIVE shared DB. Soft-delete it via the UI as the e2e advisor.`,
        error,
      );
    }
  });

  test('stat cards + annualised financial summary + per-client table + print stub + dashboard quick-action @p0 @mobile', async ({
    page,
  }, testInfo) => {
    // Seed (client + policy modals), three report visits and full UI cleanup.
    test.setTimeout(300_000);

    // Per-run unique, retry-safe, parallel-project-safe — and free of every
    // character the list's sanitizeSearchTerm strips, so search matches verbatim.
    const suffix = `${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;
    pfResidue.name = `E2E-Pf-${suffix}`;
    pfResidue.id = '';
    pfCleanedUp = false;

    const crm = new ClientsPage(page);
    let baseline: PortfolioBaseline = { clients: 0, policies: 0, active: 0, coverage: 0, premium: 0 };

    await test.step('baseline /crm-reports read (empty notice or current totals)', async () => {
      baseline = await readPortfolioReport(page);
    });

    await test.step("seed client 'E2E-Pf-…' + $100 Monthly Life Insurance policy via the POM", async () => {
      await crm.gotoList();
      await crm.addClientButton.click();
      await expect(crm.clientModal).toBeVisible();
      // No seed balance → createClient writes NO bank-history side-row, so the
      // cleanup below is exactly one policy + one client.
      await crm.fillClientForm({
        name: pfResidue.name,
        email: `e2e-pf-${Date.now()}@example.com`,
        phone: '9123 0002',
        occupation: 'E2E Reporter',
        annualIncome: '60000',
        riskProfile: 'Moderate',
        notes: 'E2E portfolio-report fixture — safe to soft-delete.',
      });
      await crm.submitClientForm();
      await expect(successToast(page, 'Client added')).toBeVisible({ timeout: 20_000 });
      pfResidue.id = await crm.openClientByName(pfResidue.name);

      await crm.switchTab('policies');
      await crm.policiesAddButton.click();
      await expect(crm.policyModal).toBeVisible();
      await crm.fillPolicyForm({
        type: 'Life Insurance',
        provider: 'E2E Assurance',
        policyNumber: `E2E-POL-PF-${suffix}`,
        startDate: sgDateInDays(0),
        premium: '100',
        frequency: 'Monthly',
        coverageAmount: '50000',
      });
      await crm.submitPolicyForm();
      await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });
      await expect(crm.childRows('policies')).toHaveCount(1, { timeout: 30_000 });
    });

    await test.step('/crm-reports: stat cards render the seeded book (+1/+1/+1/+$50k)', async () => {
      const after = await readPortfolioReport(page);
      expect(after.clients).toBe(baseline.clients + 1);
      expect(after.policies).toBe(baseline.policies + 1);
      expect(after.active).toBe(baseline.active + 1);
      expect(after.coverage).toBe(baseline.coverage + 50_000);
      // The hero strip itself is on screen (not just parsed).
      await expect(page.getByTestId('report-portfolio-hero')).toBeVisible();
      await expect(page.getByTestId('report-portfolio-generated')).toContainText('Generated:');
    });

    await test.step('financial summary: ANNUALISED premium total (100×12 → 1,200) + footnote', async () => {
      // On the contract-clean book (baseline 0) this asserts the cell reads
      // exactly "$1,200" — the annualised figure, NOT the legacy raw $100 sum.
      await expect(page.getByTestId('report-portfolio-total-premium')).toHaveText(
        money(baseline.premium + 1_200),
      );
      const note = page.getByTestId('report-portfolio-annualised-note');
      await expect(note).toBeVisible();
      await expect(note).toContainText('(annualised)');
      // The premium row labels itself as annualised too.
      await expect(page.getByTestId('report-portfolio-financial-summary')).toContainText(
        'Total annual premium revenue (annualised)',
      );
    });

    await test.step('per-client table includes the seeded client + its $100/Monthly policy', async () => {
      const block = page.getByTestId(`report-portfolio-client-${pfResidue.id}`);
      await expect(block).toBeVisible();
      await expect(block).toContainText(pfResidue.name);
      await expect(block).toContainText('E2E Reporter'); // occupation fact
      const policyTable = page.getByTestId(`report-portfolio-policies-${pfResidue.id}`);
      await expect(policyTable).toContainText('Life Insurance');
      await expect(policyTable).toContainText('E2E Assurance');
      // Legacy parity: the per-client row shows the RAW per-frequency pair.
      await expect(policyTable).toContainText('$100/Monthly');
      await expect(policyTable).toContainText('$50,000');
      await expect(policyTable).toContainText('Active');
    });

    await test.step('axe wcag2aa scan of the populated report', async () => {
      // Let the seed toasts dismiss first — a visible sonner toast trips axe's
      // `list` rule (third-party structure, not this surface).
      await page
        .getByTestId('toast-success')
        .waitFor({ state: 'detached', timeout: 15_000 })
        .catch(() => undefined);
      await expectWcag2aaClean(page);
    });

    await test.step('Print / Save as PDF calls window.print exactly once (stubbed)', async () => {
      await page.evaluate(() => {
        const w = window as Window & { __e2ePrintCalls?: number };
        w.__e2ePrintCalls = 0;
        w.print = () => {
          w.__e2ePrintCalls = (w.__e2ePrintCalls ?? 0) + 1;
        };
      });
      const printBtn = page.getByTestId('portfolio-report-print-btn');
      await expect(printBtn).toBeEnabled();
      await printBtn.click();
      await expect
        .poll(
          () =>
            page.evaluate(() => (window as Window & { __e2ePrintCalls?: number }).__e2ePrintCalls ?? 0),
          { timeout: 10_000 },
        )
        .toBe(1);
    });

    await test.step('/crm dashboard quick-action card navigates to /crm-reports', async () => {
      await page.goto('/crm');
      await page.getByTestId('crm-dashboard').waitFor({ state: 'visible', timeout: 30_000 });
      const card = page.getByTestId('crm-quick-link-portfolio-report');
      await expect(card).toBeVisible({ timeout: 30_000 });
      await expect(card).toContainText('Generate portfolio report');
      await card.click();
      await page.waitForURL('**/crm-reports', { timeout: 30_000 });
      await expect(page.getByTestId('crm-portfolio-report')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId(`report-portfolio-client-${pfResidue.id}`)).toBeVisible({
        timeout: 30_000,
      });
    });

    await test.step('CLEANUP: soft-delete the policy + client; report returns to baseline', async () => {
      await page.goto(`/clients/${pfResidue.id}`);
      await crm.waitForDetail();
      await crm.deleteAllChildRows('policies');
      await crm.deleteClientFromDetail();
      await expect(successToast(page, 'Client deleted')).toBeVisible({ timeout: 20_000 });

      await crm.search(pfResidue.name);
      await expect.poll(() => crm.visibleRows().count(), { timeout: 30_000 }).toBe(0);
      await expect(page.getByTestId('clients-table')).toContainText(
        `No matches for "${pfResidue.name}"`,
      );

      const restored = await readPortfolioReport(page);
      expect(restored).toEqual(baseline);
      pfCleanedUp = true;
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (2) CONVERT ROUND-TRIP — profiler result → CRM client and back
// ═════════════════════════════════════════════════════════════════════════════

const CONVERT_INTAKE = {
  advisor: 'E2E Advisor',
  age: '31-35',
  meeting: '2',
  occupation: 'Engineer',
} as const;

/**
 * Cleanup state for the convert journey. The client (named after the
 * prospect) and the saved result are tracked separately — each has its own
 * safety net. Within-file serial, never shared across workers.
 */
const cvtResidue = { name: '', id: '' }; // the converted CLIENT
let cvtProspectName = ''; // exact `results.prospect_name` for the RLS-scoped delete
let cvtClientCleanedUp = true;
let cvtResultCleanedUp = true;

test.describe('convert round-trip — advisor result → client → view client', () => {
  test.use({ storageState: authFileFor('advisor') });

  // The convert INSERTs a client into the advisor's book — hold the shared
  // book lock so the other CRM specs' book-wide reads never interleave.
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireAdvisorBookLock(660_000, 'portfolio-convert.spec convert beforeAll');
  });
  test.afterAll(() => {
    releaseAdvisorBookLock();
  });

  // Safety nets: UI soft-delete for a residue client, RLS-scoped PostgREST
  // delete for a residue result (idempotent — 0 rows on the happy path).
  test.afterEach(async ({ page, request }, testInfo) => {
    if (!cvtClientCleanedUp) {
      testInfo.setTimeout(testInfo.timeout + 180_000);
      try {
        await removeResidueClient(page, cvtResidue);
        cvtClientCleanedUp = true;
        console.warn(
          `[portfolio-convert] afterEach safety net removed residue client "${cvtResidue.name}" — ` +
            'the convert test failed before its UI cleanup step.',
        );
      } catch (error) {
        console.error(
          `[portfolio-convert] EMERGENCY CLEANUP FAILED — possible residue client "${cvtResidue.name}" ` +
            `(id: ${cvtResidue.id || 'unknown'}) on the LIVE shared DB. Soft-delete it via the UI as the e2e advisor.`,
          error,
        );
      }
    }
    if (cvtProspectName && !cvtResultCleanedUp) {
      const removed = await deleteOwnResultsByProspect(request, 'advisor', cvtProspectName);
      cvtResultCleanedUp = true;
      if (removed > 0) {
        console.warn(
          `[portfolio-convert] afterEach removed ${removed} residue result row(s) for ` +
            `"${cvtProspectName}" — the convert test failed before its UI delete step.`,
        );
      }
    }
  });

  test('wizard save → convert modal → comm-style card + provenance notes → View client → cleanup @p0 @mobile', async ({
    page,
  }, testInfo) => {
    // Wizard run + convert + four list/detail round-trips + full UI cleanup.
    test.setTimeout(300_000);

    const suffix = `${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;
    cvtProspectName = `E2E-Cvt-${suffix}`;
    cvtResidue.name = cvtProspectName; // the convert names the client after the prospect
    cvtResidue.id = '';
    cvtClientCleanedUp = false;
    cvtResultCleanedUp = false;

    const wizard = new WizardPage(page);
    let resultId = '';
    let discPrimary = '';
    let discSecondary = '';
    let mbti = '';

    await test.step('run the wizard as the advisor — REAL save; capture DISC/MBTI from the hero', async () => {
      await wizard.goto();
      await wizard.fillIntake({ ...CONVERT_INTAKE, prospect: cvtProspectName });
      await wizard.start();
      await wizard.answerAllQuestions(0);
      await wizard.tickObservations();
      await wizard.advanceThroughObservations();
      await wizard.generate();

      // Authed auto-save hits the live table: toast + "✓ Saved" status line.
      await expect(successToast(page, 'Profile saved to your results')).toBeVisible({
        timeout: 15_000,
      });
      await expect(wizard.saveStatus).toContainText('Saved to your results', { timeout: 15_000 });

      // The hero badges carry the generated letters — the comm-style card and
      // the provenance block must replay exactly these.
      const heroText = await wizard.hero.innerText();
      discPrimary = heroText.match(/DISC-([DISC])/)?.[1] ?? '';
      discSecondary = heroText.match(/Secondary:\s*([DISC])/)?.[1] ?? '';
      mbti = heroText.match(/MBTI:\s*([A-Z]{4})/)?.[1] ?? '';
      expect(discPrimary, 'hero must show a DISC primary letter').not.toBe('');
      expect(discSecondary, 'hero must show a DISC secondary letter').not.toBe('');
      expect(mbti, 'hero must show a 4-letter MBTI code').not.toBe('');
    });

    await test.step('results list: open the saved row → detail; Convert visible (own row)', async () => {
      await page.goto('/profiler-results');
      await searchResults(page, cvtProspectName);
      await expect.poll(() => visibleResultRows(page).count(), { timeout: 30_000 }).toBe(1);
      const row = visibleResultRows(page).first();
      const rowTestId = await row.getAttribute('data-testid');
      resultId = rowTestId?.replace(/^results-(?:row|mobile-card)-/, '') ?? '';
      expect(resultId).not.toBe('');

      await row.click();
      await page.waitForURL(`**/profiler-results/${resultId}`, { timeout: 30_000 });
      await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
      await expect(visibleDetailButton(page, 'result-detail-convert-btn')).toBeVisible();
      // An unconverted row offers no View-client affordance yet.
      await expect(page.locator('[data-testid^="result-detail-view-client-btn"]')).toHaveCount(0);
    });

    await test.step('confirm the convert modal → lands on /clients/<id>', async () => {
      await visibleDetailButton(page, 'result-detail-convert-btn').click();
      const modal = page.getByTestId('result-detail-convert-modal');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(cvtProspectName);
      await page.getByTestId('result-detail-convert-confirm-btn').click();

      await expect(successToast(page, 'Client created')).toBeVisible({ timeout: 20_000 });
      await page.waitForURL(/\/clients\/[0-9a-f-]{36}$/, { timeout: 30_000 });
      cvtResidue.id = new URL(page.url()).pathname.match(/\/clients\/([0-9a-f-]{36})$/)?.[1] ?? '';
      expect(cvtResidue.id).not.toBe('');
      await new ClientsPage(page).waitForDetail();
      await expect(page.getByTestId('clients-detail')).toContainText(cvtProspectName);
    });

    await test.step('Overview: Communication style card shows the DISC letters + playbook link', async () => {
      await expect(page.getByTestId('clients-detail-comm-style')).toBeVisible();
      const commRow = page.getByTestId(`clients-detail-comm-style-row-${resultId}`);
      await expect(commRow).toBeVisible({ timeout: 30_000 });
      // The DISC pill pair carries an exact primary/secondary aria-label.
      await expect(
        commRow.locator(`[aria-label="DISC ${discPrimary} primary, ${discSecondary} secondary"]`),
      ).toBeVisible();
      await expect(commRow).toContainText(`MBTI ${mbti}`);

      const playbookLink = page.getByTestId(`clients-detail-view-playbook-${resultId}`);
      await expect(playbookLink).toBeVisible();
      await expect(playbookLink).toHaveText('View full playbook');
      await expect(playbookLink).toHaveAttribute('href', `/profiler-results/${resultId}`);
    });

    await test.step('Overview notes carry the full provenance block', async () => {
      const overview = page.getByTestId('clients-detail-overview');
      // buildProvenanceNotes: '<result id 8> · Age range · DISC pri/sec · MBTI'.
      await expect(overview).toContainText(
        `Converted from profiler result ${resultId.slice(0, 8)} · ` +
          `Age range: ${CONVERT_INTAKE.age} · DISC ${discPrimary}/${discSecondary} · MBTI ${mbti}`,
      );
      // The convert also copied the prospect's occupation onto the client.
      await expect(overview).toContainText(CONVERT_INTAKE.occupation);
    });

    await test.step("back on the result detail the button reads 'View client' and navigates", async () => {
      await page.goto(`/profiler-results/${resultId}`);
      await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
      // Convert is gone (both hero + mobile-bar variants)…
      await expect(page.locator('[data-testid^="result-detail-convert-btn"]')).toHaveCount(0);
      // …replaced by View client, which round-trips to the converted client.
      const viewClientBtn = visibleDetailButton(page, 'result-detail-view-client-btn');
      await expect(viewClientBtn).toBeVisible();
      await expect(viewClientBtn).toHaveText(/View client/);
      await viewClientBtn.click();
      await page.waitForURL(`**/clients/${cvtResidue.id}`, { timeout: 30_000 });
      await new ClientsPage(page).waitForDetail();
    });

    await test.step('CLEANUP: soft-delete the client via the UI — gone from the list', async () => {
      const crm = new ClientsPage(page);
      // The converted client has no child rows (the convert writes notes only),
      // so the detail delete is the complete cleanup.
      await crm.deleteClientFromDetail();
      await expect(successToast(page, 'Client deleted')).toBeVisible({ timeout: 20_000 });
      await crm.search(cvtResidue.name);
      await expect.poll(() => crm.visibleRows().count(), { timeout: 30_000 }).toBe(0);
      await expect(page.getByTestId('clients-table')).toContainText(
        `No matches for "${cvtResidue.name}"`,
      );
      cvtClientCleanedUp = true;
    });

    await test.step('CLEANUP: delete the result via the UI — gone from the list', async () => {
      await page.goto(`/profiler-results/${resultId}`);
      await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
      await visibleDetailButton(page, 'result-detail-delete-btn').click();
      await expect(page.getByTestId('result-detail-delete-dialog')).toBeVisible();
      await page.getByTestId('result-detail-delete-dialog-confirm-btn').click();

      await expect(successToast(page, 'Result deleted')).toBeVisible({ timeout: 15_000 });
      await page.waitForURL(/\/profiler-results(\?.*)?$/, { timeout: 30_000 });
      await searchResults(page, cvtProspectName);
      await expect.poll(() => visibleResultRows(page).count(), { timeout: 30_000 }).toBe(0);
      await expect(page.getByTestId('results-table')).toContainText(
        `No matches for "${cvtProspectName}"`,
      );
      cvtResultCleanedUp = true;
    });
  });
});
