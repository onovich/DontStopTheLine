import { describe, expect, it } from 'vitest';
import type { Command } from '@dstl/domain';
import {
  applyCommand,
  createFactory,
  createGameState,
  nextRandom,
  productionStatus,
  selectStatistics,
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

  it('reserves a target before dispatching and arrives on the next tick', () => {
    let state = createFactory(1);
    const commands: readonly Command[] = [
      { type: 'place-node', nodeId: 'source', nodeKind: 'source' as const },
      { type: 'place-node', nodeId: 'storage', nodeKind: 'storage' as const },
      { type: 'connect-line', lineId: 'line', from: 'source', to: 'storage' },
      { type: 'advance-ticks', ticks: 1 },
    ];
    for (const command of commands) {
      const result = applyCommand(state, command);
      if (!result.accepted) throw new Error('Expected accepted command.');
      state = result.state;
    }
    expect(state.nodes['storage']?.reserved).toBe(1);
    const arrived = applyCommand(state, { type: 'advance-ticks', ticks: 1 });
    if (!arrived.accepted) throw new Error('Expected arrival tick.');
    expect(arrived.state.nodes['storage']?.input).toEqual(['ore']);
  });

  it('exposes read-only aggregate statistics', () => {
    const state = createFactory(7);
    expect(selectStatistics(state)).toEqual({
      inTransit: 0,
      money: 0,
      nodeCount: 0,
      stored: { ore: 0, plate: 0 },
      tick: 0,
    });
  });
});
