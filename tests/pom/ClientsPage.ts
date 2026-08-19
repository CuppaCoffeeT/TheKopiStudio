import { expect, type Locator, type Page } from '@playwright/test';
import { chooseSelectMenuOption } from './selectMenu';
import { selectStatusTab } from './statusTabs';

/** Mirrors MONTHS_SHORT in src/components/primitives/form/DatePicker.helpers.ts. */
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ClientsPage — POM for the CRM module: the /clients list, the client detail
 * page (Overview · Policies · Activity · Bank history tabs) and the four
 * CRM form modals (ClientFormModal / PolicyFormModal / InteractionFormModal /
 * BankBalanceModal).
 *
 * All selectors are real data-testids read from:
 *   src/features/crm/pages/{ClientsListPage,ClientDetailPage}.tsx
 *   src/features/crm/components/detail/{ListSection,RowActions,ClientDetailActions,
 *     OverviewTab,PoliciesTab,ActivityTab,BankHistoryTab}.tsx
 *   src/features/crm/components/modals/{ClientFormModal,PolicyFormModal,
 *     InteractionFormModal,BankBalanceModal,shared}.tsx (+ client/ and policy/ sections)
 *
 * Conventions baked in:
 * - The list mounts BOTH the desktop table rows and the mobile cards (one
 *   hidden per viewport via CSS) — row lookups always filter `:visible`.
 * - The detail hero actions render twice (hero + sticky mobile bar) with a
 *   `-mobile` testid suffix — `detailButton` targets the visible one.
 * - TabNav collapses to a Popover dropdown when the strip overflows (mobile);
 *   `switchTab` routes through `selectStatusTab` (direct click → dropdown
 *   fallback, see tests/lessons.md 2026-06-01 StatusTabs entry).
 * - DatePicker single-mode triggers are TYPEABLE inputs (dd/mm/yyyy commits on
 *   Enter) — `fillDateField` types and verifies the committed dd/mm/yy display.
 * - Checkbox primitives keep the real `<input>` sr-only; `setCheckbox` clicks
 *   the wrapping visible label (WebKit ignores forced clicks on the clipped
 *   input) and then verifies the input's checked state.
 */

/** ClientFormModal fields — every field optional so edits can patch one field. */
export interface ClientFormInput {
  name?: string;
  email?: string;
  phone?: string;
  /** ISO 'YYYY-MM-DD'. */
  dateOfBirth?: string;
  occupation?: string;
  annualIncome?: string;
  /** 'Conservative' | 'Moderate' | 'Aggressive'. */
  riskProfile?: string;
  notes?: string;
  /** ISO 'YYYY-MM-DD' ("Client since"). */
  createdDate?: string;
  /** ISO 'YYYY-MM-DD'. */
  nextReviewDate?: string;
  /** 'Quarterly' | 'Semi-Annual' | 'Annual'. */
  reviewFrequency?: string;
  /** ADD mode only — the input is not rendered in edit mode (derived column). */
  totalBankBalance?: string;
  cpfOA?: string;
  cpfSA?: string;
  cpfMA?: string;
}

export interface ProjectionRowInput {
  age: string;
  value: string;
}

/** ILP fieldset — only rendered once the ILP checkbox is ticked. */
export interface PolicyIlpInput {
  currentAccountValue?: string;
  investmentAllocation?: string;
  illustratedValueAge55?: string;
  illustratedValueAge65?: string;
  /** Option VALUE: '0' | '30' | '50' | '100'. */
  ilpPremiumInclusionPercent?: string;
}

/** Hospitalization fieldset — rendered after the type switch to 'Hospitalization'. */
export interface PolicyHospitalInput {
  /** e.g. 'Private' | 'Public - Class A' | 'Public - Class B1' | 'Public - Class B2/C'. */
  hospitalType?: string;
  integratedShieldCPF?: string;
  integratedShieldCash?: string;
  riderCash?: string;
}

