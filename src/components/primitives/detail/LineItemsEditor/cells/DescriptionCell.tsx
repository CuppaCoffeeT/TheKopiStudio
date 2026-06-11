/**
 * DescriptionCell — local-draft textarea that commits to the parent on blur.
 *
 * 2026-05-28 (Phase B perf): description previously fired the parent's
 * `onPatchItem` on EVERY keystroke, which bubbled up to `setLineItems(next)`
 * and re-rendered the entire monolith tree on every character. Now keystrokes
 * stay in local state; the parent only learns about the change when the user
 * blurs the cell (or focus leaves the editor). Same UX pattern that `NumberCell`
 * already uses via `onCommit`.
 */

import { memo, useEffect, useRef, useState } from 'react';

interface DescriptionCellProps {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  textareaRef?: (el: HTMLTextAreaElement | null) => void;
}

export function autoGrowTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export const DescriptionCell = memo(function DescriptionCell({
  value,
  onCommit,
  placeholder,
  rows = 1,
  className,
  textareaRef,
}: DescriptionCellProps) {
  const [draft, setDraft] = useState(value ?? '');
  const lastExternalRef = useRef(value ?? '');

  // Re-sync draft when the parent's value changes from outside (e.g., the
  // surrounding form gets `reset()` on cancel, or another effect writes the
  // description). Skip when our own commit caused the change.
  useEffect(() => {
    if (value !== lastExternalRef.current) {
      setDraft(value ?? '');
      lastExternalRef.current = value ?? '';
    }
  }, [value]);

  return (
    <textarea
      ref={(el) => {
        textareaRef?.(el);
        autoGrowTextarea(el);
      }}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        autoGrowTextarea(e.currentTarget);
      }}
      onBlur={() => {
        if (draft !== (value ?? '')) {
          lastExternalRef.current = draft;
          onCommit(draft);
        }
      }}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  );
});
