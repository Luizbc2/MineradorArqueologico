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
  diamond: 34,
  crystal: 62,
};

export function getResourceSellValue(resource: ResourceKind) {
  return resourceSellValues[resource];
}

export function hasSellableResources(inventory: ResourceInventory) {
  return resourceKinds.some((resource) => inventory[resource] > 0);
}

export function getInventorySaleSummary(inventory: ResourceInventory): InventorySaleSummary {
  const lines = resourceKinds
    .map((resource) => {
      const quantity = inventory[resource];
      const unitPrice = getResourceSellValue(resource);

      return {
        resource,
        label: getResourceLabel(resource),
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      };
    })
    .filter((line) => line.quantity > 0);

  return {
    lines,
    totalCoins: lines.reduce((total, line) => total + line.totalPrice, 0),
  };
}
