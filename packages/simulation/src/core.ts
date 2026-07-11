import type { DomainEvent } from '@dstl/domain';

export const STATE_VERSION = 1;
export interface QueuedEvent {
  readonly event: DomainEvent;
  readonly sequence: number;
  readonly tick: number;
}
export interface GameState {
  readonly seed: number;
  readonly sequence: number;
  readonly tick: number;
  readonly version: typeof STATE_VERSION;
}
export type CommandResult<TState extends GameState = GameState> =
  | { readonly accepted: true; readonly events: readonly DomainEvent[]; readonly state: TState }
  | { readonly accepted: false; readonly event: DomainEvent; readonly state: TState };
export function createGameState(seed: number): GameState {
  return { seed: seed >>> 0, sequence: 0, tick: 0, version: STATE_VERSION };
}
export function nextRandom(state: GameState): readonly [number, GameState] {
  let value = state.seed || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  const seed = value >>> 0;
  return [seed, { ...state, seed }];
}
export function sortQueue(events: readonly QueuedEvent[]): readonly QueuedEvent[] {
  return [...events].sort(
    (left, right) => left.tick - right.tick || left.sequence - right.sequence,
  );
}
