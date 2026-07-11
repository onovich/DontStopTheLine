export type EntityId = string;
export type ItemKind = 'ore' | 'plate';
export type NodeKind = 'source' | 'processor' | 'storage' | 'seller';

export interface ItemStack {
  readonly kind: ItemKind;
  readonly quantity: number;
}

export interface Recipe {
  readonly id: string;
  readonly input: ItemStack;
  readonly output: ItemStack;
  readonly durationTicks: number;
}

export interface NodeDefinition {
  readonly kind: NodeKind;
  readonly inputCapacity: number;
  readonly outputCapacity: number;
  readonly workCapacity: number;
}

export type Command =
  | { readonly type: 'place-node'; readonly nodeId: EntityId; readonly nodeKind: NodeKind }
  | { readonly type: 'remove-node'; readonly nodeId: EntityId }
  | {
      readonly type: 'connect-line';
      readonly lineId: EntityId;
      readonly from: EntityId;
      readonly to: EntityId;
    }
  | { readonly type: 'disconnect-line'; readonly lineId: EntityId }
  | { readonly type: 'advance-ticks'; readonly ticks: number };

export type DomainEvent =
  | { readonly type: 'node-placed'; readonly nodeId: EntityId; readonly nodeKind: NodeKind }
  | { readonly type: 'node-removed'; readonly nodeId: EntityId }
  | { readonly type: 'line-connected'; readonly lineId: EntityId }
  | { readonly type: 'line-disconnected'; readonly lineId: EntityId }
  | { readonly type: 'production-completed'; readonly nodeId: EntityId; readonly item: ItemKind }
  | {
      readonly type: 'command-rejected';
      readonly command: Command;
      readonly reason: RejectionReason;
    };

export type RejectionReason =
  'DUPLICATE_ID' | 'UNKNOWN_NODE' | 'UNKNOWN_LINE' | 'INVALID_TICK_COUNT' | 'INVALID_COMMAND';

export function isValidRecipe(recipe: Recipe): boolean {
  return (
    recipe.input.quantity > 0 &&
    recipe.output.quantity > 0 &&
    recipe.durationTicks > 0 &&
    recipe.input.kind !== recipe.output.kind
  );
}