export interface PolicyFormInput {
  /** Picking 'Hospitalization' one-way forces premium/coverage to '0' and swaps in the amber section. */
  type?: string;
  provider?: string;
  policyNumber?: string;
  /** ISO 'YYYY-MM-DD'. */
  startDate?: string;
  /** ISO 'YYYY-MM-DD'. */
  endDate?: string;
  /** 'Active' | 'Pending' | 'Lapsed' | 'Cancelled'. */
  status?: string;
  premium?: string;
  /** 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual'. */
  frequency?: string;
  /** Death benefit. Filled BEFORE `tpdSameAsDeath` (the copy is one-shot, not reactive). */
  coverageAmount?: string;
  tpdCoverage?: string;
  tpdSameAsDeath?: boolean;
  criticalIllnessCoverage?: string;
  ciNotes?: string;
  earlyCriticalIllnessCoverage?: string;
  eciNotes?: string;
  /** Ticking reveals the cash-value section (current value + projection rows). */
  hasCashValue?: boolean;
  currentCashValue?: string;
  /** Row 0 always exists; extra rows are added via the "Add row" button. */
  projections?: ProjectionRowInput[];
  /** Presence ticks the ILP checkbox and fills the investment fieldset. */
  investmentLinked?: PolicyIlpInput;
  /** Presence fills the hospitalization fieldset (requires type 'Hospitalization'). */
  hospital?: PolicyHospitalInput;
}

export interface InteractionFormInput {
  /** ISO 'YYYY-MM-DD'. */
  date?: string;
  /** 'Meeting' | 'Phone Call' | 'Email' | 'Follow-up' | 'Policy Review'. */
  type?: string;
  notes?: string;
  /** ISO 'YYYY-MM-DD' follow-up reminder. */
  followUp?: string;
}

export interface BankFormInput {
  /** ISO 'YYYY-MM-DD'. */
  date?: string;
  balance?: string;
  notes?: string;
}

/**
 * `interactions` is kept as the KEY for the third tab even though the tab is
 * now labelled "Activity" (2026-08-18). The key names the CHILD LIST the specs
 * seed and clean up — `public.interactions` — which is unchanged; only the
 * surface that renders it was replaced. Renaming the key would have touched
 * every cleanup loop in the suite for no behaviour.
 */
export type ClientDetailTab = 'overview' | 'policies' | 'interactions' | 'bank';

/**
 * `testId` is explicit rather than derived from the key: the third tab's key is
 * still `interactions` (it names the CHILD LIST the specs seed and clean up)
 * while the tab itself became "Activity" in 2026-08-18. Deriving
 * `clients-detail-tab-${key}` silently pointed at a testid that no longer
 * exists and cost a 15s timeout to diagnose.
 */
const DETAIL_TABS: Record<ClientDetailTab, { label: RegExp; content: string; testId: string }> = {
  overview: { label: /^Overview/, content: 'clients-detail-overview', testId: 'clients-detail-tab-overview' },
  policies: { label: /^Policies/, content: 'clients-policies', testId: 'clients-detail-tab-policies' },
  interactions: { label: /^Activity/, content: 'clients-activity', testId: 'clients-detail-tab-activity' },
  bank: { label: /^Bank history/, content: 'clients-bank', testId: 'clients-detail-tab-bank' },
};

/** Child-list testid families on the detail tabs (rows / row actions / confirm dialogs). */
const CHILD_LISTS = {
  policies: {
    section: 'clients-policies',
    rowPrefix: 'clients-policy-row-',
    editPrefix: 'clients-policy-edit-btn-',
    deletePrefix: 'clients-policy-delete-btn-',
    dialog: 'clients-policy-delete-dialog',
  },
  interactions: {
    // The manual rows inside the Activity tab. Automatic entries render as
    // `clients-activity-row-*` and have no actions — see ActivityTab.
    section: 'clients-activity',
    rowPrefix: 'clients-interaction-row-',
    editPrefix: 'clients-interaction-edit-btn-',
    deletePrefix: 'clients-interaction-delete-btn-',
    dialog: 'clients-interaction-delete-dialog',
  },
  bank: {
    section: 'clients-bank',
    rowPrefix: 'clients-bank-row-',
    editPrefix: 'clients-bank-edit-btn-',
    deletePrefix: 'clients-bank-delete-btn-',
    dialog: 'clients-bank-delete-dialog',
  },
} as const;

export type ClientChildList = keyof typeof CHILD_LISTS;

