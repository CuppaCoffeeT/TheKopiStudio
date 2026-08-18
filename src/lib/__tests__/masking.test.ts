/**
 * Masking rules — the ones a bug would leak, not the ones a bug would annoy.
 *
 * The interesting cases are the SHORT names: a two-character name masked as
 * "everything but the last letter" reveals the whole thing, which is the
 * failure mode a naive percentage-based masker ships with.
 */

import { describe, expect, it } from 'vitest';
import { maskCount, maskInitial, maskMoney, maskName, maskText } from '../masking';

describe('maskName', () => {
  it('keeps the first two characters as the recognition hook', () => {
    expect(maskName('Sky Tan', true)).toBe('Sk***');
  });

  it('hides names at or under the two-character floor outright', () => {
    // 'Li' masked as 'Li***' would reveal 100% of the name.
    expect(maskName('Li', true)).toBe('***');
    expect(maskName('A', true)).toBe('***');
  });

  it('leaves an empty name empty rather than printing asterisks for nobody', () => {
    expect(maskName('', true)).toBe('');
    expect(maskName(null, true)).toBe('');
    expect(maskName(undefined, true)).toBe('');
  });

  it('trims before measuring, so padding cannot buy extra revealed characters', () => {
    expect(maskName('  Li  ', true)).toBe('***');
  });

  it('returns the real name untouched when unmasked', () => {
    expect(maskName('Sky Tan', false)).toBe('Sky Tan');
  });
});

describe('maskMoney / maskCount / maskText', () => {
  it('replaces the whole value with a fixed run — never a partial figure', () => {
    // A partial money mask ('$5,***') leaks the order of magnitude.
    expect(maskMoney('$5,000', true)).toBe('******');
    expect(maskCount(237, true)).toBe('******');
    expect(maskText('Met at the office', true)).toBe('******');
  });

  it('passes values straight through when unmasked', () => {
    expect(maskMoney('$5,000', false)).toBe('$5,000');
    expect(maskCount(237, false)).toBe('237');
    expect(maskText('Met at the office', false)).toBe('Met at the office');
  });

  it('leaves empty text empty', () => {
    expect(maskText('', true)).toBe('');
  });
});

describe('maskInitial', () => {
  it('is never masked — one letter reveals nothing and keeps rows scannable', () => {
    expect(maskInitial('Sky Tan')).toBe('S');
    expect(maskInitial('')).toBe('?');
  });
});
