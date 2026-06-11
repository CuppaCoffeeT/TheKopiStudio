
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CountBadge } from '@/components/ui/count-badge';

interface MultiSelectCheckboxProps {
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  title: string;
  counts?: Record<string, number>;
}

export const MultiSelectCheckbox = ({
  options,
  selectedValues,
  onSelectionChange,
  title,
  counts
}: MultiSelectCheckboxProps) => {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, value]);
    } else {
      onSelectionChange(selectedValues.filter(v => v !== value));
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(options.map(opt => opt.value));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{title}</Label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {selectedValues.length === options.length ? 'Clear All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${title}-${option.value}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={(checked) => 
                handleCheckboxChange(option.value, checked as boolean)
              }
            />
            <Label 
              htmlFor={`${title}-${option.value}`}
              className="text-sm font-normal cursor-pointer flex items-center flex-1"
            >
              {option.label}
              {counts && counts[option.value] !== undefined && (
                <CountBadge count={counts[option.value]} />
              )}
            </Label>
          </div>
        ))}
      </div>
      {selectedValues.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedValues.length} of {options.length} selected
        </div>
      )}
    </div>
  );
};
