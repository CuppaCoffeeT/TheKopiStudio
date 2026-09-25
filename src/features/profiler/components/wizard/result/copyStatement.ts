/**
 * Tap-to-copy for report statements. No clipboard primitive exists —
 * navigator.clipboard + showSuccess/showError (per the PRD building-blocks
 * note). Moved out of `PlaybookSection` (2026-09-25) when v6's tailored
 * follow-up became its second caller; promote to a primitive on a third.
 */

import { showError, showSuccess } from '@/utils/toastHelper';

export async function copyStatement(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Copied');
  } catch (error) {
    showError('Copy failed', error instanceof Error ? error : undefined);
  }
}
