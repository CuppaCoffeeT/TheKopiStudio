import { expect, type Locator, type Page } from '@playwright/test';
import { chooseSelectMenuOption } from './selectMenu';

/**
 * WizardPage — POM for the PUBLIC profiling wizard at /profiler.
 *
 * Screen map (prototype v6 `go()` port, 2026-09-25, see ProfilerWizardPage):
 *   0 intake → 1–2 rapport batches (Q0–3 / Q4–6) → 3–7 the five observation
 *   groups → 8 pit stop → 9 discovery (money anchor Q7 + four tracks) →
 *   'R' result report. The footer Next button (`wizard-next-btn`) reads
 *   "See Quick Read →" on the last observation screen, "Continue to
 *   Discovery →" on the pit stop and "Generate Profile →" on discovery.
 *
 * All selectors are real data-testids read from:
 *   src/features/profiler/components/wizard/{IntakeForm,QuestionScreen,ObservationScreen,PitStopScreen,DiscoveryScreen}.tsx
 *   src/features/profiler/components/wizard/result/{ResultReport,ResultHero,ResultActions,ScoreCard,PlaybookSection}.tsx
 */

export interface WizardIntake {
  advisor?: string;
  prospect?: string;
  /** One of AGE_RANGES: '20-25' | '26-30' | '31-35' | '36-40' | '41-45' | '46+'. */
  age?: string;
  /** Meeting value as STORED: '1' | '2' | '3' | '4'. */
  meeting?: string;
  occupation?: string;
}

export type DiscLetter = 'D' | 'I' | 'S' | 'C';
export type PlaybookCategory = 'engage' | 'appt' | 'followup' | 'objections' | 'close';

/** Rapport batches (Q0–3 / Q4–6); Q7, the money anchor, is on the discovery screen. */
const RAPPORT_BATCHES = [[0, 1, 2, 3], [4, 5, 6]] as const;
const MONEY_ANCHOR_QI = 7;
const OBSERVATION_GROUPS = 5;
const TRACKS = ['temperament', 'openness', 'horizon', 'decision'] as const;

/** Group-0 observation ids (First 30 Seconds) ticked by default. */
const DEFAULT_OBSERVATION_IDS = ['a1', 'a5', 'a9'] as const;

export class WizardPage {
  /** Option index answerAllQuestions() used — generate() answers the money anchor with it too. */
  private optionIndex = 0;

  constructor(readonly page: Page) {}

