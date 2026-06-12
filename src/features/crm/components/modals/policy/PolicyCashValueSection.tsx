/**
 * Cash-value fieldset: current cash value + dynamic age/value projection
 * rows. Incomplete rows are filtered on submit (policyFormModel
 * `fromProjectionRows`); the remove button only renders when more than one
 * row exists (legacy parity).
 */

import { Plus, Trash2 } from 'lucide-react';
import { Field, Input } from '@/components/primitives/form';
import { Button } from '@/components/primitives/shell/Button';
import { IconButton } from '@/components/primitives/IconButton';
import { ModalSection, TextField } from '../shared';
import type { ProjectionRow } from './policyFormModel';

interface PolicyCashValueSectionProps {
  currentCashValue: string;
  onCurrentCashValueChange: (next: string) => void;
  rows: ProjectionRow[];
  onRowsChange: (next: ProjectionRow[]) => void;
}

export function PolicyCashValueSection({
  currentCashValue,
  onCurrentCashValueChange,
  rows,
  onRowsChange,
}: PolicyCashValueSectionProps) {
  const updateRow = (index: number, patch: Partial<ProjectionRow>) =>
    onRowsChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <ModalSection title="Cash value" testId="crm-policy-cash-value-section">
      <TextField
        label="Current cash value (S$)"
        type="number"
        value={currentCashValue}
        onChange={onCurrentCashValueChange}
        testId="crm-policy-current-cash-input"
      />
      <Field label="Projected values by age" hint="Rows missing an age or value are dropped on save.">
        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                value={row.age}
                onChange={(e) => updateRow(index, { age: e.target.value })}
                placeholder="Age"
                aria-label={`Projection age, row ${index + 1}`}
                data-testid={`crm-policy-projection-age-input-${index}`}
                className="w-24 shrink-0"
              />
              <Input
                type="number"
                value={row.value}
                onChange={(e) => updateRow(index, { value: e.target.value })}
                placeholder="Projected value (S$)"
                aria-label={`Projected value, row ${index + 1}`}
                data-testid={`crm-policy-projection-value-input-${index}`}
              />
              {rows.length > 1 && (
                <IconButton
                  aria-label={`Remove projection row ${index + 1}`}
                  onClick={() => onRowsChange(rows.filter((_, i) => i !== index))}
                  data-testid={`crm-policy-projection-remove-btn-${index}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      </Field>
      <div>
        <Button
          variant="outline"
          size="xs"
          leadingIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => onRowsChange([...rows, { age: '', value: '' }])}
          data-testid="crm-policy-projection-add-btn"
        >
          Add row
        </Button>
      </div>
    </ModalSection>
  );
}
