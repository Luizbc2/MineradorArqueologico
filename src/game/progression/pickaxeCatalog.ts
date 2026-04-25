export const pickaxeIds = [
  "worn",
  "copper",
  "iron",
  "steel",
  "titanium",
] as const;

export type PickaxeId = (typeof pickaxeIds)[number];

export type PickaxeDefinition = {
  id: PickaxeId;
  name: string;
  tier: number;
  cost: number;
  basePower: number;
  baseSpeed: number;
  unlockDepth: number;
};

export const pickaxeCatalog: Record<PickaxeId, PickaxeDefinition> = {
  worn: {
    id: "worn",
    name: "Picareta Gasta",
    tier: 1,
    cost: 0,
    basePower: 1,
    baseSpeed: 1,
    unlockDepth: 0,
  },
  copper: {
    id: "copper",
    name: "Picareta de Cobre",
    tier: 2,
    cost: 90,
    basePower: 1.35,
    baseSpeed: 1.08,
    unlockDepth: 25,
  },
  iron: {
    id: "iron",
    name: "Picareta de Ferro",
    tier: 3,
    cost: 240,
    basePower: 1.8,
    baseSpeed: 1.16,
    unlockDepth: 55,
  },
  steel: {
    id: "steel",
    name: "Picareta de Aco",
    tier: 4,
    cost: 520,
    basePower: 2.35,
    baseSpeed: 1.24,
    unlockDepth: 90,
  },
  titanium: {
    id: "titanium",
    name: "Picareta de Titanio",
    tier: 5,
    cost: 980,
    basePower: 3.1,
    baseSpeed: 1.34,
    unlockDepth: 135,
  },
};

export function getPickaxeDefinition(id: PickaxeId) {
  return pickaxeCatalog[id];
}

export function getPickaxeList() {
  return pickaxeIds.map((id) => pickaxeCatalog[id]);
}
