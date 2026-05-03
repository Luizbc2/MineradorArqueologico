export const pickaxeIds = [
  "wood",
  "stone",
  "copper",
  "iron",
  "gold",
  "diamond",
  "obsidian",
  "ancientCrystal",
  "fossil",
  "prismatic",
  "galactic",
] as const;

export type PickaxeId = (typeof pickaxeIds)[number];

export type PickaxeDefinition = {
  id: PickaxeId;
  name: string;
  tier: number;
  cost: number;
  power: number;
  baseSpeed: number;
  unlockDepth: number;
};

export const pickaxeCatalog: Record<PickaxeId, PickaxeDefinition> = {
  wood: {
    id: "wood",
    name: "Picareta de Madeira",
    tier: 1,
    cost: 0,
    power: 15,
    baseSpeed: 1,
    unlockDepth: 0,
  },
  stone: {
    id: "stone",
    name: "Picareta de Pedra",
    tier: 2,
    cost: 80,
    power: 30,
    baseSpeed: 1.04,
    unlockDepth: 12,
  },
  copper: {
    id: "copper",
    name: "Picareta de Cobre",
    tier: 3,
    cost: 180,
    power: 55,
    baseSpeed: 1.08,
    unlockDepth: 30,
  },
  iron: {
    id: "iron",
    name: "Picareta de Ferro",
    tier: 4,
    cost: 380,
    power: 90,
    baseSpeed: 1.14,
    unlockDepth: 55,
  },
  gold: {
    id: "gold",
    name: "Picareta de Ouro",
    tier: 5,
    cost: 720,
    power: 140,
    baseSpeed: 1.22,
    unlockDepth: 85,
  },
  diamond: {
    id: "diamond",
    name: "Picareta de Diamante",
    tier: 6,
    cost: 1280,
    power: 220,
    baseSpeed: 1.32,
    unlockDepth: 120,
  },
  obsidian: {
    id: "obsidian",
    name: "Picareta de Obsidiana",
    tier: 7,
    cost: 2200,
    power: 340,
    baseSpeed: 1.42,
    unlockDepth: 150,
  },
  ancientCrystal: {
    id: "ancientCrystal",
    name: "Picareta de Cristal Antigo",
    tier: 8,
    cost: 3600,
    power: 520,
    baseSpeed: 1.55,
    unlockDepth: 220,
  },
  fossil: {
    id: "fossil",
    name: "Picareta Fóssil",
    tier: 9,
    cost: 6200,
    power: 780,
    baseSpeed: 1.68,
    unlockDepth: 320,
  },
  prismatic: {
    id: "prismatic",
    name: "Picareta Prismática",
    tier: 10,
    cost: 9800,
    power: 1150,
    baseSpeed: 1.82,
    unlockDepth: 420,
  },
  galactic: {
    id: "galactic",
    name: "Picareta Galáctica",
    tier: 11,
    cost: 16000,
    power: 1750,
    baseSpeed: 2,
    unlockDepth: 560,
  },
};

export function getPickaxeDefinition(id: PickaxeId) {
  return pickaxeCatalog[id];
}

export function getPickaxeList() {
  return pickaxeIds.map((id) => pickaxeCatalog[id]);
}
