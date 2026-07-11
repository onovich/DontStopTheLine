import { describe, expect, it } from 'vitest';
import { incrementCounter } from '@dstl/domain';

describe('incrementCounter', () => {
  it('returns a new value without mutating its input', () => {
    const state = { value: 3 };

    expect(incrementCounter(state, 2)).toEqual({ value: 5 });
    expect(state).toEqual({ value: 3 });
  });
});
