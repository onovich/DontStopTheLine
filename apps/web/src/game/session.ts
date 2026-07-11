import type { Command, EntityId, NodeKind } from '@dstl/domain';
import {
  applyCommand,
  createFactory,
  selectStatistics,
  type FactoryState,
  type FactoryStatistics,
} from '@dstl/simulation';

export const LOGIC_TICK_MS = 250;
export const SPEEDS = [1, 2, 4] as const;

export type SimulationSpeed = (typeof SPEEDS)[number];
export type Point = Readonly<{ x: number; y: number }>;
export type InteractionMode = 'select' | 'connect' | 'demolish' | 'place';

export interface BoardUiState {
  readonly mode: InteractionMode;
  readonly positions: Readonly<Record<EntityId, Point>>;
  readonly selectedNodeId: EntityId | null;
}

export interface GameSnapshot {
  readonly factory: FactoryState;
  readonly paused: boolean;
  readonly speed: SimulationSpeed;
  readonly statistics: FactoryStatistics;
  readonly ui: BoardUiState;
}

interface HistoryEntry {
  readonly factory: FactoryState;
  readonly ui: BoardUiState;
}

interface SessionState {
  accumulatorMs: number;
  factory: FactoryState;
  history: readonly HistoryEntry[];
  paused: boolean;
  speed: SimulationSpeed;
  ui: BoardUiState;
}

export interface GameSession {
  advanceFrame(elapsedMs: number): void;
  connect(from: EntityId, to: EntityId): boolean;
  getSnapshot(): GameSnapshot;
  moveNode(nodeId: EntityId, position: Point): boolean;
  placeNode(kind: NodeKind, position: Point): EntityId | null;
  removeNode(nodeId: EntityId): boolean;
  setMode(mode: InteractionMode): void;
  setPaused(paused: boolean): void;
  setSelectedNode(nodeId: EntityId | null): void;
  setSpeed(speed: SimulationSpeed): void;
  subscribe(listener: () => void): () => void;
  undo(): boolean;
}

export function createGameSession(seed = 1): GameSession {
  let state = initialSessionState(seed);
  const listeners = new Set<() => void>();

  const publish = (): void => {
    for (const listener of listeners) listener();
  };
  const apply = (command: Command, nextUi = state.ui, recordHistory = true): boolean => {
    const result = applyCommand(state.factory, command);
    if (!result.accepted) return false;
    state = {
      ...state,
      factory: result.state,
      history: recordHistory
        ? [...state.history, { factory: state.factory, ui: state.ui }]
        : state.history,
      ui: nextUi,
    };
    publish();
    return true;
  };
  const nextNodeId = (kind: NodeKind): EntityId =>
    `${kind}-${Object.keys(state.factory.nodes).length + 1}`;
  const nextLineId = (): EntityId => `line-${Object.keys(state.factory.lines).length + 1}`;

  return {
    advanceFrame(elapsedMs) {
      if (state.paused || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
      let accumulatorMs = state.accumulatorMs + elapsedMs * state.speed;
      let factory = state.factory;
      let changed = false;
      while (accumulatorMs >= LOGIC_TICK_MS) {
        const result = applyCommand(factory, { type: 'advance-ticks', ticks: 1 });
        factory = result.state;
        accumulatorMs -= LOGIC_TICK_MS;
        changed = true;
      }
      if (changed) {
        state = { ...state, accumulatorMs, factory };
        publish();
      } else {
        state = { ...state, accumulatorMs };
      }
    },
    connect(from, to) {
      if (Object.values(state.factory.lines).some((line) => line.from === from || line.to === to))
        return false;
      return apply({ type: 'connect-line', lineId: nextLineId(), from, to });
    },
    getSnapshot() {
      return {
        factory: state.factory,
        paused: state.paused,
        speed: state.speed,
        statistics: selectStatistics(state.factory),
        ui: state.ui,
      };
    },
    moveNode(nodeId, position) {
      if (state.factory.nodes[nodeId] === undefined) return false;
      state = {
        ...state,
        history: [...state.history, { factory: state.factory, ui: state.ui }],
        ui: { ...state.ui, positions: { ...state.ui.positions, [nodeId]: position } },
      };
      publish();
      return true;
    },
    placeNode(kind, position) {
      const nodeId = nextNodeId(kind);
      const positions = { ...state.ui.positions, [nodeId]: position };
      const placed = apply(
        { type: 'place-node', nodeId, nodeKind: kind },
        { ...state.ui, mode: 'select', positions, selectedNodeId: nodeId },
      );
      return placed ? nodeId : null;
    },
    removeNode(nodeId) {
      if (state.factory.nodes[nodeId] === undefined) return false;
      const { [nodeId]: removed, ...positions } = state.ui.positions;
      void removed;
      return apply(
        { type: 'remove-node', nodeId },
        { ...state.ui, positions, selectedNodeId: null },
      );
    },
    setMode(mode) {
      if (mode === state.ui.mode) return;
      state = { ...state, ui: { ...state.ui, mode } };
      publish();
    },
    setPaused(paused) {
      if (paused === state.paused) return;
      state = { ...state, paused };
      publish();
    },
    setSelectedNode(selectedNodeId) {
      if (selectedNodeId === state.ui.selectedNodeId) return;
      state = { ...state, ui: { ...state.ui, selectedNodeId } };
      publish();
    },
    setSpeed(speed) {
      if (!SPEEDS.includes(speed) || speed === state.speed) return;
      state = { ...state, speed };
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    undo() {
      const previous = state.history.at(-1);
      if (previous === undefined) return false;
      state = {
        ...state,
        factory: previous.factory,
        history: state.history.slice(0, -1),
        ui: previous.ui,
      };
      publish();
      return true;
    },
  };
}

function initialSessionState(seed: number): SessionState {
  let factory = createFactory(seed);
  factory = applyCommand(factory, {
    type: 'place-node',
    nodeId: 'source-1',
    nodeKind: 'source',
  }).state;
  factory = applyCommand(factory, {
    type: 'place-node',
    nodeId: 'seller-2',
    nodeKind: 'seller',
  }).state;
  return {
    accumulatorMs: 0,
    factory,
    history: [],
    paused: false,
    speed: 1,
    ui: {
      mode: 'select',
      positions: { 'seller-2': { x: 760, y: 360 }, 'source-1': { x: 240, y: 360 } },
      selectedNodeId: null,
    },
  };
}
