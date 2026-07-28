/**
 * Client report journey @p0 @mobile — seed a real advisor-book client through
 * the CRM UI, open the printable /clients/:id/report, and assert the KEY
 * NUMBERS against the SAME lib functions the page renders from
 * (src/features/crm/lib/finance.ts + financeReport.ts, imported directly into
 * this spec — the golden-vector suites in src/features/crm/lib/__tests__/ are
 * the parity guarantee that those functions match legacy byte-for-byte).
 *
 * Runs as the e2e ADVISOR via the saved storageState (tests/.auth/advisor.json,
 * written by tests/auth.setup.ts under playwright.parallel.config.ts).
 *
 * Seed (via the shared ClientsPage POM): client 'E2E-Rpt-<suffix>' with DOB
 * 1991-01-01 (deterministic age), income 60000, CPF OA/SA/MA 50000/40000/30000,
 * seed bank balance 10000 → Life Insurance policy (premium 200 Monthly, death
 * 500000, CI 100000) → Investment-Linked Policy (premium 300 Monthly, death
 * 100000, illustrated@65 80000, inclusion 50%, account value 15000) → one
 * Meeting interaction.
 *
 * Report assertions (every expected string computed from the lib fns over the
 * SAME seeded inputs — never hand-transcribed):
 * - hero: projected@65 = formatCoverage(heroTotals(...).totalRetirementValue)
 *   (= ILP 80000 + bank 10000×1.005^yearsToRetirement); death coverage =
 *   formatCoverage(500000 + 100000) = $600K (both policies' death benefits sum);
 *   policy count / years-to-retirement / annual investment in self
 * - health snapshot: all four benchmark cards incl. the CPF FRS % card
 *   (assessRetirementReadiness(...).cpfAchievementPct.toFixed(0) + '%')
 * - coverage analysis: death/ci/eci/premium rows with the lib Cost@65 values,
 *   each Cost@65 cell numerically GREATER than its Current cell
 * - CPF projection: OA/SA/MA/Total = 4 table rows with projectCPFTo55 values;
 *   the RA panel renders EXACTLY ONE status alert with the lib-derived tone
 * - retirement projection: ILP/bank/total gradient cards (heroTotals), the
 *   bank-history table, the components table with currentHoldingsTotal
 * - portfolio grouped by raw type (one group per seeded type), ILP analysis
 *   card with the illustrated@65 value, interaction history, disclaimer
 * - print: the no-print action bar is VISIBLE on screen; window.print is
 *   stubbed via page.evaluate with a flag-setter, Print clicked, stub called
 *
 * Data safety (LIVE shared DB): every row is created by this spec under the
 * e2e advisor's own account with an 'E2E-Rpt-' + per-run unique name, and
 * deleted through the UI in the test's `finally` (policies → interactions →
 * bank rows → soft-delete client). An afterEach safety net re-runs the same UI
 * cleanup when the test failed/timed out mid-flow (a dead page in `finally`
 * can't navigate — clients-advisor.spec pattern). RLS confines every write to
 * the advisor's own book; sky/Keane data is untouchable by design.
 *
 * Serialisation: this spec INSERTS policies/interactions into the advisor's
 * book, which would corrupt clients-advisor.spec's dashboard-KPI baseline+delta
 * math if interleaved — the whole describe holds the shared cross-worker
 * advisor-book lock (tests/fixtures/advisorBookLock.ts, the same mkdir mutex
 * clients-advisor creates inline).
 *
 * All selectors are real data-testids read from:
 *   src/features/crm/pages/ClientReportPage.tsx
 *   src/features/crm/components/report/{ReportHero,ReportHealthSnapshot,
 *     ReportCoverageAnalysis,ReportCpfProjection,ReportCpfRaPanel,
 *     ReportRetirementProjection,ReportIlpAnalysis,ReportPolicyPortfolio,
 *     ReportInteractionHistory,ReportDisclaimer}.tsx
 *   src/features/crm/** via the shared ClientsPage POM (tests/pom/ClientsPage.ts)
 *
 * Run (parallel config mints the advisor storageState first):
 *   npx playwright test tests/workflows/reports/client-report.spec.ts \
 *     --config=playwright.parallel.config.ts
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import {
  acquireAdvisorBookLock,
  releaseAdvisorBookLock,
} from '../../fixtures/advisorBookLock';
import { ClientsPage } from '../../pom/ClientsPage';
import {
  ageFromDOB,
  currentRefYear,
  formatCoverage,
  projectCPFTo55,
  summariseClient,
  toFloat,
  type SummaryPolicyInput,
} from '../../../src/features/crm/lib/finance';
import {
  assessRetirementReadiness,
  coverageCostAt65CI,
  coverageCostAt65Death,
  coverageCostAt65ECI,
  cpfCurrentTotal,
  currentHoldingsTotal,
  heroTotals,
  premiumsPctOfIncome,
  splitPremiums,
} from '../../../src/features/crm/lib/financeReport';

// ── Seeded inputs (single source for BOTH the UI forms and the lib math) ─────

const DOB = '1991-01-01'; // deterministic age: refYear − 1991 (35 at refYear 2026)
const ANNUAL_INCOME = '60000';
const CPF_OA = '50000';
const CPF_SA = '40000';
const CPF_MA = '30000';
const BANK_BALANCE = '10000';

const LIFE = {
  type: 'Life Insurance',
  premium: '200',
  frequency: 'Monthly',
  coverageAmount: '500000',
  criticalIllnessCoverage: '100000',
} as const;

const ILP = {
  type: 'Investment-Linked Policy',
  premium: '300',
  frequency: 'Monthly',
  coverageAmount: '100000', // ILP death benefit — summed into hero death coverage
  currentAccountValue: '15000',
  illustratedValueAge65: '80000',
  ilpPremiumInclusionPercent: '50',
} as const;

/**
 * The two policies as the lib consumes them — the exact field set
 * summariseClient / splitPremiums / heroTotals read. Values mirror the form
 * strings the UI submits (mapping.ts round-trips numerics back to strings).
 */
