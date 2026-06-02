import { describe, expect, it } from 'vitest';
import { toButtonLabel } from './titleCase';

describe('toButtonLabel', () => {
  it('capitalizes major words and keeps small words lowercase', () => {
    expect(toButtonLabel('dispatch all')).toBe('Dispatch All');
    expect(toButtonLabel('generate & load')).toBe('Generate & Load');
    expect(toButtonLabel('+ product to truck')).toBe('+ Product to Truck');
  });
});
