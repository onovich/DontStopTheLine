import type {
  Command,
  DomainEvent,
  EntityId,
  ItemKind,
  NodeKind,
  RejectionReason,
} from '@dstl/domain';
import { createGameState, type CommandResult, type GameState } from './core.js';

export type BlockReason = 'NO_INPUT' | 'OUTPUT_FULL' | 'WORKING';
const OUTPUT_CAPACITY = 2;

export interface NodeState {
  readonly id: EntityId;
  readonly kind: NodeKind;
  readonly input: readonly ItemKind[];
  readonly output: readonly ItemKind[];
  readonly workUntil: number | null;
}
export interface FactoryState extends GameState {
  readonly nodes: Readonly<Record<EntityId, NodeState>>;
}

export function createFactory(seed: number): FactoryState {
  return { ...createGameState(seed), nodes: {} };
}

export function applyCommand(state: FactoryState, command: Command): CommandResult<FactoryState> {
  if (command.type === 'place-node') {
    if (state.nodes[command.nodeId] !== undefined) return reject(state, command, 'DUPLICATE_ID');
    const node: NodeState = {
      id: command.nodeId,
      kind: command.nodeKind,
      input: [],
      output: [],
      workUntil: null,
    };
    return accept({ ...state, nodes: { ...state.nodes, [node.id]: node } }, [
      { type: 'node-placed', nodeId: node.id, nodeKind: node.kind },
    ]);
  }
  if (command.type === 'remove-node') {
    if (state.nodes[command.nodeId] === undefined) return reject(state, command, 'UNKNOWN_NODE');
    const { [command.nodeId]: removed, ...nodes } = state.nodes;
    void removed;
    return accept({ ...state, nodes }, [{ type: 'node-removed', nodeId: command.nodeId }]);
  }
  if (command.type !== 'advance-ticks') return reject(state, command, 'INVALID_COMMAND');
  if (!Number.isInteger(command.ticks) || command.ticks < 1)
    return reject(state, command, 'INVALID_TICK_COUNT');
  let next: FactoryState = { ...state, tick: state.tick + command.ticks };
  const events: DomainEvent[] = [];
  for (const node of Object.values(next.nodes)) {
    if (node.kind !== 'source' || productionStatus(node) !== null) continue;
    const output: readonly ItemKind[] = [...node.output, 'ore'];
    next = { ...next, nodes: { ...next.nodes, [node.id]: { ...node, output } } };
    events.push({ type: 'production-completed', nodeId: node.id, item: 'ore' });
  }
  return accept(next, events);
}

export function productionStatus(node: NodeState): BlockReason | null {
  if (node.workUntil !== null) return 'WORKING';
  if (node.output.length >= OUTPUT_CAPACITY) return 'OUTPUT_FULL';
  if (node.kind === 'processor' && node.input.length === 0) return 'NO_INPUT';
  return null;
}

function accept(state: FactoryState, events: readonly DomainEvent[]): CommandResult<FactoryState> {
  return { accepted: true, events, state };
}
function reject(
  state: FactoryState,
  command: Command,
  reason: RejectionReason,
): CommandResult<FactoryState> {
  return { accepted: false, event: { type: 'command-rejected', command, reason }, state };
}
