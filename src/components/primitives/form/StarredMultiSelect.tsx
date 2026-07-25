/**
 * StarredMultiSelect — multi-select picker + selected-pill row with an optional
 * "star one as primary" affordance. Pure presentation; caller wires data + handlers.
 *
 * Spec: docs/01-system-architecture/SEARCHABLE_SELECT_COMPONENT.md (§ StarredMultiSelect)
 * Built on top of `SearchableMultiSelect` (W08 S2 primitive). Adds:
 *   - Selected-pill row above the picker with each pill carrying a star button
 *     that toggles a single "primary" value (mutually exclusive — selecting a new
 *     star de-stars the previous one).
 *   - Optional remove (X) per pill.
 *
 * Use when the caller needs to mark ONE option in a multi-select as primary
 * (e.g. "Primary PIC" among many client contacts, "Default supervisor" among
 * many assigned, etc.). Domain wrappers should live at `@/components/ui/<name>`
 * (alongside `staff-select`, `company-select`).
 */

import { Star, X } from 'lucide-react';
import { Badge } from '../shell/Badge';
import { SearchableMultiSelect, type SMSOption } from '../overlays/SearchableMultiSelect';
import { cn } from '@/lib/utils';

interface StarredMultiSelectProps {
  /** All available options. Selection comes from `values`. */
  options: SMSOption[];
  /** Currently selected option `value`s. */
  values: string[];
  onValuesChange: (next: string[]) => void;

  /**
   * Optional "primary" — exactly zero or one of `values`. Pass both to enable
   * the star toggle on pills. Omit `onPrimaryChange` for a read-only primary
   * indicator.
   */
  primaryValue?: string | null;
  onPrimaryChange?: (next: string | null) => void;

  placeholder?: string;
  disabled?: boolean;
  /** Show a "Create new {query}" row inside the picker (forwarded to SearchableMultiSelect). */
  onCreateNew?: (query: string) => void;
  createLabelPrefix?: string;
  triggerTestId?: string;
  optionTestIdPrefix?: string;

  className?: string;
}

export function StarredMultiSelect({
  options,
  values,
  onValuesChange,
  primaryValue = null,
  onPrimaryChange,
  placeholder,
  disabled = false,
  onCreateNew,
  createLabelPrefix,
  triggerTestId,
  optionTestIdPrefix,
  className,
}: StarredMultiSelectProps) {
  const starEnabled = !!onPrimaryChange;
  const byValue = new Map(options.map((o) => [o.value, o]));

  const handleRemove = (value: string) => {
    const next = values.filter((v) => v !== value);
    // If we just removed the primary, promote the first remaining (mirrors the
    // common "default to first contact" UX from per-project Primary PIC).
    if (starEnabled && primaryValue === value && next.length > 0) {
      onPrimaryChange?.(next[0]);
    } else if (starEnabled && primaryValue === value) {
      onPrimaryChange?.(null);
    }
    onValuesChange(next);
  };

  const handleToggleStar = (value: string) => {
    if (!starEnabled) return;
    onPrimaryChange?.(primaryValue === value ? null : value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected pills row */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => {
            const opt = byValue.get(value);
            if (!opt) return null;
            const isPrimary = starEnabled && primaryValue === value;
            return (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-2 px-3 py-1"
              >
                {starEnabled && (
                  <button
                    type="button"
                    onClick={() => handleToggleStar(value)}
                    aria-label={isPrimary ? `Unset primary: ${opt.label}` : `Set as primary: ${opt.label}`}
                    aria-pressed={isPrimary}
                    title={isPrimary ? 'Primary' : 'Set as primary'}
                    className={cn(
                      'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                      isPrimary
                        ? 'text-[color:var(--brand-brown)]'
                        : 'text-muted-foreground hover:text-[color:var(--brand-brown)]',
                    )}
                  >
                    {/* Primary is carried by the filled/outlined star shape as well as colour. */}
                    <Star className={cn('h-3 w-3', isPrimary && 'fill-current')} aria-hidden="true" />
                  </button>
                )}
                <span className="text-sm">
                  {opt.label}
                  {opt.description && (
                    <span className="text-muted-foreground"> · {opt.description}</span>
                  )}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(value)}
                    aria-label={`Remove ${opt.label}`}
                    className="ml-1 text-muted-foreground hover:text-[color:var(--negative-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Picker — pills are rendered above by this component, so suppress the
          inner picker's own pill row in the trigger to avoid the duplicate. */}
      <SearchableMultiSelect
        options={options}
        values={values}
        onValuesChange={onValuesChange}
        placeholder={placeholder}
        disabled={disabled}
        onCreateNew={onCreateNew}
        createLabelPrefix={createLabelPrefix}
        triggerTestId={triggerTestId}
        optionTestIdPrefix={optionTestIdPrefix}
        hideSelectedPills
      />
    </div>
  );
}
