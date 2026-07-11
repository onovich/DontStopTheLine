export interface SimulationClock {
  readonly now: () => number;
}

export interface SimulationOptions {
  readonly clock: SimulationClock;
  readonly seed: number;
}

export interface SimulationSnapshot {
  readonly randomValue: number;
  readonly tick: number;
}

export function createSimulationSnapshot(options: SimulationOptions): SimulationSnapshot {
  return {
    randomValue: seededValue(options.seed),
    tick: options.clock.now(),
  };
}

function seededValue(seed: number): number {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}
