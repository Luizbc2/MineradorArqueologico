import type { TileKind } from "../world/types";

export const resourceKinds = ["coal", "iron", "gold", "diamond", "obsidian", "crystal"] as const;

export type ResourceKind = (typeof resourceKinds)[number];
export type ResourceInventory = Record<ResourceKind, number>;
export type ResourceTier = "common" | "uncommon" | "rare" | "legendary" | "mythic";

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
  obsidian: "obsidian",
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
  obsidian: {
    label: "Obsidiana",
    tier: "legendary",
    value: 6,
    accent: "#b7a3f2",
  },
  crystal: {
    label: "Cristal",
    tier: "mythic",
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
    obsidian: 0,
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
    case "mythic":
      return "Mítico";
  }
}
