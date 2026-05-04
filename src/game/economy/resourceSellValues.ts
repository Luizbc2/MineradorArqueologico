import {
  getResourceLabel,
  resourceKinds,
} from "../inventory/resourceInventory";
import type {
  ResourceInventory,
  ResourceKind,
} from "../inventory/resourceInventory";

export type InventorySaleLine = {
  resource: ResourceKind;
  label: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type InventorySaleSummary = {
  lines: InventorySaleLine[];
  totalCoins: number;
};

export const resourceSellValues: Record<ResourceKind, number> = {
  coal: 4,
  iron: 9,
  gold: 18,
  diamond: 42,
  obsidian: 64,
  crystal: 92,
  fossil: 128,
  prismatic: 185,
  galactic: 280,
};

export function getResourceSellValue(resource: ResourceKind) {
  return resourceSellValues[resource];
}

export function hasSellableResources(inventory: ResourceInventory) {
  return resourceKinds.some((resource) => inventory[resource] > 0);
}

export function getInventorySaleSummary(
  inventory: ResourceInventory,
  valueMultiplier = 1,
): InventorySaleSummary {
  const lines = resourceKinds
    .map((resource) => {
      const quantity = inventory[resource];
      const unitPrice = Math.max(1, Math.round(getResourceSellValue(resource) * valueMultiplier));

      return {
        resource,
        label: getResourceLabel(resource),
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      };
    })
    .filter((line) => line.quantity > 0)
    .sort((left, right) => {
      if (right.totalPrice !== left.totalPrice) {
        return right.totalPrice - left.totalPrice;
      }

      return right.unitPrice - left.unitPrice;
    });

  return {
    lines,
    totalCoins: lines.reduce((total, line) => total + line.totalPrice, 0),
  };
}
