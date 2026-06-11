import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, ChevronDown, Search, Plus, X, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toastHelper';

// --- Types ---

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

interface SearchableSelectBaseProps {
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
  emptyMessage?: string;
  /** data-testid on the trigger button — used by Playwright specs */
  triggerTestId?: string;
}

interface SingleSelectProps extends SearchableSelectBaseProps {
  multiple?: false;
  value?: string;
  onValueChange: (value: string) => void;
  clearable?: boolean;
  values?: never;
  onValuesChange?: never;
}

interface MultiSelectProps extends SearchableSelectBaseProps {
  multiple: true;
  values: string[];
  onValuesChange: (values: string[]) => void;
  clearable?: never;
  value?: never;
  onValueChange?: never;
}

export type SearchableSelectProps = SingleSelectProps | MultiSelectProps;

// --- Component ---

const SearchableSelect = (props: SearchableSelectProps) => {
  const {
    options,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    className,
    disabled = false,
    onAddNew,
    addNewLabel = 'Add New',
    emptyMessage = 'No results found.',
    triggerTestId,
  } = props;

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isMulti = props.multiple === true;

  // Filter options by label and description
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.description && opt.description.toLowerCase().includes(term))
    );
  });

  // Sort: enabled first, disabled last
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    const aD = a.disabled ? 1 : 0;
    const bD = b.disabled ? 1 : 0;
    return aD - bD;
  });

  const handleSelect = (option: SelectOption) => {
    if (disabled) return;

    if (option.disabled) {
      if (option.disabledMessage) showError(option.disabledMessage);
      return;
    }

    if (isMulti) {
      const { values, onValuesChange } = props as MultiSelectProps;
      const isSelected = values.includes(option.value);
      const next = isSelected
        ? values.filter((v) => v !== option.value)
        : [...values, option.value];
      onValuesChange(next);
    } else {
      const { onValueChange } = props as SingleSelectProps;
      onValueChange(option.value);
      // Delay popover close to prevent mobile ghost click:
      // closing instantly causes the tap event to leak through to elements underneath
      requestAnimationFrame(() => {
        setOpen(false);
        setSearchTerm('');
      });
    }
  };

  const handleClear = (e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Force close the popover so the trigger toggle doesn't reopen it
    setOpen(false);
    if (!isMulti) {
      (props as SingleSelectProps).onValueChange('');
    }
  };

  const handleRemoveBadge = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    if (isMulti) {
      const { values, onValuesChange } = props as MultiSelectProps;
      onValuesChange(values.filter((v) => v !== val));
    }
  };

  // Build trigger display
  const renderTriggerContent = () => {
    if (isMulti) {
      const { values } = props as MultiSelectProps;
      if (values.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((val) => {
            const opt = options.find((o) => o.value === val);
            return (
              <Badge key={val} variant="secondary" className="flex items-center gap-1">
                {opt?.label || val}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={(e) => handleRemoveBadge(e, val)}
                />
              </Badge>
            );
          })}
        </div>
      );
    }

    // Single select
    const { value, clearable } = props as SingleSelectProps;
    const selected = options.find((o) => o.value === value);
    if (!selected) {
      return <span className="text-muted-foreground truncate">{placeholder}</span>;
    }
    return (
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="truncate">{selected.label}</span>
        {clearable && (
          <X
            className="h-3 w-3 shrink-0 opacity-50 hover:opacity-100 cursor-pointer"
            onPointerDown={handleClear}
          />
        )}
      </div>
    );
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-testid={triggerTestId}
          className={cn(
            'w-full justify-between min-h-[2.5rem] h-auto',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={disabled}
        >
          {renderTriggerContent()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={4}
        className={cn(
          'z-[9999] w-[--radix-popover-trigger-width] rounded-md border bg-popover text-popover-foreground shadow-md outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          'p-0'
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          {/* Search */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Options */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {sortedOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              sortedOptions.map((option) => {
                const isSelected = isMulti
                  ? (props as MultiSelectProps).values.includes(option.value)
                  : (props as SingleSelectProps).value === option.value;

                return (
                  <div
                    key={option.value}
                    data-testid={triggerTestId ? `${triggerTestId}-option-${option.value}` : undefined}
                    className={cn(
                      'relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option);
                    }}
                    title={option.disabled ? (option.disabledMessage || 'Not available') : option.label}
                  >
                    {/* Selection indicator */}
                    {isMulti ? (
                      <Checkbox
                        checked={isSelected}
                        className="mr-2 h-4 w-4"
                        tabIndex={-1}
                      />
                    ) : option.disabled ? (
                      <Ban className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <Check
                        className={cn('mr-2 h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                    )}

                    {/* Label + description */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add new */}
          {onAddNew && (
            <div className="border-t p-1">
              <div
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-primary font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddNew();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>{addNewLabel}</span>
              </div>
            </div>
          )}
        </div>
      </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};

export default SearchableSelect;
