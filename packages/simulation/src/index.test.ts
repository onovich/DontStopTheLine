import { describe, expect, it } from 'vitest';
import { createSimulationSnapshot } from '@dstl/simulation';

describe('createSimulationSnapshot', () => {
  it('uses an injected clock and produces repeatable output for a seed', () => {
    const clock = { now: () => 42 };
    const options = { clock, seed: 1234 };

    expect(createSimulationSnapshot(options)).toEqual(createSimulationSnapshot(options));
    expect(createSimulationSnapshot(options).tick).toBe(42);
  });
});
