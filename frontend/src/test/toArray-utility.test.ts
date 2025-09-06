import { describe, it, expect } from 'vitest';

// Replicate the toArray utility function for testing
const toArray = <T,>(val: unknown): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (val != null && typeof val === 'object') return [val as T];
  return [];
};

describe('toArray Utility Function', () => {
  it('should return arrays unchanged', () => {
    const input = [1, 2, 3];
    const result = toArray(input);
    expect(result).toEqual([1, 2, 3]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should convert single objects to arrays', () => {
    const input = { id: 1, name: 'test' };
    const result = toArray(input);
    expect(result).toEqual([{ id: 1, name: 'test' }]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  it('should return empty arrays for null', () => {
    const result = toArray(null);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty arrays for undefined', () => {
    const result = toArray(undefined);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty arrays for primitive values', () => {
    expect(toArray('string')).toEqual([]);
    expect(toArray(123)).toEqual([]);
    expect(toArray(true)).toEqual([]);
  });

  it('should handle empty arrays', () => {
    const result = toArray([]);
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle empty objects', () => {
    const result = toArray({});
    expect(result).toEqual([{}]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });
});