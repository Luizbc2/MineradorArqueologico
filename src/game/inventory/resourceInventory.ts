import type { TileKind } from "../world/types";

export const resourceKinds = ["coal", "iron", "gold", "diamond"] as const;

export type ResourceKind = (typeof resourceKinds)[number];
export type ResourceInventory = Record<ResourceKind, number>;

const tileToResourceMap: Partial<Record<TileKind, ResourceKind>> = {
  coal: "coal",
  iron: "iron",
  gold: "gold",
  diamond: "diamond",
};

export function createResourceInventory(): ResourceInventory {
  return {
    coal: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
  };
}

export function getResourceFromTile(kind: TileKind): ResourceKind | null {
  return tileToResourceMap[kind] ?? null;
}

export function getResourceLabel(resource: ResourceKind): string {
  switch (resource) {
    case "coal":
      return "Carvao";
    case "iron":
      return "Ferro";
    case "gold":
      return "Ouro";
    case "diamond":
      return "Diamante";
  }
}