/** Mirror of the modals' option→testid slug (modals/shared.tsx `optionTestId`). */
function optionSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ClientsPage {
  constructor(readonly page: Page) {}

  // ── List (/clients) ──────────────────────────────────────────────────────

  async gotoList(): Promise<void> {
    await this.page.goto('/clients');
    await this.page.getByTestId('clients-table').waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Desktop button + mobile FloatingCTA share the testid — target the visible one. */
  get addClientButton(): Locator {
    return this.page.locator('[data-testid="clients-add-client-btn"]:visible').first();
  }

  /**
   * Open the ADD-client form.
   *
   * Since the customer-centred IA landed (2026-07-28) the list's primary action
   * opens a FORK first — "start with the Prospect Profiler" or "create an empty
   * profile" — because under that IA a customer is normally created BY profiling
   * them. Every journey that just wants the plain form goes through here so the
   * extra click lives in exactly one place.
   */
  async openAddClientForm(): Promise<void> {
    await this.addClientButton.click();
    await this.page
      .getByTestId('crm-add-customer-choice-modal')
      .waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.getByTestId('crm-add-customer-choice-empty').click();
    await this.clientModal.waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Desktop table rows OR mobile cards — whichever rendering is visible. */
  visibleRows(): Locator {
    return this.page.locator(
      '[data-testid^="clients-row-"]:visible, [data-testid^="clients-mobile-card-"]:visible',
    );
  }

  /**
   * Drive the server-side search and wait for the debounced (350ms) term to
   * land in the URL — counting rows before that reads the UNFILTERED list.
   */
  async search(term: string): Promise<void> {
    await this.page.getByTestId('clients-search').fill(term);
    await this.page.waitForURL((url) => url.searchParams.get('search') === term);
  }

  /** Trailing UUID of a row/card/child-row testid. */
  async idFromRow(row: Locator): Promise<string> {
    const testId = await row.getAttribute('data-testid');
    const match = testId?.match(UUID_RE);
    if (!match) throw new Error(`[ClientsPage] no UUID in data-testid ${JSON.stringify(testId)}`);
    return match[0];
  }

  /** Search → exactly one row → open it → detail loaded. Returns the client id. */
  async openClientByName(name: string): Promise<string> {
    await this.search(name);
    await expect.poll(() => this.visibleRows().count(), { timeout: 30_000 }).toBe(1);
    const row = this.visibleRows().first();
    const id = await this.idFromRow(row);
    await row.click();
    await this.page.waitForURL(`**/clients/${id}`, { timeout: 30_000 });
    await this.waitForDetail();
    return id;
  }

  // ── Detail (/clients/:id) ────────────────────────────────────────────────

  /** Fresh detail navigations always land on the Overview tab. */
  async waitForDetail(): Promise<void> {
    await this.page.getByTestId('clients-detail').waitFor({ state: 'visible', timeout: 30_000 });
    await this.page
      .getByTestId('clients-detail-overview')
      .waitFor({ state: 'visible', timeout: 30_000 });
  }

  /**
   * Switch detail tab, responsive-safe: direct strip click on desktop; on
   * overflow (mobile) the strip is pointer-events-none, so fall back to the
   * TabNav dropdown (options carry no testids — matched by role+label).
   */
  async switchTab(tab: ClientDetailTab): Promise<void> {
    const cfg = DETAIL_TABS[tab];
    await selectStatusTab(this.page, this.page.getByTestId(cfg.testId), (popover) =>
      popover.getByRole('tab', { name: cfg.label }),
    );
    await this.page.getByTestId(cfg.content).waitFor({ state: 'visible', timeout: 30_000 });
  }

  /** Hero action (desktop) or sticky mobile-bar action — the visible twin. */
  detailButton(base: string): Locator {
    return this.page
      .locator(`[data-testid="${base}"]:visible, [data-testid="${base}-mobile"]:visible`)
      .first();
  }

  /** Header follow-up pill (earliest future interaction follow-up, else next review). */
  get followUpBadge(): Locator {
    return this.page.getByTestId('clients-detail-follow-up-badge');
  }

  /** Overview tab's derived `total_bank_balance` (owned by the bank recompute). */
  get overviewTotalBalance(): Locator {
    return this.page.getByTestId('clients-detail-total-balance');
  }

  /** Bank-history header's derived current total (same column, same recompute). */
  get bankCurrentTotal(): Locator {
    return this.page.getByTestId('clients-bank-current-total');
  }

  get policiesAddButton(): Locator {
    return this.page.getByTestId('clients-policies-add-btn');
  }

  get interactionsAddButton(): Locator {
    return this.page.getByTestId('clients-interactions-add-btn');
  }

  get bankAddButton(): Locator {
    return this.page.getByTestId('clients-bank-add-btn');
  }

  /** All rows of one child list (plain `<li>`s — identical on both viewports). */
  childRows(kind: ClientChildList): Locator {
    return this.page.locator(`[data-testid^="${CHILD_LISTS[kind].rowPrefix}"]`);
  }

  childEditButton(kind: ClientChildList, id: string): Locator {
    return this.page.getByTestId(`${CHILD_LISTS[kind].editPrefix}${id}`);
  }

  childDeleteButton(kind: ClientChildList, id: string): Locator {
    return this.page.getByTestId(`${CHILD_LISTS[kind].deletePrefix}${id}`);
  }

  /** Click the confirm button of a DestructiveConfirmDialog and wait for it to close. */
  async confirmDelete(dialogTestId: string): Promise<void> {
    await expect(this.page.getByTestId(dialogTestId)).toBeVisible();
    await this.page.getByTestId(`${dialogTestId}-confirm-btn`).click();
    await this.page
      .getByTestId(dialogTestId)
      .waitFor({ state: 'hidden', timeout: 20_000 });
  }

  /**
   * Soft-delete every row of one child tab through the UI (row delete →
   * confirm), then assert the tab's empty state. Idempotent — an already-empty
   * tab just asserts the empty state.
   */
  async deleteAllChildRows(kind: ClientChildList): Promise<void> {
    const cfg = CHILD_LISTS[kind];
    await this.switchTab(kind);
    // Let the list settle into rows or the empty state (never act on the skeleton).
    await this.page
      .locator(`[data-testid^="${cfg.rowPrefix}"], [data-testid="${cfg.section}-empty"]`)
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
    const rows = this.childRows(kind);
    while ((await rows.count()) > 0) {
      const id = await this.idFromRow(rows.first());
      await this.childDeleteButton(kind, id).click();
      await this.confirmDelete(cfg.dialog);
      await this.page
        .getByTestId(`${cfg.rowPrefix}${id}`)
        .waitFor({ state: 'detached', timeout: 20_000 });
    }
    await expect(this.page.getByTestId(`${cfg.section}-empty`)).toBeVisible({ timeout: 15_000 });
  }

  /** Soft-delete the client via the detail dialog; lands back on /clients. */
  async deleteClientFromDetail(): Promise<void> {
    await this.detailButton('clients-detail-delete-btn').click();
    await this.confirmDelete('clients-detail-delete-dialog');
    await this.page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
  }

  // ── ClientFormModal ──────────────────────────────────────────────────────

  get clientModal(): Locator {
    return this.page.getByTestId('crm-client-form-modal');
  }

  async fillClientForm(input: ClientFormInput): Promise<void> {
    if (input.name !== undefined) await this.fillText('crm-client-name-input', input.name);
    if (input.email !== undefined) await this.fillText('crm-client-email-input', input.email);
    if (input.phone !== undefined) await this.fillText('crm-client-phone-input', input.phone);
    if (input.dateOfBirth !== undefined) {
      await this.fillDateField('crm-client-dob-input', input.dateOfBirth, 'long');
    }
    if (input.occupation !== undefined) {
      await this.fillText('crm-client-occupation-input', input.occupation);
    }
    if (input.annualIncome !== undefined) {
      await this.fillText('crm-client-income-input', input.annualIncome);
    }
    if (input.riskProfile !== undefined) {
      await this.choose('crm-client-risk-select', input.riskProfile);
    }
    if (input.notes !== undefined) await this.fillText('crm-client-notes-textarea', input.notes);
    if (input.createdDate !== undefined) {
      await this.fillDateField('crm-client-since-input', input.createdDate);
    }
    if (input.nextReviewDate !== undefined) {
      await this.fillDateField('crm-client-next-review-input', input.nextReviewDate);
    }
    if (input.reviewFrequency !== undefined) {
      await this.choose('crm-client-frequency-select', input.reviewFrequency);
    }
    if (input.totalBankBalance !== undefined) {
      await this.fillText('crm-client-balance-input', input.totalBankBalance);
    }
    if (input.cpfOA !== undefined) await this.fillText('crm-client-cpf-oa-input', input.cpfOA);
    if (input.cpfSA !== undefined) await this.fillText('crm-client-cpf-sa-input', input.cpfSA);
    if (input.cpfMA !== undefined) await this.fillText('crm-client-cpf-ma-input', input.cpfMA);
  }

  async submitClientForm(): Promise<void> {
    await this.page.getByTestId('crm-client-save-btn').click();
    await this.clientModal.waitFor({ state: 'hidden', timeout: 20_000 });
  }

  // ── PolicyFormModal ──────────────────────────────────────────────────────

  get policyModal(): Locator {
    return this.page.getByTestId('crm-policy-form-modal');
  }

  async fillPolicyForm(input: PolicyFormInput): Promise<void> {
    if (input.type !== undefined) await this.choose('crm-policy-type-select', input.type);
    if (input.provider !== undefined) {
      await this.fillText('crm-policy-provider-input', input.provider);
    }
    if (input.policyNumber !== undefined) {
      await this.fillText('crm-policy-number-input', input.policyNumber);
    }
    if (input.startDate !== undefined) {
      await this.fillDateField('crm-policy-start-input', input.startDate);
    }
    if (input.endDate !== undefined) {
      await this.fillDateField('crm-policy-end-input', input.endDate);
    }
    if (input.status !== undefined) await this.choose('crm-policy-status-select', input.status);

    if (input.premium !== undefined) await this.fillText('crm-policy-premium-input', input.premium);
    if (input.frequency !== undefined) {
      await this.choose('crm-policy-frequency-select', input.frequency);
    }
    // Death benefit BEFORE the TPD copy checkbox — the copy is one-shot.
    if (input.coverageAmount !== undefined) {
      await this.fillText('crm-policy-coverage-input', input.coverageAmount);
    }
    if (input.tpdSameAsDeath !== undefined) {
      await this.setCheckbox('crm-policy-tpd-same-checkbox', input.tpdSameAsDeath);
    }
    if (input.tpdCoverage !== undefined) {
      await this.fillText('crm-policy-tpd-input', input.tpdCoverage);
    }
    if (input.criticalIllnessCoverage !== undefined) {
      await this.fillText('crm-policy-ci-input', input.criticalIllnessCoverage);
    }
    if (input.ciNotes !== undefined) await this.fillText('crm-policy-ci-notes-input', input.ciNotes);
    if (input.earlyCriticalIllnessCoverage !== undefined) {
      await this.fillText('crm-policy-eci-input', input.earlyCriticalIllnessCoverage);
    }
    if (input.eciNotes !== undefined) {
      await this.fillText('crm-policy-eci-notes-input', input.eciNotes);
    }

    if (input.hasCashValue !== undefined) {
      await this.setCheckbox('crm-policy-has-cash-value-checkbox', input.hasCashValue);
    }
    if (input.hasCashValue) {
      await this.page
        .getByTestId('crm-policy-cash-value-section')
        .waitFor({ state: 'visible', timeout: 10_000 });
      if (input.currentCashValue !== undefined) {
        await this.fillText('crm-policy-current-cash-input', input.currentCashValue);
      }
      if (input.projections) {
        for (let i = 0; i < input.projections.length; i++) {
          // Add mode opens with exactly one blank row; grow for the rest.
          if (i > 0) await this.page.getByTestId('crm-policy-projection-add-btn').click();
          await this.fillText(`crm-policy-projection-age-input-${i}`, input.projections[i].age);
          await this.fillText(`crm-policy-projection-value-input-${i}`, input.projections[i].value);
        }
      }
    }

    if (input.investmentLinked) {
      await this.setCheckbox('crm-policy-ilp-checkbox', true);
      await this.page
        .getByTestId('crm-policy-ilp-section')
        .waitFor({ state: 'visible', timeout: 10_000 });
      const ilp = input.investmentLinked;
      if (ilp.currentAccountValue !== undefined) {
        await this.fillText('crm-policy-account-value-input', ilp.currentAccountValue);
      }
      if (ilp.investmentAllocation !== undefined) {
        await this.fillText('crm-policy-allocation-input', ilp.investmentAllocation);
      }
      if (ilp.illustratedValueAge55 !== undefined) {
        await this.fillText('crm-policy-illustrated-55-input', ilp.illustratedValueAge55);
      }
      if (ilp.illustratedValueAge65 !== undefined) {
        await this.fillText('crm-policy-illustrated-65-input', ilp.illustratedValueAge65);
      }
      if (ilp.ilpPremiumInclusionPercent !== undefined) {
        await this.choose('crm-policy-ilp-percent-select', ilp.ilpPremiumInclusionPercent);
      }
    }

    if (input.hospital) {
      // The type switch swaps in the amber hospitalization fieldset.
      await this.page
        .getByTestId('crm-policy-hospital-section')
        .waitFor({ state: 'visible', timeout: 10_000 });
      const hospital = input.hospital;
      if (hospital.hospitalType !== undefined) {
        await this.choose('crm-policy-hospital-type-select', hospital.hospitalType);
      }
      if (hospital.integratedShieldCPF !== undefined) {
        await this.fillText('crm-policy-shield-cpf-input', hospital.integratedShieldCPF);
      }
      if (hospital.integratedShieldCash !== undefined) {
        await this.fillText('crm-policy-shield-cash-input', hospital.integratedShieldCash);
      }
      if (hospital.riderCash !== undefined) {
        await this.fillText('crm-policy-rider-cash-input', hospital.riderCash);
      }
    }
  }

  async submitPolicyForm(): Promise<void> {
    await this.page.getByTestId('crm-policy-save-btn').click();
    await this.policyModal.waitFor({ state: 'hidden', timeout: 20_000 });
  }

  // ── InteractionFormModal ─────────────────────────────────────────────────

  get interactionModal(): Locator {
    return this.page.getByTestId('crm-interaction-form-modal');
  }

  async fillInteractionForm(input: InteractionFormInput): Promise<void> {
    if (input.date !== undefined) await this.fillDateField('crm-interaction-date-input', input.date);
    if (input.type !== undefined) await this.choose('crm-interaction-type-select', input.type);
    if (input.notes !== undefined) {
      await this.fillText('crm-interaction-notes-textarea', input.notes);
    }
    if (input.followUp !== undefined) {
      await this.fillDateField('crm-interaction-follow-up-input', input.followUp);
    }
  }

  async submitInteractionForm(): Promise<void> {
    await this.page.getByTestId('crm-interaction-save-btn').click();
    await this.interactionModal.waitFor({ state: 'hidden', timeout: 20_000 });
  }

  // ── BankBalanceModal ─────────────────────────────────────────────────────

  get bankModal(): Locator {
    return this.page.getByTestId('crm-bank-form-modal');
  }

  async fillBankForm(input: BankFormInput): Promise<void> {
    if (input.date !== undefined) await this.fillDateField('crm-bank-date-input', input.date);
    if (input.balance !== undefined) await this.fillText('crm-bank-balance-input', input.balance);
    if (input.notes !== undefined) await this.fillText('crm-bank-notes-textarea', input.notes);
  }

  async submitBankForm(): Promise<void> {
    await this.page.getByTestId('crm-bank-save-btn').click();
    await this.bankModal.waitFor({ state: 'hidden', timeout: 20_000 });
  }

  // ── Shared field drivers ─────────────────────────────────────────────────

  private async fillText(testId: string, value: string): Promise<void> {
    await this.page.getByTestId(testId).fill(value);
  }

  /** SelectMenu via the per-option testid (`<trigger>-opt-<slug>`, shared.tsx contract). */
  private async choose(trigger: string, optionValue: string): Promise<void> {
    await chooseSelectMenuOption(this.page, {
      trigger,
      optionTestId: `${trigger}-opt-${optionSlug(optionValue)}`,
    });
  }

  /**
   * Type an ISO date into a single-mode DatePicker trigger input (dd/mm/yyyy),
   * commit with Enter (also closes the calendar) and verify the committed
   * display — an invalid parse would silently revert.
   *
   * `long` fields (date of birth) echo "15 Mar 1986"; the rest echo dd/mm/yy.
   */
  private async fillDateField(
    testId: string,
    iso: string,
    display: 'short' | 'long' = 'short',
  ): Promise<void> {
    const [y, m, d] = iso.split('-');
    const input = this.page.getByTestId(testId);
    await input.fill(`${d}/${m}/${y}`);
    await input.press('Enter');
    const expected =
      display === 'long' ? `${d} ${MONTHS_SHORT[Number(m) - 1]} ${y}` : `${d}/${m}/${y.slice(2)}`;
    await expect(input).toHaveValue(expected);
  }

  /**
   * The Checkbox primitive keeps its real `<input>` sr-only (1px, clipped), so
   * a forced click on it never lands on WebKit ("did not change its state").
   * Click the wrapping visible `<label>` instead, then verify the input state.
   */
  private async setCheckbox(testId: string, checked: boolean): Promise<void> {
    const input = this.page.getByTestId(testId);
    if ((await input.isChecked()) === checked) return;
    await input.locator('xpath=ancestor::label[1]').click();
    if (checked) await expect(input).toBeChecked();
    else await expect(input).not.toBeChecked();
  }
}
