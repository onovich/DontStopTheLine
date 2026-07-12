import type { Command } from '@dstl/domain';
import {
  replayFactory,
  selectStatistics,
  serializeSnapshot,
  type FactoryState,
} from '@dstl/simulation';

export function profitChainCommands(): readonly Command[] {
  return [
    { type: 'place-node', nodeId: 'source', nodeKind: 'source' },
    { type: 'place-node', nodeId: 'processor', nodeKind: 'processor' },
    { type: 'place-node', nodeId: 'seller', nodeKind: 'seller' },
    { type: 'connect-line', lineId: 'source-to-processor', from: 'source', to: 'processor' },
    { type: 'connect-line', lineId: 'processor-to-seller', from: 'processor', to: 'seller' },
    { type: 'advance-ticks', ticks: 1 },
    { type: 'advance-ticks', ticks: 1 },
    { type: 'advance-ticks', ticks: 1 },
    { type: 'advance-ticks', ticks: 1 },
    { type: 'advance-ticks', ticks: 1 },
    { type: 'advance-ticks', ticks: 1 },
  ];
}

export function runProfitChain(seed = 1): FactoryState {
  return replayFactory(seed, profitChainCommands());
}
export function goldenSnapshot(seed = 1): string {
  return serializeSnapshot(runProfitChain(seed));
}

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
  const statistics = selectStatistics(replayFactory(seed, thousandNodeCommands()));
  return {
    elapsedMs: performance.now() - start,
    nodeCount: statistics.nodeCount,
    tick: statistics.tick,
  };
}
