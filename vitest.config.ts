/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/**
 * Vitest config — W07 Phase 2 test-runner wire-up.
 *
 * Unit tests for `src/**` primitives (e.g. EmptyState, ConfirmDialog, FormShell,
 * DataTable). Playwright owns the workflow / E2E layer (see `tests/workflows/`).
 *
 * - `jsdom` environment so `@testing-library/react` can mount components.
 * - Globals on — `describe/it/expect` available without imports (matches the
 *   pattern used by the Phase 1 test files that were written ahead of this).
 * - `tests/` is excluded — those are Playwright specs run by `test:e2e`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'tests', '.git'],
    css: false,
  },
});
