import type { ItemKind } from '@dstl/domain';

export interface MiniGameProducer {
  readonly id: string;
  produce(input: MiniGameInput): MiniGameResult;
}
export interface MiniGameInput {
  readonly seed: number;
  readonly tick: number;
}
export interface MazeCell {
  readonly x: number;
  readonly y: number;
  readonly open: boolean;
}
export interface MazeSolution {
  readonly cells: readonly MazeCell[];
  readonly path: readonly MazeCell[];
}
export interface MiniGameResult {
  readonly item: ItemKind;
  readonly seed: number;
  readonly tick: number;
  readonly maze: MazeSolution;
}

export const mazeProducer: MiniGameProducer = {
  id: 'maze-producer-v1',
  produce(input) {
    const maze = solveMaze(input.seed);
    return {
      item: maze.path.length % 2 === 0 ? 'ore' : 'coal',
      seed: input.seed,
      tick: input.tick,
      maze,
    };
  },
};

export function solveMaze(seed: number): MazeSolution {
  const required = [0, 1, 2, 5, 8];
  const cells = Array.from({ length: 9 }, (_, index) => ({
    x: index % 3,
    y: Math.floor(index / 3),
    open: required.includes(index) || ((seed >>> index) & 1) === 1,
  }));
  const path = required
    .map((index) => cells[index])
    .filter((cell): cell is MazeCell => cell !== undefined);
  return { cells, path };
}
