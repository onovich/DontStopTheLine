import type { NodeDefinition, Recipe } from '@dstl/domain';
import { isValidRecipe } from '@dstl/domain';

export const starterRecipe: Recipe = {
  id: 'smelt-ore',
  input: { kind: 'ore', quantity: 1 },
  output: { kind: 'plate', quantity: 1 },
  durationTicks: 3,
};

export const strategyRecipes: readonly Recipe[] = [
  starterRecipe,
  {
    id: 'assemble-gear',
    inputs: [
      { kind: 'plate', quantity: 1 },
      { kind: 'coal', quantity: 1 },
    ],
    output: { kind: 'gear', quantity: 1 },
    durationTicks: 4,
  },
];

export function recipeInputs(recipe: Recipe): readonly Recipe['output'][] {
  return recipe.inputs ?? (recipe.input === undefined ? [] : [recipe.input]);
}

export const starterNodes: readonly NodeDefinition[] = [
  { kind: 'source', inputCapacity: 0, outputCapacity: 2, workCapacity: 0 },
  { kind: 'advanced-producer', inputCapacity: 0, outputCapacity: 2, workCapacity: 1 },
  { kind: 'processor', inputCapacity: 2, outputCapacity: 2, workCapacity: 1 },
  { kind: 'storage', inputCapacity: 4, outputCapacity: 4, workCapacity: 0 },
  { kind: 'warehouse', inputCapacity: 8, outputCapacity: 8, workCapacity: 0 },
  { kind: 'router', inputCapacity: 4, outputCapacity: 4, workCapacity: 0 },
  { kind: 'seller', inputCapacity: 1, outputCapacity: 0, workCapacity: 1 },
];

export function hasValidStarterContent(): boolean {
  return strategyRecipes.every(isValidRecipe) && starterNodes.every(isValidNodeDefinition);
}

function isValidNodeDefinition(definition: NodeDefinition): boolean {
  return (
    definition.inputCapacity >= 0 && definition.outputCapacity >= 0 && definition.workCapacity >= 0
  );
}
