/**
 * StatusTabsHelper — click a tab whose testid lives on a StatusTabs primitive.
 *
 * StatusTabs (and TabNav) collapse into a Popover dropdown when the natural
 * tab strip overflows its container (typically on mobile-safari viewports).
 * In that mode the strip stays mounted off-screen (opacity-0, pointer-events-none)
 * so the overflow hook can keep measuring — but its testid'd buttons are
 * unclickable. The dropdown items only render in DOM when the Popover is
 * open, AND they carry the SAME `data-testid` value as the strip buttons.
 *
 * This helper transparently handles both modes:
 *   - Non-overflow → click the strip button directly.
 *   - Overflow     → open the dropdown trigger first, then click the dropdown
 *                    item (`.last()` because dropdown items follow strip items
 *                    in DOM order).
 */
import type { Page } from '@playwright/test';

export async function clickStatusTab(page: Page, testId: string): Promise<void> {
  const all = page.getByTestId(testId);
  // Probe the first match. If it carries tabindex=-1 AND opacity-0 / pointer-events-none
  // (i.e. it's the off-screen overflow strip), we open the popover trigger first
  // — StatusTabs/TabNav both expose the same `data-testid` on both the strip
  // button and the dropdown item.
  const first = all.first();
  const tabIndex = await first.getAttribute('tabindex').catch(() => null);
  const inOverflowStrip =
    tabIndex === '-1' &&
    (await first.evaluate((el) => {
      // Walk up to find a parent with `pointer-events-none` (the off-screen strip).
      let node: HTMLElement | null = el as HTMLElement;
      while (node && node !== document.body) {
        const styles = getComputedStyle(node);
        if (styles.pointerEvents === 'none') return true;
        node = node.parentElement;
      }
      return false;
    }).catch(() => false));

  if (inOverflowStrip) {
    const trigger = page.locator('[aria-haspopup="dialog"]:visible').first();
    if ((await trigger.count()) > 0) {
      await trigger.click();
      // Wait for the dropdown item to mount (popover opens, .last() should resolve).
      await page.getByTestId(testId).last().waitFor({ state: 'visible', timeout: 5_000 });
      await page.getByTestId(testId).last().click();
      return;
    }
  }
  // Strip-only (no overflow) or normal flow — direct click with scroll fallback.
  await first.scrollIntoViewIfNeeded().catch(() => {});
  await first.click({ force: true });
}
