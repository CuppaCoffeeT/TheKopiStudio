/**
 * Anonymous wizard journey @p0 @mobile — the PUBLIC /profiler flow with NO
 * session: intake → 8 questions → observations → generate → result report.
 *
 * ZERO DB residue by design: the anonymous auto-save POST to
 * `**\/rest\/v1\/results*` is intercepted and fulfilled with a synthetic 201,
 * so the live `results` table is never touched. The captured request payload
 * is asserted against the frozen legacy insert contract instead
 * (src/features/profiler/hooks/savePayload.ts). Nothing to clean up.
 *
 * Runs identically under chromium-desktop and mobile-safari (all tap targets
 * are ≥44px; SelectMenu driven via the shared Radix helper). The empty
 * storageState below overrides the parallel config's super_admin session so
 * the visitor is genuinely anonymous in every project.
 */

import { test, expect } from '@playwright/test';
import { WizardPage } from '../../pom/WizardPage';

/** Shape of one `raw_answers` slot (frozen legacy contract). */
interface RawAnswerPayload {
  d: string;
  oi: number;
  mb: { k: string; v: string };
}

/** The slice of the `public.results` insert payload this spec asserts. */
interface ResultsInsertPayload {
  user_id: string | null;
  meeting: string | null;
  raw_answers: RawAnswerPayload[];
  nv_observations: Record<string, boolean>;
  score_d: number;
  score_i: number;
  score_s: number;
  score_c: number;
  observations_count: number;
  questions_answered: number;
  prospect_name: string;
  occupation: string | null;
}

const INTAKE = {
  advisor: 'E2E Advisor',
  prospect: 'E2E Anon Prospect',
  age: '31-35',
  meeting: '2',
  // 'Engineer' hits the legacy occNudge bucket → the occupation chip renders.
  occupation: 'Engineer',
} as const;

// Anonymous context in EVERY project — overrides the parallel config's
// super_admin storageState (and is a no-op under the serial config).
test.use({ storageState: { cookies: [], origins: [] } });

test('anonymous visitor runs the full wizard; save intercepted; exports work @p0 @mobile', async ({
  page,
  context,
  browserName,
}) => {
  // Full journey on a cold dev server (webkit especially) needs headroom.
  test.slow();

  // Clipboard permissions are Chromium-only in Playwright; WebKit allows
  // navigator.clipboard.writeText via the real click's user activation.
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  }

  // ── Intercept the anonymous save BEFORE the flow starts ────────────────
  let savedPayload: ResultsInsertPayload | null = null;
  await page.route('**/rest/v1/results*', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as ResultsInsertPayload | ResultsInsertPayload[];
    savedPayload = Array.isArray(body) ? body[0] : body;
    // Anonymous insert is fire-and-forget (return=minimal) — 201, empty body.
    await route.fulfill({ status: 201, body: '' });
  });

  const wizard = new WizardPage(page);

  await test.step('intake → questions → observations → generate', async () => {
    await wizard.goto();
    await wizard.fillIntake(INTAKE);
    await wizard.start();
    await wizard.answerAllQuestions(0);
    await wizard.tickObservations();
    await wizard.advanceThroughObservations();
    await wizard.generate();
  });

  await test.step('result report renders hero + DISC score card + playbook', async () => {
    await expect(wizard.resultReport).toBeVisible();
    await expect(wizard.hero).toBeVisible();
    await expect(wizard.scoreCard).toBeVisible();
    await expect(wizard.occupationChip).toBeVisible(); // 'Engineer' factored in
    await expect(wizard.playbook).toBeVisible();
    await expect(wizard.playbookCategory('engage')).toBeVisible();
  });

  await test.step('intercepted payload matches the frozen anonymous-save contract', async () => {
    await expect.poll(() => savedPayload, { timeout: 15_000 }).not.toBeNull();
    const row = savedPayload!;

    // Anonymous: user_id null (or absent).
    expect(row.user_id ?? null).toBeNull();

    // Meeting persists as TEXT '1'–'4', exactly as selected.
    expect(typeof row.meeting).toBe('string');
    expect(row.meeting).toBe(INTAKE.meeting);

    // raw_answers: 8 slots of { d, mb: { k, v }, oi } — option 0 everywhere.
    expect(Array.isArray(row.raw_answers)).toBe(true);
    expect(row.raw_answers).toHaveLength(8);
    for (const answer of row.raw_answers) {
      expect(typeof answer.d).toBe('string');
      expect(answer.oi).toBe(0);
      expect(typeof answer.mb.k).toBe('string');
      expect(typeof answer.mb.v).toBe('string');
    }

    // nv_observations: plain id→boolean map with our ticked ids TRUE.
    expect(Array.isArray(row.nv_observations)).toBe(false);
    expect(typeof row.nv_observations).toBe('object');
    for (const id of ['a1', 'a5', 'a9']) {
      expect(row.nv_observations[id]).toBe(true);
    }
    for (const value of Object.values(row.nv_observations)) {
      expect(typeof value).toBe('boolean');
    }
    expect(row.observations_count).toBe(3);
    expect(row.questions_answered).toBe(8);
    expect(row.prospect_name).toBe(INTAKE.prospect);
    expect(row.occupation).toBe(INTAKE.occupation);

    // Scores are numbers and agree with the score card's "{pts} pts" labels.
    const scoreKeys = { D: 'score_d', I: 'score_i', S: 'score_s', C: 'score_c' } as const;
    for (const letter of ['D', 'I', 'S', 'C'] as const) {
      const saved = row[scoreKeys[letter]];
      expect(typeof saved).toBe('number');
      expect(saved).toBe(await wizard.scorePoints(letter));
    }
  });

  await test.step('"Log in" CTA appears after the (intercepted) anonymous save', async () => {
    await expect(wizard.loginCta).toBeVisible();
    await expect(wizard.loginCtaButton).toBeVisible();
    // The authed "Saved to your results" status line never renders anonymously.
    await expect(wizard.saveStatus).toHaveCount(0);
  });

  await test.step('tap-to-copy shows the success toast', async () => {
    await wizard.copyButton('engage', 0).click();
    await expect(
      page.getByTestId('toast-success').filter({ hasText: 'Copied' }),
    ).toBeVisible();
  });

  await test.step('CSV button triggers a profile_*.csv download', async () => {
    const downloadPromise = page.waitForEvent('download');
    await wizard.csvButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^profile_.+_\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
