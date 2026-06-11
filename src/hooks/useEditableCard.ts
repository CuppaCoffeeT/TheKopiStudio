/**
 * useEditableCard — generic view/edit toggle state for any card surface
 * that supports a pencil-to-edit affordance (detail-page cards, NAS folder
 * cards, claim NAS cards, etc.).
 *
 * Each card owns its own edit state locally (no global isEditing flag).
 * Returns: `mode` (`'view'` | `'edit'`), `enterEdit`, `cancel`, `commit`,
 * `isSaving`.
 *
 * Auto-save standardisation (2026-05-27): cards typically persist every
 * change on blur / value-change via `useAutoSaveForm` or direct mutation
 * calls. `cancel()` is just `setMode('view')` — no draft to reset since
 * nothing is held back. The legacy `onReset` callback is still accepted
 * for the handful of pre-auto-save cards that still hold local draft
 * state, but new code shouldn't pass it. `commit()` is retained for the
 * same reason.
 *
 * Promoted from `@/features/projects/hooks/` to `@/hooks/` on 2026-05-27
 * (was a feature back-reference from `shared/nas/NASFolderCard`).
 */

import { useCallback, useState } from 'react';

export type EditableCardMode = 'view' | 'edit';

interface UseEditableCardOptions {
  /** Reset local form/draft state — called by `cancel()`. Optional; auto-
   *  save cards leave this unset because there's nothing to reset. */
  onReset?: () => void;
}

interface UseEditableCardResult {
  mode: EditableCardMode;
  isSaving: boolean;
  enterEdit: () => void;
  cancel: () => void;
  /** Wraps an async save function; flips to view-mode on success, stays on edit on throw. */
  commit: (run: () => Promise<void>) => Promise<void>;
}

export function useEditableCard({ onReset }: UseEditableCardOptions = {}): UseEditableCardResult {
  const [mode, setMode] = useState<EditableCardMode>('view');
  const [isSaving, setIsSaving] = useState(false);

  const enterEdit = useCallback(() => setMode('edit'), []);

  const cancel = useCallback(() => {
    onReset?.();
    setMode('view');
  }, [onReset]);

  const commit = useCallback(async (run: () => Promise<void>) => {
    setIsSaving(true);
    try {
      await run();
      setMode('view');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { mode, isSaving, enterEdit, cancel, commit };
}
