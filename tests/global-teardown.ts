/**
 * Playwright globalTeardown — paired with tests/global-setup.ts.
 *
 * The profiler suite seeds no fixtures (the donor invoice fixture targeted
 * tables that don't exist in this database), so there is nothing to delete.
 * This file exists because playwright.config.ts references it, and so future
 * fixture cleanup has an obvious home.
 */
export default async function globalTeardown() {
  console.log('[global-teardown] nothing to clean up — no fixtures were seeded.');
}
