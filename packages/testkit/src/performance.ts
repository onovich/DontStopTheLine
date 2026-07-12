import type { Command } from '@dstl/domain';
import { replayFactory, selectStatistics } from '@dstl/simulation';

export interface PerformanceReport {
  readonly elapsedMs: number;
  readonly nodeCount: number;
  readonly tick: number;
}

export function thousandNodeCommands(): readonly Command[] {
  const commands: Command[] = [];
  for (let index = 0; index < 500; index += 1) {
    commands.push({ type: 'place-node', nodeId: `source-${index}`, nodeKind: 'source' });
    commands.push({ type: 'place-node', nodeId: `store-${index}`, nodeKind: 'storage' });
    commands.push({
      type: 'connect-line',
      lineId: `line-${index}`,
      from: `source-${index}`,
      to: `store-${index}`,
      capacity: 2,
    });
  }
  return [...commands, { type: 'advance-ticks', ticks: 20 }];
}

export function runThousandNodeBenchmark(seed = 1000): PerformanceReport {
  const start = performance.now();
  const state = replayFactory(seed, thousandNodeCommands());
  const statistics = selectStatistics(state);
  return {
    elapsedMs: performance.now() - start,
    nodeCount: statistics.nodeCount,
    tick: statistics.tick,
  };
}
