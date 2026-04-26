import type { TileKind } from "../world/types";

export const resourceKinds = ["coal", "iron", "gold", "diamond", "crystal"] as const;

export type ResourceKind = (typeof resourceKinds)[number];
export type ResourceInventory = Record<ResourceKind, number>;
export type ResourceTier = "common" | "uncommon" | "rare" | "legendary";

type ResourceMeta = {
  label: string;
  tier: ResourceTier;
  value: number;
  accent: string;
};

const tileToResourceMap: Partial<Record<TileKind, ResourceKind>> = {
  coal: "coal",
  iron: "iron",
  gold: "gold",
  diamond: "diamond",
  crystal: "crystal",
};

const resourceMetaMap: Record<ResourceKind, ResourceMeta> = {
  coal: {
    label: "Carvão",
    tier: "common",
    value: 1,
    accent: "#cfd9e2",
  },
  iron: {
    label: "Ferro",
    tier: "uncommon",
    value: 2,
    accent: "#f4c69a",
  },
  gold: {
    label: "Ouro",
    tier: "rare",
    value: 3,
    accent: "#ffe28a",
  },
  diamond: {
    label: "Diamante",
    tier: "legendary",
    value: 5,
    accent: "#b8f7fa",
  },
  crystal: {
    label: "Cristal",
    tier: "legendary",
    value: 8,
    accent: "#d9c5ff",
  },
};

export function createResourceInventory(): ResourceInventory {
  return {
    coal: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
    crystal: 0,
  };
}

export function getResourceFromTile(kind: TileKind): ResourceKind | null {
  return tileToResourceMap[kind] ?? null;
}

export function getResourceLabel(resource: ResourceKind): string {
  return resourceMetaMap[resource].label;
}

export function getResourceMeta(resource: ResourceKind): ResourceMeta {
  return resourceMetaMap[resource];
}

export function getResourceTierLabel(tier: ResourceTier): string {
  switch (tier) {
    case "common":
      return "Comum";
    case "uncommon":
      return "Incomum";
    case "rare":
      return "Raro";
    case "legendary":
      return "Lendário";
  }
}
