import type { ItemKind } from '@dstl/domain';
import type { BlockReason, FactoryState, NodeState } from './engine.js';
import { productionStatus } from './engine.js';

export interface NodeSummary {
  readonly block: BlockReason | null;
  readonly id: string;
  readonly inputCount: number;
  readonly outputCount: number;
  readonly reserved: number;
}

export interface FactoryStatistics {
  readonly inTransit: number;
  readonly money: number;
  readonly nodeCount: number;
  readonly stored: Readonly<Record<ItemKind, number>>;
  readonly tick: number;
}

export function selectNode(state: FactoryState, nodeId: string): NodeSummary | null {
  const node = state.nodes[nodeId];
  return node === undefined ? null : summarize(node);
}

export function selectStatistics(state: FactoryState): FactoryStatistics {
  const stored: Record<ItemKind, number> = { ore: 0, plate: 0 };
  for (const node of Object.values(state.nodes)) {
    for (const item of [...node.input, ...node.output]) stored[item] += 1;
  }
  return {
    inTransit: Object.values(state.lines).reduce((count, line) => count + line.items.length, 0),
    money: state.money,
    nodeCount: Object.keys(state.nodes).length,
    stored,
    tick: state.tick,
  };
}

export function explainBlock(reason: BlockReason): string {
  const explanations: Readonly<Record<BlockReason, string>> = {
    LINE_FULL: 'The line already has an item in transit.',
    NO_CONSUMER: 'No connected consumer can accept this output.',
    NO_INPUT: 'The processor has no compatible input.',
    OUTPUT_FULL: 'The output buffer is full.',
    RECIPE_MISMATCH: 'The target cannot accept this item kind.',
    TARGET_FULL: 'The target input capacity is reserved or full.',
    WORKING: 'The node is currently processing.',
  };
  return explanations[reason];
}

function summarize(node: NodeState): NodeSummary {
  return {
    block: productionStatus(node),
    id: node.id,
    inputCount: node.input.length,
    outputCount: node.output.length,
    reserved: node.reserved,
  };
}
