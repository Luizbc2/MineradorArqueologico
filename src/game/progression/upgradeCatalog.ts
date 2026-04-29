export const upgradeIds = [
  "power",
  "speed",
  "backpack",
] as const;

export type UpgradeId = (typeof upgradeIds)[number];

export type UpgradeEffectKind = "flatPower" | "speedMultiplier" | "backpackCapacity";

export type UpgradeDefinition = {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  growth: number;
  effectKind: UpgradeEffectKind;
  effectPerLevel: number;
  maxLevel: number;
};

export const upgradeCatalog: Record<UpgradeId, UpgradeDefinition> = {
  power: {
    id: "power",
    name: "Mais Força",
    description: "Aumenta a força da picareta para quebrar blocos mais duros.",
    baseCost: 120,
    growth: 1.45,
    effectKind: "flatPower",
    effectPerLevel: 6,
    maxLevel: 20,
  },
  speed: {
    id: "speed",
    name: "Mais Velocidade",
    description: "Aumenta a velocidade de mineração da picareta.",
    baseCost: 160,
    growth: 1.5,
    effectKind: "speedMultiplier",
    effectPerLevel: 0.04,
    maxLevel: 15,
  },
  backpack: {
    id: "backpack",
    name: "Mochila Maior",
    description: "Aumenta a quantidade de minérios que você pode carregar.",
    baseCost: 90,
    growth: 1.32,
    effectKind: "backpackCapacity",
    effectPerLevel: 6,
    maxLevel: 18,
  },
};

export function getUpgradeDefinition(id: UpgradeId) {
  return upgradeCatalog[id];
}

export function getUpgradeList() {
  return upgradeIds.map((id) => upgradeCatalog[id]);
}
