import type {
  Command,
  DomainEvent,
  EntityId,
  ItemKind,
  NodeKind,
  RejectionReason,
  RoutingStrategy,
} from '@dstl/domain';
import { createGameState, type CommandResult, type GameState } from './core.js';

export type BlockReason =
  | 'NO_INPUT'
  | 'OUTPUT_FULL'
  | 'WORKING'
  | 'NO_CONSUMER'
  | 'TARGET_FULL'
  | 'LINE_FULL'
  | 'RECIPE_MISMATCH'
  | 'SELLER_BUSY';

export interface NodeState {
  readonly id: EntityId;
  readonly kind: NodeKind;
  readonly input: readonly ItemKind[];
  readonly output: readonly ItemKind[];
  readonly reserved: number;
  readonly workItem: ItemKind | null;
  readonly workUntil: number | null;
  readonly level: number;
  readonly outputKind: ItemKind;
  readonly recipeId: 'smelt-ore' | 'assemble-gear';
  readonly routing: RoutingStrategy;
}
export interface LineState {
  readonly id: EntityId;
  readonly from: EntityId;
  readonly to: EntityId;
  readonly capacity: number;
  readonly items: readonly TransitItem[];
}
export interface TransitItem {
  readonly item: ItemKind;
  readonly arrivalTick: number;
}
export interface FactoryState extends GameState {
  readonly money: number;
  readonly level: number;
  readonly blueprints: Readonly<Record<string, boolean>>;
  readonly nodes: Readonly<Record<EntityId, NodeState>>;
  readonly lines: Readonly<Record<EntityId, LineState>>;
}

const ITEMS: readonly ItemKind[] = ['ore', 'coal', 'plate', 'gear'];

export function createFactory(seed: number): FactoryState {
  return {
    ...createGameState(seed),
    money: 0,
    level: 1,
    blueprints: { 'assemble-gear': true },
    nodes: {},
    lines: {},
  };
}

export function applyCommand(state: FactoryState, command: Command): CommandResult<FactoryState> {
  switch (command.type) {
    case 'place-node':
      return placeNode(state, command);
    case 'remove-node':
      return removeNode(state, command.nodeId, command);
    case 'connect-line':
      return connectLine(state, command);
    case 'disconnect-line':
      return disconnectLine(state, command);
    case 'set-routing':
      return setRouting(state, command.nodeId, command.strategy, command);
    case 'upgrade-node':
      return upgradeNode(state, command.nodeId, command);
    case 'sell-node':
      return sellNode(state, command.nodeId, command);
    case 'advance-ticks':
      return advance(state, command);
  }
}

export function productionStatus(node: NodeState): BlockReason | null {
  if (node.workUntil !== null) return 'WORKING';
  if (node.output.length >= outputCapacity(node)) return 'OUTPUT_FULL';
  if (node.kind === 'processor' && !hasInputs(node.input, recipeFor(node).inputs))
    return 'NO_INPUT';
  return null;
}

export function replayFactory(seed: number, commands: readonly Command[]): FactoryState {
  let state = createFactory(seed);
  for (const command of commands) state = applyCommand(state, command).state;
  return state;
}

export function serializeSnapshot(state: FactoryState): string {
  const nodes = Object.entries(state.nodes).sort(([a], [b]) => a.localeCompare(b));
  const lines = Object.entries(state.lines).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify({ ...state, nodes, lines });
}

function placeNode(
  state: FactoryState,
  command: Extract<Command, { type: 'place-node' }>,
): CommandResult<FactoryState> {
  if (state.nodes[command.nodeId] !== undefined) return reject(state, command, 'DUPLICATE_ID');
  const node: NodeState = {
    id: command.nodeId,
    kind: command.nodeKind,
    input: [],
    output: [],
    reserved: 0,
    workItem: null,
    workUntil: null,
    level: 1,
    outputKind: command.outputKind ?? 'ore',
    recipeId: command.recipeId === 'assemble-gear' ? 'assemble-gear' : 'smelt-ore',
    routing: 'overflow',
  };
  return accept({ ...state, nodes: { ...state.nodes, [node.id]: node } }, [
    { type: 'node-placed', nodeId: node.id, nodeKind: node.kind },
  ]);
}

function removeNode(
  state: FactoryState,
  nodeId: EntityId,
  command: Command,
): CommandResult<FactoryState> {
  if (state.nodes[nodeId] === undefined) return reject(state, command, 'UNKNOWN_NODE');
  const { [nodeId]: removed, ...nodes } = state.nodes;
  void removed;
  const lines = Object.fromEntries(
    Object.entries(state.lines).filter(([, line]) => line.from !== nodeId && line.to !== nodeId),
  );
  return accept({ ...state, nodes, lines }, [{ type: 'node-removed', nodeId }]);
}