  // ── Navigation ─────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/profiler');
    await this.page.getByTestId('wizard-intake-screen').waitFor({ state: 'visible', timeout: 30_000 });
  }

  // ── Intake (screen 0) ──────────────────────────────────────────────────

  async fillIntake(intake: WizardIntake): Promise<void> {
    if (intake.advisor !== undefined) {
      await this.page.getByTestId('wizard-intake-advisor-input').fill(intake.advisor);
    }
    if (intake.prospect !== undefined) {
      await this.page.getByTestId('wizard-intake-prospect-input').fill(intake.prospect);
    }
    if (intake.age !== undefined) {
      await chooseSelectMenuOption(this.page, {
        trigger: 'wizard-intake-age-select',
        optionTestId: `wizard-intake-age-opt-${intake.age}`,
      });
    }
    if (intake.meeting !== undefined) {
      await chooseSelectMenuOption(this.page, {
        trigger: 'wizard-intake-meeting-select',
        optionTestId: `wizard-intake-meeting-opt-${intake.meeting}`,
      });
    }
    if (intake.occupation !== undefined) {
      await this.page.getByTestId('wizard-intake-occupation-input').fill(intake.occupation);
    }
  }

  /** Click "Continue to questions →" (wizard-start-btn) and wait for question screen 1. */
  async start(): Promise<void> {
    await this.page.getByTestId('wizard-start-btn').click();
    await this.page.getByTestId('wizard-questions-screen-1').waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ── Rapport question screens (1–2) ─────────────────────────────────────

  get nextButton(): Locator {
    return this.page.getByTestId('wizard-next-btn');
  }

  get backButton(): Locator {
    return this.page.getByTestId('wizard-back-btn');
  }

  /** Pick option `oi` on question `qi` (option rows are ≥44px tap targets). */
  async selectOption(qi: number, oi: number): Promise<void> {
    await this.page.getByTestId(`wizard-q${qi}-opt-${oi}`).click();
  }

  /**
   * Answer the 7 rapport questions with option index 0 (or the supplied index)
   * across the two rapport screens, clicking Next between them. Leaves the
   * wizard on the FIRST observation screen. The 8th question (the money
   * anchor) is answered with the same index by generate(), on the discovery
   * screen — so raw_answers still ends up 8 × optionIndex.
   */
  async answerAllQuestions(optionIndex = 0): Promise<void> {
    this.optionIndex = optionIndex;
    for (const [i, batch] of RAPPORT_BATCHES.entries()) {
      if (i > 0) {
        await this.nextButton.click();
        await this.page.getByTestId(`wizard-questions-screen-${i + 1}`).waitFor({ state: 'visible', timeout: 15_000 });
      }
      for (const qi of batch) {
        await this.selectOption(qi, optionIndex);
      }
      // Next is gated on the whole batch — enabled proves every click registered.
      await expect(this.nextButton).toBeEnabled();
    }
    await this.nextButton.click();
    await this.page.getByTestId('wizard-observations-screen-0').waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ── Observation screens (3–7) ──────────────────────────────────────────

  get observationsCount(): Locator {
    return this.page.getByTestId('wizard-observations-count');
  }

  /**
   * Tick observation checkboxes on the FIRST observation group (ids a1–a10).
   * Defaults to three group-0 signals. Returns the ids it ticked so the spec
   * can assert them against the saved payload.
   */
  async tickObservations(ids: readonly string[] = DEFAULT_OBSERVATION_IDS): Promise<readonly string[]> {
    await this.page.getByTestId('wizard-observations-screen-0').waitFor({ state: 'visible', timeout: 15_000 });
    for (const id of ids) {
      await this.page.getByTestId(`wizard-obs-${id}`).click();
    }
    return ids;
  }

  /**
   * Click Next through the remaining observation groups until the LAST one
   * (group 4) is showing. Does NOT generate — call generate() after.
   */
  async advanceThroughObservations(): Promise<void> {
    for (let group = 1; group < OBSERVATION_GROUPS; group++) {
      await this.nextButton.click();
      await this.page.getByTestId(`wizard-observations-screen-${group}`).waitFor({ state: 'visible', timeout: 15_000 });
    }
  }

  /**
   * From the last observation screen: through the pit stop, answer the
   * discovery screen (money anchor with answerAllQuestions' option index,
   * every track with its first pole), then "Generate Profile →".
   */
  async generate(): Promise<void> {
    await this.toPitStop();
    await this.toDiscovery();
    await this.answerDiscovery();
    await expect(this.nextButton).toContainText('Generate Profile');
    await this.nextButton.click();
    await this.resultReport.waitFor({ state: 'visible', timeout: 20_000 });
  }

  // ── Pit stop (8) + discovery (9) ───────────────────────────────────────

  /** Last observation screen → "See Quick Read →" → the pit stop. */
  async toPitStop(): Promise<void> {
    await this.page.getByTestId(`wizard-observations-screen-${OBSERVATION_GROUPS - 1}`).waitFor({ state: 'visible', timeout: 15_000 });
    await expect(this.nextButton).toContainText('See Quick Read');
    await this.nextButton.click();
    await this.page.getByTestId('wizard-pitstop-screen').waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Pit stop → "Continue to Discovery →" → the discovery screen. */
  async toDiscovery(): Promise<void> {
    await expect(this.nextButton).toContainText('Continue to Discovery');
    await this.nextButton.click();
    await this.page.getByTestId('wizard-discovery-screen').waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Money anchor with answerAllQuestions' option index, every track with its
   * first pole. Generate is gated on all five — enabled proves they registered.
   */
  async answerDiscovery(): Promise<void> {
    await this.selectOption(MONEY_ANCHOR_QI, this.optionIndex);
    for (const track of TRACKS) {
      await this.page.getByTestId(`wizard-track-${track}-opt-0`).click();
    }
    await expect(this.nextButton).toBeEnabled();
  }

  // ── Result report ──────────────────────────────────────────────────────

  get resultReport(): Locator {
    return this.page.getByTestId('wizard-result-report');
  }

  get hero(): Locator {
    return this.page.getByTestId('result-hero');
  }

  get scoreCard(): Locator {
    return this.page.getByTestId('result-score-card');
  }

  get occupationChip(): Locator {
    return this.page.getByTestId('result-occupation-chip');
  }

  get playbook(): Locator {
    return this.page.getByTestId('result-playbook');
  }

  playbookCategory(category: PlaybookCategory): Locator {
    return this.page.getByTestId(`result-playbook-${category}`);
  }

  /** Tap-to-copy IconButton for statement `index` of `category`. */
  copyButton(category: PlaybookCategory, index: number): Locator {
    return this.page.getByTestId(`result-copy-${category}-${index}`);
  }

  /** Authed-only "Saving…/✓ Saved" line — absent for anonymous visitors. */
  get saveStatus(): Locator {
    return this.page.getByTestId('result-save-status');
  }

  /** Logged-out "keep your results" CTA card (renders after the anon save). */
  get loginCta(): Locator {
    return this.page.getByTestId('result-login-cta');
  }

  get loginCtaButton(): Locator {
    return this.page.getByTestId('result-login-cta-btn');
  }

  get csvButton(): Locator {
    return this.page.getByTestId('result-csv-btn');
  }

  get pdfButton(): Locator {
    return this.page.getByTestId('result-pdf-btn');
  }

  get resetButton(): Locator {
    return this.page.getByTestId('result-reset-btn');
  }

  /** Raw points shown on the score card's "{pts} pts" label for one DISC letter. */
  async scorePoints(letter: DiscLetter): Promise<number> {
    const row = this.page.getByTestId(`result-score-row-${letter}`);
    const text = await row.innerText();
    const match = text.match(/(\d+)\s*pts/);
    if (!match) throw new Error(`[WizardPage] no "pts" label found in score row ${letter}: ${JSON.stringify(text)}`);
    return Number(match[1]);
  }
}
