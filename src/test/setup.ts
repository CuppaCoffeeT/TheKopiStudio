/**
 * Vitest global test setup — W07 Phase 2.
 *
 * Runs once before every test file. Brings in `@testing-library/jest-dom`
 * matchers (e.g. `toBeInTheDocument`, `toHaveAttribute`) and wires the
 * auto-cleanup hook so DOM state doesn't leak between tests.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
