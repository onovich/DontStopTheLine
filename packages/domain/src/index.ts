export type EntityId = string;
export type ItemKind = 'ore' | 'coal' | 'plate' | 'gear';
export type NodeKind =
  'source' | 'advanced-producer' | 'processor' | 'storage' | 'warehouse' | 'router' | 'seller';

export interface ItemStack {
  readonly kind: ItemKind;
  readonly quantity: number;
}

export interface Recipe {
  readonly id: string;
  /** Legacy single input retained for Phase 0 command/content compatibility. */
  readonly input?: ItemStack;
  readonly inputs?: readonly ItemStack[];
  readonly output: ItemStack;
  readonly durationTicks: number;
}

export interface NodeDefinition {
  readonly kind: NodeKind;
  readonly inputCapacity: number;
  readonly outputCapacity: number;
  readonly workCapacity: number;
}

export type RoutingStrategy = 'overflow' | 'priority' | 'even';

export type Command =
  | {
      readonly type: 'place-node';
      readonly nodeId: EntityId;
      readonly nodeKind: NodeKind;
      readonly outputKind?: ItemKind;
      readonly recipeId?: string;
    }
  | { readonly type: 'remove-node'; readonly nodeId: EntityId }
  | {
      readonly type: 'connect-line';
      readonly lineId: EntityId;
      readonly from: EntityId;
      readonly to: EntityId;
      readonly capacity?: number;
    }
  | { readonly type: 'disconnect-line'; readonly lineId: EntityId }
  | { readonly type: 'set-routing'; readonly nodeId: EntityId; readonly strategy: RoutingStrategy }
  | { readonly type: 'upgrade-node'; readonly nodeId: EntityId }
  | { readonly type: 'sell-node'; readonly nodeId: EntityId }
  | { readonly type: 'advance-ticks'; readonly ticks: number };

export type DomainEvent =
  | { readonly type: 'node-placed'; readonly nodeId: EntityId; readonly nodeKind: NodeKind }
  | { readonly type: 'node-removed'; readonly nodeId: EntityId }
  | { readonly type: 'line-connected'; readonly lineId: EntityId }
  | { readonly type: 'line-disconnected'; readonly lineId: EntityId }
  | { readonly type: 'routing-set'; readonly nodeId: EntityId; readonly strategy: RoutingStrategy }
  | { readonly type: 'node-upgraded'; readonly nodeId: EntityId; readonly level: number }
  | { readonly type: 'node-sold'; readonly nodeId: EntityId; readonly refund: number }
  | { readonly type: 'production-completed'; readonly nodeId: EntityId; readonly item: ItemKind }
  | { readonly type: 'item-dispatched'; readonly lineId: EntityId; readonly item: ItemKind }
  | { readonly type: 'item-arrived'; readonly lineId: EntityId; readonly item: ItemKind }
  | { readonly type: 'item-sold'; readonly nodeId: EntityId; readonly amount: number }
  | {
      readonly type: 'command-rejected';
      readonly command: Command;
      readonly reason: RejectionReason;
    };

export type RejectionReason =
  | 'DUPLICATE_ID'
  | 'UNKNOWN_NODE'
  | 'UNKNOWN_LINE'
  | 'INVALID_TICK_COUNT'
  | 'INVALID_COMMAND'
  | 'INVALID_CONNECTION'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_UPGRADE';

export function isValidRecipe(recipe: Recipe): boolean {
  const inputs = recipe.inputs ?? (recipe.input === undefined ? [] : [recipe.input]);
  return (
    inputs.length > 0 &&
    inputs.every((input) => input.quantity > 0) &&
    recipe.output.quantity > 0 &&
    recipe.durationTicks > 0 &&
    inputs.some((input) => input.kind !== recipe.output.kind)
  );
}
