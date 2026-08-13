/**
 * Accessibility evidence runner — the single axe entry point for the suite.
 *
 * Extracted 2026-08-13 from three byte-identical copies of `expectWcag2aaClean`
 * (crm/load-a11y · profiler/load-a11y · reports/access-a11y) and two of
 * `settleAnimations`. They had already drifted in one respect that mattered:
 * only the modal scans settled animations first, so every LIST scan was racing
 * a row fade-in. See the note on settleAnimations below.
 */
import { injectAxe, checkA11y } from 'axe-playwright';
import type { Locator, Page } from '@playwright/test';

/**
 * Wait for every FINITE animation under `root` to finish.
 *
 * axe computes color-contrast on the alpha-blended colors it sees AT SCAN
 * TIME, so a scan that lands mid-fade reports phantom `serious` violations on
 * text that is perfectly legible once opaque (white-on-slate-800 "failing" at
 * 3.26:1 — verified empirically on a Modal's 150ms fade-in/zoom-in).
 *
 * Infinite animations (pulse skeletons) are skipped — awaiting them would hang,
 * and the specs already wait skeletons out via testids.
 */
export async function settleAnimations(root: Locator): Promise<void> {
  await root.evaluate(async (el) => {
    const finite = el
      .getAnimations({ subtree: true })
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity);
    await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  });
}

/**
 * Inject axe and assert ZERO critical/serious violations against the WCAG 2.0
 * A+AA rule set (the `wcag2aa` tag alone holds only the AA-specific rules — AA
 * conformance requires the A-level `wcag2a` rules too). Failures print the
 * detailed per-node terminal report (impact, selector, offending HTML).
 *
 * Settles the whole page's animations FIRST. This is not belt-and-braces: rows
 * in ExpandableDataTable carry `motion-safe:animate-[fade-in-up_200ms_…]`, and
 * the list scans used to race it. Against the live remote Supabase the race was
 * invisible — network latency on the in-flight auth/modules queries reliably
 * pushed the scan past the 200ms window — so it only surfaced when CI moved to
 * an ephemeral LOCAL database and every query started resolving in single-digit
 * milliseconds: five list/detail a11y specs went red at once, all of them
 * color-contrast, all on ordinary `--fg-dim` table text. Making the DB fast
 * turned a latent race into a deterministic failure; settling here fixes it at
 * the one place every scan goes through.
 */
export async function expectWcag2aaClean(page: Page): Promise<void> {
  await settleAnimations(page.locator('body'));
  await injectAxe(page);
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
    includedImpacts: ['critical', 'serious'],
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
  });
}
