import type { ItemKind } from '@dstl/domain';

/** A deterministic, headless producer boundary for advanced visual minigames. */
export interface MiniGameProducer {
  readonly id: string;
  produce(input: MiniGameInput): MiniGameResult;
}

export interface MiniGameInput {
  readonly seed: number;
  readonly tick: number;
}

export interface MiniGameResult {
  readonly item: ItemKind;
  readonly seed: number;
  readonly tick: number;
}

/** The first Alpha producer: its visual maze may be replaced without changing this replay contract. */
export const mazeProducer: MiniGameProducer = {
  id: 'maze-producer-v1',
  produce(input) {
    return { item: input.seed % 2 === 0 ? 'ore' : 'coal', seed: input.seed, tick: input.tick };
  },
};
