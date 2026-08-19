/**
 * LegacyFamilyPanel — who is in the picture.
 *
 * Extracted from `LegacyPlannerPage` (W23 LOC ceiling). The spouse field is
 * separate from the people list on purpose: under the Intestate Succession Act
 * a spouse is not one beneficiary among many, they are the pivot the whole
 * ladder turns on, so `calculateIsaDistribution` reads them from their own
 * field with a synthetic id.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Field, Input } from '@/components/primitives/form';
import { Button } from '@/components/primitives/shell/Button';
import { ToolPanel, ToolSelect } from '@/components/primitives/tools';
import {
  GENERATION_LABEL,
  RELATIONSHIPS,
  type Generation,
  type LegacyPlan,
  type Person,
} from '../../lib/legacy';

const GENERATIONS: Generation[] = ['elders', 'kids', 'grand', 'others'];

interface LegacyFamilyPanelProps {
  plan: LegacyPlan;
  onSpouseName: (name: string) => void;
  onAddPerson: (generation: Generation) => void;
  onUpdatePerson: (id: string, patch: Partial<Person>) => void;
  onRemovePerson: (id: string) => void;
}

export function LegacyFamilyPanel({
  plan, onSpouseName, onAddPerson, onUpdatePerson, onRemovePerson,
}: LegacyFamilyPanelProps) {
  const addPerson = onAddPerson;
  const updatePerson = onUpdatePerson;
  const removePerson = onRemovePerson;

  return (
<ToolPanel label="Family" testId="legacy-family">
  <Field label="Spouse" hint="Leave blank if none — it changes the ISA outcome entirely">
    <Input
      value={plan.spouseName}
      placeholder="Spouse name"
      onChange={(e) => onSpouseName(e.target.value)}
      className="pointer-coarse:text-[16px]"
      data-testid="legacy-spouse"
    />
  </Field>

  {GENERATIONS.map((generation) => {
    const people = plan.people.filter((p) => p.generation === generation);
    return (
      <div key={generation} className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {GENERATION_LABEL[generation]}
          </span>
          <Button
            variant="ghost"
            size="xs"
            leadingIcon={<Plus className="h-3 w-3" aria-hidden="true" />}
            onClick={() => addPerson(generation)}
            data-testid={`legacy-add-${generation}`}
          >
            Add
          </Button>
        </div>
        {people.length === 0 ? (
          <p className="m-0 text-[11.5px] text-muted-foreground">None added.</p>
        ) : (
          people.map((person) => (
            <div key={person.id} className="mb-2 flex items-center gap-2">
              <Input
                value={person.name}
                placeholder="Name"
                onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                className="flex-1 pointer-coarse:text-[16px]"
                aria-label="Name"
                data-testid={`legacy-person-name-${person.id}`}
              />
              <ToolSelect
                value={person.relationship}
                onChange={(rel) => updatePerson(person.id, { relationship: rel })}
                ariaLabel="Relationship"
                options={RELATIONSHIPS[generation].map((rel) => ({ value: rel, label: rel }))}
                className="w-[150px] flex-none"
                testId={`legacy-person-rel-${person.id}`}
              />
              <Button
                variant="ghost"
                size="xs"
                className="flex-none text-destructive"
                aria-label={`Remove ${person.name || 'person'}`}
                onClick={() => removePerson(person.id)}
                data-testid={`legacy-person-remove-${person.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          ))
        )}
      </div>
    );
  })}
</ToolPanel>
  );
}