const POLICY_SHAPES: Array<
  SummaryPolicyInput & {
    illustratedValueAge65?: string;
    currentAccountValue?: string;
  }
> = [
  {
    type: LIFE.type,
    premium: LIFE.premium,
    frequency: LIFE.frequency,
    coverageAmount: LIFE.coverageAmount,
    criticalIllnessCoverage: LIFE.criticalIllnessCoverage,
    earlyCriticalIllnessCoverage: '',
    isInvestmentLinked: false,
    ilpPremiumInclusionPercent: '0',
  },
  {
    type: ILP.type,
    premium: ILP.premium,
    frequency: ILP.frequency,
    coverageAmount: ILP.coverageAmount,
    criticalIllnessCoverage: '',
    earlyCriticalIllnessCoverage: '',
    isInvestmentLinked: true,
    ilpPremiumInclusionPercent: ILP.ilpPremiumInclusionPercent,
    illustratedValueAge65: ILP.illustratedValueAge65,
    currentAccountValue: ILP.currentAccountValue,
  },
];

// ── Display-formatting mirrors (the components' exact wrappers) ──────────────
// The page formats with locale-less toLocaleString(); Playwright contexts
// default to en-US, so the spec pins 'en-US' for Node-side determinism.

/** Components' `money` — Math.round + locale grouping. */
const money = (value: number): string => `$${Math.round(value).toLocaleString('en-US')}`;
/** Components' `moneyExact` — UNROUNDED locale string (integer seeds stay exact). */
const moneyExact = (value: number): string => `$${value.toLocaleString('en-US')}`;
/** "$1,258,540" / "$92K" → 1258540 / NaN-safe numeric for > comparisons. */
const parseMoney = (text: string): number => Number(text.replace(/[^0-9.]/g, ''));

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
 * Coverage-analysis row sanity: the Cost@65 cell (td[4]) must exceed the
 * Current cell (td[1]) — medical/general inflation always grows the target.
 */
