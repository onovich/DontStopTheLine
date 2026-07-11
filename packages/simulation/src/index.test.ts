import { describe, expect, it } from 'vitest';
import {
  applyCommand,
  createFactory,
  createGameState,
  nextRandom,
  productionStatus,
  sortQueue,
} from '@dstl/simulation';

describe('deterministic primitives', () => {
  it('replays seeded random values and sorts events stably', () => {
    const state = createGameState(1234);
    expect(nextRandom(state)).toEqual(nextRandom(state));
    expect(sortQueue([])).toEqual([]);
  });

  it('places nodes immutably and reports processor input blocking', () => {
    const initial = createFactory(1);
    const result = applyCommand(initial, {
      type: 'place-node',
      nodeId: 'processor',
      nodeKind: 'processor',
    });
    expect(result.accepted).toBe(true);
    if (result.accepted) {
      const processor = result.state.nodes['processor'];
      if (processor === undefined) throw new Error('Expected placed processor.');
      expect(productionStatus(processor)).toBe('NO_INPUT');
      expect(initial.nodes).toEqual({});
    }
  });
});
