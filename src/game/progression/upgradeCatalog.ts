export const upgradeIds = [
  "power",
  "speed",
] as const;

export type UpgradeId = (typeof upgradeIds)[number];

export type UpgradeEffectKind = "flatPower" | "speedMultiplier";

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
    name: "Núcleo de Impacto",
    description: "Instala um contrapeso na cabeça da picareta para rachar blocos duros com menos golpes.",
    baseCost: 120,
    growth: 1.45,
    effectKind: "flatPower",
    effectPerLevel: 6,
    maxLevel: 20,
  },
  speed: {
    id: "speed",
    name: "Cabo Balanceado",
    description: "Ajusta a pegada e o peso do cabo para acelerar o ritmo de escavação sem perder controle.",
    baseCost: 160,
    growth: 1.5,
    effectKind: "speedMultiplier",
    effectPerLevel: 0.04,
    maxLevel: 15,
  },
};

export function getUpgradeDefinition(id: UpgradeId) {
  return upgradeCatalog[id];
}

export function getUpgradeList() {
  return upgradeIds.map((id) => upgradeCatalog[id]);
}
