import { describe, expect, it } from 'vitest';
import { isValidRecipe } from '@dstl/domain';

describe('isValidRecipe', () => {
  it('rejects zero-duration recipes', () => {
    expect(
      isValidRecipe({
        id: 'invalid',
        input: { kind: 'ore', quantity: 1 },
        output: { kind: 'plate', quantity: 1 },
        durationTicks: 0,
      }),
    ).toBe(false);
  });
});
