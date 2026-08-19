/**
 * Form-string → number coercion for the planning tools.
 *
 * Every planner input is an `<input>`, so every value is a string; the pure lib
 * functions take numbers. This is where that boundary is crossed, once, so two
 * hooks cannot disagree about what an empty field means. An unparseable or
 * blank value is ZERO, never `NaN` — a `NaN` propagates silently through a
 * projection and surfaces as "$NaN" three panels later.
 */

/** A field's numeric value; blank or unparseable reads as 0. */
export function num(value: string): number {
  return Number(value) || 0;
}

/** A percentage field as a fraction — "4" → 0.04. */
export function rate(value: string): number {
  return num(value) / 100;
}
