import type { ResourceInventory } from "../inventory/resourceInventory";

export type PickaxeUpgradeCost = Pick<
  ResourceInventory,
  "iron" | "gold" | "diamond"
>;

export function getPickaxeUpgradeCost(level: number): PickaxeUpgradeCost {
  return {
    iron: Math.max(0, Math.ceil(1 * level * 0.9)),
    gold: Math.max(0, Math.ceil(level >= 2 ? (level - 1) * 0.8 : 0)),
    diamond: level >= 4 ? 1 : 0,
  };
}

export function canAffordPickaxeUpgrade(
  inventory: ResourceInventory,
  cost: PickaxeUpgradeCost,
) {
  return (
    inventory.iron >= cost.iron &&
    inventory.gold >= cost.gold &&
    inventory.diamond >= cost.diamond
  );
}
