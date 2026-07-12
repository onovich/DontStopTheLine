import type { Command } from '@dstl/domain';
import { replayFactory, serializeSnapshot, type FactoryState } from '@dstl/simulation';

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
export {
  runThousandNodeBenchmark,
  thousandNodeCommands,
  type PerformanceReport,
} from './performance.js';
