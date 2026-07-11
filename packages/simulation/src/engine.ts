import type {
  Command,
  DomainEvent,
  EntityId,
  ItemKind,
  NodeKind,
  RejectionReason,
} from '@dstl/domain';
import { createGameState, type CommandResult, type GameState } from './core.js';

export type BlockReason =
  | 'NO_INPUT'
  | 'OUTPUT_FULL'
  | 'WORKING'
  | 'NO_CONSUMER'
  | 'TARGET_FULL'
  | 'LINE_FULL'
  | 'RECIPE_MISMATCH';
const OUTPUT_CAPACITY = 2;

export interface NodeState {
  readonly id: EntityId;
  readonly kind: NodeKind;
  readonly input: readonly ItemKind[];
  readonly output: readonly ItemKind[];
  readonly reserved: number;
  readonly workUntil: number | null;
}
export interface LineState {
  readonly id: EntityId;
  readonly from: EntityId;
  readonly to: EntityId;
  readonly items: readonly TransitItem[];
}
export interface TransitItem {
  readonly item: ItemKind;
  readonly arrivalTick: number;
}
export interface FactoryState extends GameState {
  readonly nodes: Readonly<Record<EntityId, NodeState>>;
  readonly lines: Readonly<Record<EntityId, LineState>>;
}

export function createFactory(seed: number): FactoryState {
  return { ...createGameState(seed), nodes: {}, lines: {} };
}

export function applyCommand(state: FactoryState, command: Command): CommandResult<FactoryState> {
  if (command.type === 'place-node') {
    if (state.nodes[command.nodeId] !== undefined) return reject(state, command, 'DUPLICATE_ID');
    const node: NodeState = {
      id: command.nodeId,
      kind: command.nodeKind,
      input: [],
      output: [],
      reserved: 0,
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
    const lines = Object.fromEntries(
      Object.entries(state.lines).filter(
        ([, line]) => line.from !== command.nodeId && line.to !== command.nodeId,
      ),
    );
    return accept({ ...state, nodes, lines }, [{ type: 'node-removed', nodeId: command.nodeId }]);
  }
  if (command.type === 'connect-line') return connectLine(state, command);
  if (command.type === 'disconnect-line') return disconnectLine(state, command);
  if (command.type !== 'advance-ticks') return reject(state, command, 'INVALID_COMMAND');
  if (!Number.isInteger(command.ticks) || command.ticks < 1)
    return reject(state, command, 'INVALID_TICK_COUNT');
  let next: FactoryState = { ...state, tick: state.tick + command.ticks };
  const events: DomainEvent[] = [];
  const received = receiveArrivals(next);
  next = received[0];
  events.push(...received[1]);
  for (const node of Object.values(next.nodes)) {
    if (node.kind !== 'source' || productionStatus(node) !== null) continue;
    const output: readonly ItemKind[] = [...node.output, 'ore'];
    next = { ...next, nodes: { ...next.nodes, [node.id]: { ...node, output } } };
    events.push({ type: 'production-completed', nodeId: node.id, item: 'ore' });
  }
  const dispatched = dispatchOutputs(next);
  next = dispatched[0];
  events.push(...dispatched[1]);
  return accept(next, events);
}

export function productionStatus(node: NodeState): BlockReason | null {
  if (node.workUntil !== null) return 'WORKING';
  if (node.output.length >= OUTPUT_CAPACITY) return 'OUTPUT_FULL';
  if (node.kind === 'processor' && node.input.length === 0) return 'NO_INPUT';
  return null;
}

function connectLine(
  state: FactoryState,
  command: Extract<Command, { type: 'connect-line' }>,
): CommandResult<FactoryState> {
  if (state.lines[command.lineId] !== undefined) return reject(state, command, 'DUPLICATE_ID');
  if (
    state.nodes[command.from] === undefined ||
    state.nodes[command.to] === undefined ||
    command.from === command.to
  )
    return reject(state, command, 'INVALID_CONNECTION');
  const line: LineState = { id: command.lineId, from: command.from, to: command.to, items: [] };
  return accept({ ...state, lines: { ...state.lines, [line.id]: line } }, [
    { type: 'line-connected', lineId: line.id },
  ]);
}

function disconnectLine(
  state: FactoryState,
  command: Extract<Command, { type: 'disconnect-line' }>,
): CommandResult<FactoryState> {
  if (state.lines[command.lineId] === undefined) return reject(state, command, 'UNKNOWN_LINE');
  const { [command.lineId]: removed, ...lines } = state.lines;
  void removed;
  return accept({ ...state, lines }, [{ type: 'line-disconnected', lineId: command.lineId }]);
}

function receiveArrivals(state: FactoryState): readonly [FactoryState, readonly DomainEvent[]] {
  let next = state;
  const nextEvents: DomainEvent[] = [];
  for (const line of Object.values(state.lines))
    for (const transit of line.items.filter((item) => item.arrivalTick <= state.tick)) {
      const target = next.nodes[line.to];
      if (target === undefined) continue;
      const input = [...target.input, transit.item];
      next = {
        ...next,
        nodes: { ...next.nodes, [target.id]: { ...target, input, reserved: target.reserved - 1 } },
        lines: {
          ...next.lines,
          [line.id]: { ...line, items: line.items.filter((item) => item !== transit) },
        },
      };
      nextEvents.push({ type: 'item-arrived', lineId: line.id, item: transit.item });
    }
  return [next, nextEvents];
}

function dispatchOutputs(state: FactoryState): readonly [FactoryState, readonly DomainEvent[]] {
  let next = state;
  const nextEvents: DomainEvent[] = [];
  for (const line of Object.values(state.lines)) {
    const source = next.nodes[line.from];
    const target = next.nodes[line.to];
    if (
      source === undefined ||
      target === undefined ||
      source.output.length === 0 ||
      line.items.length > 0 ||
      target.input.length + target.reserved >= 2
    )
      continue;
    const item = source.output[0];
    if (item === undefined || !accepts(target, item)) continue;
    next = {
      ...next,
      nodes: {
        ...next.nodes,
        [source.id]: { ...source, output: source.output.slice(1) },
        [target.id]: { ...target, reserved: target.reserved + 1 },
      },
      lines: {
        ...next.lines,
        [line.id]: { ...line, items: [{ item, arrivalTick: next.tick + 1 }] },
      },
    };
    nextEvents.push({ type: 'item-dispatched', lineId: line.id, item });
  }
  return [next, nextEvents];
}

function accepts(node: NodeState, item: ItemKind): boolean {
  return node.kind !== 'processor' || item === 'ore';
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