function connectLine(
  state: FactoryState,
  command: Extract<Command, { type: 'connect-line' }>,
): CommandResult<FactoryState> {
  if (state.lines[command.lineId] !== undefined) return reject(state, command, 'DUPLICATE_ID');
  if (
    state.nodes[command.from] === undefined ||
    state.nodes[command.to] === undefined ||
    command.from === command.to ||
    !Number.isInteger(command.capacity ?? 1) ||
    (command.capacity ?? 1) < 1
  )
    return reject(state, command, 'INVALID_CONNECTION');
  const line: LineState = {
    id: command.lineId,
    from: command.from,
    to: command.to,
    capacity: command.capacity ?? 1,
    items: [],
  };
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

function setRouting(
  state: FactoryState,
  nodeId: EntityId,
  strategy: RoutingStrategy,
  command: Command,
): CommandResult<FactoryState> {
  const node = state.nodes[nodeId];
  if (node === undefined) return reject(state, command, 'UNKNOWN_NODE');
  return accept({ ...state, nodes: { ...state.nodes, [nodeId]: { ...node, routing: strategy } } }, [
    { type: 'routing-set', nodeId, strategy },
  ]);
}

function upgradeNode(
  state: FactoryState,
  nodeId: EntityId,
  command: Command,
): CommandResult<FactoryState> {
  const node = state.nodes[nodeId];
  if (node === undefined) return reject(state, command, 'UNKNOWN_NODE');
  const cost = upgradeCost(node);
  if (state.money < cost) return reject(state, command, 'INSUFFICIENT_FUNDS');
  const upgraded = { ...node, level: node.level + 1 };
  const level = Math.max(state.level, upgraded.level);
  return accept(
    { ...state, money: state.money - cost, level, nodes: { ...state.nodes, [nodeId]: upgraded } },
    [{ type: 'node-upgraded', nodeId, level: upgraded.level }],
  );
}

function sellNode(
  state: FactoryState,
  nodeId: EntityId,
  command: Command,
): CommandResult<FactoryState> {
  const node = state.nodes[nodeId];
  if (node === undefined) return reject(state, command, 'UNKNOWN_NODE');
  const refund = Math.max(1, node.level * 2 - node.input.length - node.output.length);
  const removed = removeNode(state, nodeId, command);
  if (!removed.accepted) return removed;
  return accept({ ...removed.state, money: removed.state.money + refund }, [
    { type: 'node-sold', nodeId, refund },
  ]);
}

function advance(
  state: FactoryState,
  command: Extract<Command, { type: 'advance-ticks' }>,
): CommandResult<FactoryState> {
  if (!Number.isInteger(command.ticks) || command.ticks < 1)
    return reject(state, command, 'INVALID_TICK_COUNT');
  let next = state;
  const events: DomainEvent[] = [];
  for (let index = 0; index < command.ticks; index += 1) {
    const result = advanceOneTick(next);
    next = result[0];
    events.push(...result[1]);
  }
  return accept(next, events);
}

function advanceOneTick(state: FactoryState): readonly [FactoryState, readonly DomainEvent[]] {
  let next: FactoryState = { ...state, tick: state.tick + 1 };
  const events: DomainEvent[] = [];
  const received = receiveArrivals(next);
  next = received[0];
  events.push(...received[1]);
  for (const node of Object.values(next.nodes)) {
    const current = next.nodes[node.id];
    if (current === undefined) continue;
    if (current.workUntil !== null && current.workUntil <= next.tick && current.workItem !== null) {
      if (current.kind === 'seller') {
        next = {
          ...next,
          money: next.money + saleValue(current.workItem),
          nodes: { ...next.nodes, [current.id]: { ...current, workItem: null, workUntil: null } },
        };
        events.push({ type: 'item-sold', nodeId: current.id, amount: saleValue(current.workItem) });
      } else {
        next = {
          ...next,
          nodes: {
            ...next.nodes,
            [current.id]: {
              ...current,
              output: [...current.output, current.workItem],
              workItem: null,
              workUntil: null,
            },
          },
        };
        events.push({ type: 'production-completed', nodeId: current.id, item: current.workItem });
      }
      continue;
    }
    if (current.workUntil !== null) continue;
    if (current.kind === 'storage' || current.kind === 'warehouse' || current.kind === 'router') {
      next = transferBuffer(next, current);
      continue;
    }
    if (current.kind === 'source' && current.output.length < outputCapacity(current)) {
      next = startWork(next, current, current.outputKind, 1);
      continue;
    }
    if (current.kind === 'processor') {
      const recipe = recipeFor(current);
      if (
        current.output.length < outputCapacity(current) &&
        hasInputs(current.input, recipe.inputs)
      )
        next = startWork(
          next,
          { ...current, input: consumeInputs(current.input, recipe.inputs) },
          recipe.output,
          recipe.duration,
        );
      continue;
    }
    if (
      current.kind === 'seller' &&
      current.input.length > 0 &&
      (current.input[0] === 'plate' || current.input[0] === 'gear')
    ) {
      const item = current.input[0];
      if (item !== undefined)
        next = startWork(next, { ...current, input: current.input.slice(1) }, item, 1);
    }
  }
  const dispatched = dispatchOutputs(next);
  return [dispatched[0], [...events, ...dispatched[1]]];
}

function receiveArrivals(state: FactoryState): readonly [FactoryState, readonly DomainEvent[]] {
  let next = state;
  const events: DomainEvent[] = [];
  for (const line of Object.values(state.lines))
    for (const transit of line.items.filter((item) => item.arrivalTick <= state.tick)) {
      const target = next.nodes[line.to];
      const currentLine = next.lines[line.id];
      if (target === undefined || currentLine === undefined) continue;
      next = {
        ...next,
        nodes: {
          ...next.nodes,
          [target.id]: {
            ...target,
            input: [...target.input, transit.item],
            reserved: Math.max(0, target.reserved - 1),
          },
        },
        lines: {
          ...next.lines,
          [line.id]: {
            ...currentLine,
            items: currentLine.items.filter((item) => item !== transit),
          },
        },
      };
      events.push({ type: 'item-arrived', lineId: line.id, item: transit.item });
    }
  return [next, events];
}

function transferBuffer(state: FactoryState, node: NodeState): FactoryState {
  if (node.input.length === 0 || node.output.length >= outputCapacity(node)) return state;
  const item = node.input[0];
  if (item === undefined) return state;
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [node.id]: { ...node, input: node.input.slice(1), output: [...node.output, item] },
    },
  };
}
function startWork(
  state: FactoryState,
  node: NodeState,
  item: ItemKind,
  duration: number,
): FactoryState {
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [node.id]: { ...node, workItem: item, workUntil: state.tick + duration },
    },
  };
}

