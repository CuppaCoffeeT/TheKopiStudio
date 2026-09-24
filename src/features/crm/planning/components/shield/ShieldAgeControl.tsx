/**
 * Age next birthday — stepper, typed field and slider bound to one value.
 *
 * The typed field keeps its own draft so an advisor can clear it and type "4"
 * on the way to "45" without the tool snapping to 4 mid-keystroke: only a
 * value inside 1–100 is committed live, and blur clamps whatever is left.
 */

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { clampShieldAge, SHIELD_MAX_AGE, SHIELD_MIN_AGE } from '../../lib/shieldPremium';

interface ShieldAgeControlProps {
  age: number;
  onAge: (next: number) => void;
}

const STEP_BUTTON =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-popover text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40';

export function ShieldAgeControl({ age, onAge }: ShieldAgeControlProps) {
  const [draft, setDraft] = useState(String(age));
  useEffect(() => setDraft(String(age)), [age]);

  const commitTyped = (raw: string) => {
    setDraft(raw);
    const value = Number(raw);
    if (Number.isInteger(value) && value >= SHIELD_MIN_AGE && value <= SHIELD_MAX_AGE) onAge(value);
  };

  return (
    <div className="border-b border-border pb-5" data-testid="shield-age">
      <div className="flex items-center gap-4">
        <label htmlFor="shield-age-input" className="flex-1 text-[13.5px] text-[color:var(--fg-dim)]">
          Age next birthday
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={STEP_BUTTON}
            aria-label="Lower the age"
            disabled={age <= SHIELD_MIN_AGE}
            onClick={() => onAge(clampShieldAge(age - 1))}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <input
            id="shield-age-input"
            type="number"
            inputMode="numeric"
            min={SHIELD_MIN_AGE}
            max={SHIELD_MAX_AGE}
            value={draft}
            onChange={(event) => commitTyped(event.target.value)}
            onBlur={() => onAge(clampShieldAge(Number(draft)))}
            className="h-11 w-[74px] rounded-lg border border-border bg-popover text-center text-[20px] font-semibold text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="shield-age-input"
          />
          <button
            type="button"
            className={STEP_BUTTON}
            aria-label="Raise the age"
            disabled={age >= SHIELD_MAX_AGE}
            onClick={() => onAge(clampShieldAge(age + 1))}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={SHIELD_MIN_AGE}
        max={SHIELD_MAX_AGE}
        value={age}
        onChange={(event) => onAge(Number(event.target.value))}
        aria-label="Age slider"
        className="mt-4 w-full accent-[color:var(--brand-brown)]"
      />
    </div>
  );
}
