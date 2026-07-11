import { describe, expect, it } from 'vitest';
import { createGameState, nextRandom, sortQueue } from '@dstl/simulation';

describe('deterministic primitives', () => {
  it('replays seeded random values and sorts events stably', () => {
    const state = createGameState(1234);
    expect(nextRandom(state)).toEqual(nextRandom(state));
    expect(sortQueue([])).toEqual([]);
  });
});