function dispatchOutputs(state: FactoryState): readonly [FactoryState, readonly DomainEvent[]] {
  let next = state;
  const events: DomainEvent[] = [];
  for (const source of Object.values(state.nodes)) {
    const current = next.nodes[source.id];
    if (current === undefined || current.output.length === 0) continue;
    const item = current.output[0];
    if (item === undefined) continue;
    const options = Object.values(next.lines).filter(
      (line) => line.from === current.id && canDispatch(next, line, item),
    );
    const line = chooseLine(options, current.routing, next.tick);
    if (line === undefined) continue;
    const target = next.nodes[line.to];
    if (target === undefined) continue;
    next = {
      ...next,
      nodes: {
        ...next.nodes,
        [current.id]: { ...current, output: current.output.slice(1) },
        [target.id]: { ...target, reserved: target.reserved + 1 },
      },
      lines: {
        ...next.lines,
        [line.id]: { ...line, items: [...line.items, { item, arrivalTick: next.tick + 1 }] },
      },
    };
    events.push({ type: 'item-dispatched', lineId: line.id, item });
  }
  return [next, events];
}

function canDispatch(state: FactoryState, line: LineState, item: ItemKind): boolean {
  const target = state.nodes[line.to];
  return (
    target !== undefined &&
    line.items.length < line.capacity &&
    target.input.length + target.reserved < inputCapacity(target) &&
    accepts(target, item)
  );
}
function chooseLine(
  lines: readonly LineState[],
  strategy: RoutingStrategy,
  tick: number,
): LineState | undefined {
  if (strategy === 'even' && lines.length > 0) return lines[tick % lines.length];
  return [...lines].sort((a, b) => a.id.localeCompare(b.id))[0];
}
function accepts(node: NodeState, item: ItemKind): boolean {
  if (node.kind === 'processor') return recipeFor(node).inputs.some((input) => input === item);
  if (node.kind === 'seller') return item === 'plate' || item === 'gear';
  return true;
}
function recipeFor(node: NodeState): {
  readonly inputs: readonly ItemKind[];
  readonly output: ItemKind;
  readonly duration: number;
} {
  return node.recipeId === 'assemble-gear'
    ? { inputs: ['plate', 'coal'], output: 'gear', duration: 4 }
    : { inputs: ['ore'], output: 'plate', duration: 1 };
}
function hasInputs(items: readonly ItemKind[], required: readonly ItemKind[]): boolean {
  return required.every(
    (kind) =>
      items.filter((item) => item === kind).length >=
      required.filter((item) => item === kind).length,
  );
}
function consumeInputs(
  items: readonly ItemKind[],
  required: readonly ItemKind[],
): readonly ItemKind[] {
  const remaining = [...required];
  return items.filter((item) => {
    const index = remaining.indexOf(item);
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
}
function inputCapacity(node: NodeState): number {
  return baseCapacity(node, 'input') * node.level;
}
function outputCapacity(node: NodeState): number {
  return baseCapacity(node, 'output') * node.level;
}
function baseCapacity(node: NodeState, direction: 'input' | 'output'): number {
  if (node.kind === 'source') return direction === 'output' ? 2 : 0;
  if (node.kind === 'seller') return direction === 'input' ? 2 : 0;
  if (node.kind === 'warehouse') return 8;
  if (node.kind === 'storage' || node.kind === 'router') return 4;
  return 2;
}
function saleValue(item: ItemKind): number {
  return item === 'gear' ? 3 : 1;
}
function upgradeCost(node: NodeState): number {
  return 5 * node.level;
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
export const itemKinds = ITEMS;