async function expectCostAt65ExceedsCurrent(row: Locator): Promise<void> {
  const cells = row.locator('td');
  const current = parseMoney(await cells.nth(1).innerText());
  const costAt65 = parseMoney(await cells.nth(4).innerText());
  expect(costAt65).toBeGreaterThan(current);
}

/**
 * Shared by the test's `finally` and the afterEach safety net. Within-file
 * serial (fullyParallel: false), never shared across workers.
 */
let clientName = '';
let clientId = '';
let cleanedUp = true;

/**
 * UI cleanup, idempotent: find the client (by id, else by name search — zero
 * matches means nothing was created), soft-delete every child row (policies /
 * interactions / bank), then the client itself.
 */
async function cleanupSeededClient(page: Page): Promise<void> {
  const crm = new ClientsPage(page);
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
}

test.describe('client report — seeded numbers match the lib math', () => {
  test.use({ storageState: authFileFor('advisor') });

  // Serialise across projects/workers — this spec writes policies/interactions
  // into the advisor book that clients-advisor.spec's KPI math reads whole.
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // The peer project may hold the lock for its full journey — widen this
    // hook's budget well beyond the per-test timeout.
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireAdvisorBookLock(660_000, 'client-report.spec');
  });
  test.afterAll(() => {
    releaseAdvisorBookLock();
  });

  // Safety net: re-runs the UI cleanup when the test failed (or timed out)
  // before its finally-cleanup could finish. No-op on the happy path.
  test.afterEach(async ({ page }, testInfo) => {
    if (cleanedUp) return;
    testInfo.setTimeout(testInfo.timeout + 180_000);
    try {
      await cleanupSeededClient(page);
      console.warn(
        `[client-report] afterEach safety net removed residue client "${clientName}" — ` +
          'the spec failed before its finally-cleanup step.',
      );
    } catch (error) {
      console.error(
        `[client-report] EMERGENCY CLEANUP FAILED — possible residue client "${clientName}" ` +
          `(id: ${clientId || 'unknown'}) on the LIVE shared DB. Soft-delete it via the UI as the e2e advisor.`,
        error,
      );
    }
  });

  test('seed book → /clients/:id/report renders lib-exact numbers → print stub → cleanup @p0 @mobile', async ({
    page,
  }, testInfo) => {
    // Long journey: 3 modals + a full report walk + full UI cleanup.
    test.setTimeout(300_000);

    // Per-run unique, retry-safe, parallel-project-safe — and free of every
    // character the list's sanitizeSearchTerm strips, so search matches verbatim.
    const suffix = `${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;
    clientName = `E2E-Rpt-${suffix}`;
    clientId = '';
    cleanedUp = false;

    const todayIso = sgDateInDays(0);
    const lifePolicyNumber = `E2E-RPT-LIFE-${suffix}`;
    const ilpPolicyNumber = `E2E-RPT-ILP-${suffix}`;
    const interactionNote = `E2E report meeting for ${clientName}`;
    const crm = new ClientsPage(page);
    let ilpPolicyId = '';

    // ── Expected values — the SAME lib fns the page calls, over the SAME seeds ──
    const refYear = currentRefYear();
    const currentAge = ageFromDOB(DOB, refYear);
    const yearsTo55 = Math.max(0, 55 - currentAge);
    const summary = summariseClient({ annualIncome: ANNUAL_INCOME, policies: POLICY_SHAPES });
    const hero = heroTotals(
      { dateOfBirth: DOB, totalBankBalance: BANK_BALANCE, policies: POLICY_SHAPES },
      refYear,
    );
    const readiness = assessRetirementReadiness(
      {
        dob: DOB,
        yearsTo55,
        cpfOA: toFloat(CPF_OA),
        cpfSA: toFloat(CPF_SA),
        cpfMA: toFloat(CPF_MA),
      },
      refYear,
    );
    const cpf = projectCPFTo55({
      cpfOA: toFloat(CPF_OA),
      cpfSA: toFloat(CPF_SA),
      cpfMA: toFloat(CPF_MA),
      yearsTo55,
    });
    const premiumPcts = premiumsPctOfIncome(splitPremiums(POLICY_SHAPES), summary.income);
    // ReportCpfRaPanel's alert ladder — exactly one branch renders.
    const expectedRaTone = readiness.meetsFRS ? 'success' : readiness.meetsBRS ? 'warning' : 'danger';

    try {
      await test.step('seed client (DOB/income/CPF/bank) via ClientsPage POM', async () => {
        await crm.gotoList();
        await crm.openAddClientForm();
        await expect(crm.clientModal).toBeVisible();
        await crm.fillClientForm({
          name: clientName,
          email: `e2e-rpt-${Date.now()}@example.com`,
          phone: '9123 0000',
          dateOfBirth: DOB,
          occupation: 'E2E Engineer',
          annualIncome: ANNUAL_INCOME,
          riskProfile: 'Moderate',
          notes: 'E2E client-report seed — safe to soft-delete.',
          totalBankBalance: BANK_BALANCE,
          cpfOA: CPF_OA,
          cpfSA: CPF_SA,
          cpfMA: CPF_MA,
        });
        await crm.submitClientForm();
        await expect(successToast(page, 'Client added')).toBeVisible({ timeout: 20_000 });
        clientId = await crm.openClientByName(clientName);
      });

      await test.step('seed Life Insurance policy (200 Monthly / 500k death / 100k CI)', async () => {
        await crm.switchTab('policies');
        await crm.policiesAddButton.click();
        await expect(crm.policyModal).toBeVisible();
        await crm.fillPolicyForm({
          type: LIFE.type,
          provider: 'E2E Assurance',
          policyNumber: lifePolicyNumber,
          startDate: todayIso,
          premium: LIFE.premium,
          frequency: LIFE.frequency,
          coverageAmount: LIFE.coverageAmount,
          criticalIllnessCoverage: LIFE.criticalIllnessCoverage,
        });
        await crm.submitPolicyForm();
        await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });
        await expect(crm.childRows('policies')).toHaveCount(1, { timeout: 30_000 });
      });

      await test.step('seed ILP (300 Monthly / illustrated@65 80k / inclusion 50%)', async () => {
        await crm.policiesAddButton.click();
        await expect(crm.policyModal).toBeVisible();
        await crm.fillPolicyForm({
          type: ILP.type,
          provider: 'E2E Invest',
          policyNumber: ilpPolicyNumber,
          startDate: todayIso,
          premium: ILP.premium,
          frequency: ILP.frequency,
          coverageAmount: ILP.coverageAmount,
          investmentLinked: {
            currentAccountValue: ILP.currentAccountValue,
            illustratedValueAge65: ILP.illustratedValueAge65,
            ilpPremiumInclusionPercent: ILP.ilpPremiumInclusionPercent,
          },
        });
        await crm.submitPolicyForm();
        await expect(successToast(page, 'Policy added')).toBeVisible({ timeout: 20_000 });
        await expect(crm.childRows('policies')).toHaveCount(2, { timeout: 30_000 });
        // The report's per-policy ILP testids carry the policy UUID.
        ilpPolicyId = await crm.idFromRow(
          crm.childRows('policies').filter({ hasText: ilpPolicyNumber }).first(),
        );
      });

      await test.step('seed one Meeting interaction', async () => {
        await crm.switchTab('interactions');
        await crm.interactionsAddButton.click();
        await expect(crm.interactionModal).toBeVisible();
        await crm.fillInteractionForm({
          date: todayIso,
          type: 'Meeting',
          notes: interactionNote,
        });
        await crm.submitInteractionForm();
        await expect(successToast(page, 'Interaction logged')).toBeVisible({ timeout: 20_000 });
        await expect(crm.childRows('interactions')).toHaveCount(1, { timeout: 30_000 });
      });

      await test.step('open /clients/:id/report — canvas renders, print bar on screen', async () => {
        await page.goto(`/clients/${clientId}/report`);
        await expect(page.getByTestId('report-canvas')).toBeVisible({ timeout: 30_000 });
        await expect(page.getByTestId('report-loading')).toHaveCount(0);
        // The .no-print action bar IS visible on screen (hidden only in print).
        await expect(page.getByTestId('report-print')).toBeVisible();
        await expect(page.getByTestId('report-back-to-client')).toBeVisible();
      });

      await test.step('hero: projected@65 = ILP + bank×1.005^years; death = both policies summed', async () => {
        await expect(page.getByTestId('report-hero')).toContainText(clientName);
        await expect(page.getByTestId('report-hero-stat-policies')).toContainText('2');
        // 500000 (Life) + 100000 (ILP death benefit) = 600000 → "$600K".
        await expect(page.getByTestId('report-hero-stat-coverage')).toContainText(
          formatCoverage(summary.totalCoverage),
        );
        // Un-scaled annualised premiums: 200×12 + 300×12 = 6000 → "$6K".
        await expect(page.getByTestId('report-hero-stat-investment')).toContainText(
          formatCoverage(summary.totalAnnualInvestment),
        );
        // 80000 + 10000×1.005^yearsToRetirement (heroTotals is the page's fn).
        await expect(page.getByTestId('report-hero-stat-projected-65')).toContainText(
          formatCoverage(hero.totalRetirementValue),
        );
        await expect(page.getByTestId('report-hero-stat-years-to-retirement')).toContainText(
          String(hero.yearsToRetirement),
        );
      });

      await test.step('health snapshot: 4 benchmark cards; FRS card shows the lib percentage', async () => {
        await expect(page.getByTestId('report-health-snapshot')).toBeVisible();
        await expect(page.getByTestId('report-health-card-insurance')).toContainText(
          `${premiumPcts.insurancePremiumsPct.toFixed(1)}%`,
        );
        await expect(page.getByTestId('report-health-card-invested')).toContainText(
          `${premiumPcts.investmentPremiumsPct.toFixed(1)}%`,
        );
        await expect(page.getByTestId('report-health-card-protection')).toContainText(
          `${summary.coverageRatio.toFixed(1)}x`,
        );
        // The CPF FRS-track card shows a percentage — the exact lib value.
        await expect(page.getByTestId('report-health-card-cpf')).toContainText(/\d+%/);
        await expect(page.getByTestId('report-health-card-cpf')).toContainText(
          `${readiness.cpfAchievementPct.toFixed(0)}%`,
        );
      });

      await test.step('coverage analysis: 4 rows, lib Cost@65 values, each > Current', async () => {
        await expect(page.getByTestId('report-coverage-analysis')).toBeVisible();

        const deathRow = page.getByTestId('report-coverage-row-death');
        await expect(deathRow).toContainText(money(summary.totalCoverage));
        await expect(deathRow).toContainText(`${summary.coverageRatio.toFixed(1)}x`);
        await expect(deathRow).toContainText(
          money(coverageCostAt65Death(summary.income, hero.yearsToRetirement)),
        );
        await expectCostAt65ExceedsCurrent(deathRow);

        const ciRow = page.getByTestId('report-coverage-row-ci');
        await expect(ciRow).toContainText(money(summary.totalCICoverage));
        await expect(ciRow).toContainText(
          money(coverageCostAt65CI(summary.income, hero.yearsToRetirement)),
        );
        await expectCostAt65ExceedsCurrent(ciRow);

        const eciRow = page.getByTestId('report-coverage-row-eci');
        await expect(eciRow).toContainText(money(summary.totalECICoverage));
        await expect(eciRow).toContainText(
          money(coverageCostAt65ECI(summary.income, hero.yearsToRetirement)),
        );
        await expectCostAt65ExceedsCurrent(eciRow);

        // Premium row: annualised + ILP-scaled total (200×12 + 300×12×50%).
        const premiumRow = page.getByTestId('report-coverage-row-premium');
        await expect(premiumRow).toContainText(money(summary.totalAnnualPremium));
        await expect(premiumRow).toContainText(`${summary.premiumRatio.toFixed(1)}%`);
      });

      await test.step('CPF projection: OA/SA/MA + Total rows (4) with projectCPFTo55 values', async () => {
        await expect(page.getByTestId('report-cpf-projection')).toBeVisible();

        const accountRows = [
          { id: 'oa', current: toFloat(CPF_OA), at55: cpf.oaAt55 },
          { id: 'sa', current: toFloat(CPF_SA), at55: cpf.saAt55 },
          { id: 'ma', current: toFloat(CPF_MA), at55: cpf.maAt55 },
        ];
        for (const row of accountRows) {
          const rowLocator = page.getByTestId(`report-cpf-row-${row.id}`);
          await expect(rowLocator).toBeVisible();
          await expect(rowLocator).toContainText(moneyExact(row.current));
          await expect(rowLocator).toContainText(money(row.at55));
          await expect(rowLocator).toContainText(String(yearsTo55));
        }
        const totalRow = page.getByTestId('report-cpf-row-total');
        await expect(totalRow).toBeVisible();
        await expect(totalRow).toContainText(
          moneyExact(cpfCurrentTotal(toFloat(CPF_OA), toFloat(CPF_SA), toFloat(CPF_MA))),
        );
        await expect(totalRow).toContainText(money(cpf.totalCPFAt55));

        // The Medisave-overflow callout mirrors the lib projection exactly.
        await expect(page.getByTestId('report-cpf-overflow')).toHaveCount(
          cpf.totalOverflow > 0 ? 1 : 0,
        );
      });

      await test.step('RA panel: exactly ONE status alert, lib-derived tone + FRS %', async () => {
        await expect(page.getByTestId('report-cpf-ra-panel')).toBeVisible();
        const alert = page.getByTestId('report-cpf-ra-alert');
        await expect(alert).toHaveCount(1);
        await expect(alert).toHaveAttribute('data-tone', expectedRaTone);
        await expect(page.getByTestId('report-cpf-frs-pct')).toHaveText(
          String(readiness.frsPercentage),
        );
        // Unrounded locale float — assert the stable integer part only (the
        // fraction digits ride on last-ulp float formatting).
        await expect(page.getByTestId('report-cpf-projected-ra')).toContainText(
          `$${Math.floor(readiness.projectedRA).toLocaleString('en-US')}`,
        );
      });

      await test.step('retirement projection: ILP/bank/total cards + components table', async () => {
        await expect(page.getByTestId('report-retirement-projection')).toBeVisible();
        await expect(page.getByTestId('report-retirement-card-ilp')).toContainText(
          money(hero.totalILPValueAt65),
        );
        await expect(page.getByTestId('report-retirement-card-bank')).toContainText(
          money(hero.bankBalanceAt65),
        );
        await expect(page.getByTestId('report-retirement-card-total')).toContainText(
          money(hero.totalRetirementValue),
        );

        // The seed bank row renders in the history table.
        const bankHistory = page.getByTestId('report-retirement-bank-history');
        await expect(bankHistory).toBeVisible();
        await expect(bankHistory).toContainText(moneyExact(toFloat(BANK_BALANCE)));

        // Components table: ILP row + bank row + the currentHoldingsTotal row.
        await expect(page.getByTestId(`report-retirement-row-${ilpPolicyId}`)).toContainText(
          moneyExact(toFloat(ILP.currentAccountValue)),
        );
        const componentsTotal = page.getByTestId('report-retirement-row-total');
        await expect(componentsTotal).toContainText(
          moneyExact(
            currentHoldingsTotal(toFloat(BANK_BALANCE), [
              { currentAccountValue: ILP.currentAccountValue },
            ]),
          ),
        );
        await expect(componentsTotal).toContainText(money(hero.totalRetirementValue));
      });

      await test.step('ILP analysis card shows the illustrated@65 value', async () => {
        await expect(page.getByTestId('report-ilp-analysis')).toBeVisible();
        const ilpCard = page.getByTestId(`report-ilp-card-${ilpPolicyId}`);
        await expect(ilpCard).toContainText(ilpPolicyNumber);
        await expect(page.getByTestId(`report-ilp-value-65-${ilpPolicyId}`)).toContainText(
          money(toFloat(ILP.illustratedValueAge65)),
        );
      });

      await test.step('portfolio groups by type; interaction history; disclaimer', async () => {
        // One group per seeded raw type string, each holding its one policy.
        const lifeGroup = page.getByTestId(`report-portfolio-group-${LIFE.type}`);
        await expect(lifeGroup).toBeVisible();
        await expect(lifeGroup).toContainText(`${LIFE.type} (1)`);
        await expect(lifeGroup).toContainText(lifePolicyNumber);
        await expect(lifeGroup).toContainText(moneyExact(toFloat(LIFE.coverageAmount)));

        const ilpGroup = page.getByTestId(`report-portfolio-group-${ILP.type}`);
        await expect(ilpGroup).toBeVisible();
        await expect(ilpGroup).toContainText(`${ILP.type} (1)`);
        await expect(ilpGroup).toContainText(ilpPolicyNumber);

        const history = page.getByTestId('report-interaction-history');
        await expect(history).toContainText('Meeting');
        await expect(history).toContainText(interactionNote);
        await expect(history.locator('[data-testid^="report-interaction-row-"]')).toHaveCount(1);

        const disclaimer = page.getByTestId('report-disclaimer');
        await expect(disclaimer).toBeVisible();
        await expect(disclaimer).toContainText('Disclaimer:');
        await expect(disclaimer).toContainText(
          `Current age ${currentAge}, ${hero.yearsToRetirement} years to retirement`,
        );
      });

      await test.step('print: stub window.print with a flag-setter → click Print → called once', async () => {
        await page.evaluate(() => {
          const probe = window as Window & { __e2ePrintCalls?: number };
          probe.__e2ePrintCalls = 0;
          probe.print = () => {
            probe.__e2ePrintCalls = (probe.__e2ePrintCalls ?? 0) + 1;
          };
        });
        await page.getByTestId('report-print').click();
        await expect
          .poll(
            () =>
              page.evaluate(
                () => (window as Window & { __e2ePrintCalls?: number }).__e2ePrintCalls,
              ),
            { timeout: 10_000 },
          )
          .toBe(1);
      });

      await test.step('CLEANUP: delete policies/interaction/bank rows, soft-delete client', async () => {
        await cleanupSeededClient(page);
        await crm.search(clientName);
        await expect.poll(() => crm.visibleRows().count(), { timeout: 30_000 }).toBe(0);
      });
    } finally {
      // A failed step leaves residue — clean through the UI now while the page
      // is (usually) alive. A thrown cleanup here would MASK the test's own
      // failure, so log and defer to the afterEach safety net instead.
      if (!cleanedUp) {
        try {
          await cleanupSeededClient(page);
        } catch (error) {
          console.warn(
            `[client-report] in-test finally could not clean up "${clientName}" — ` +
              'deferring to the afterEach safety net.',
            error,
          );
        }
      }
    }
  });
});
