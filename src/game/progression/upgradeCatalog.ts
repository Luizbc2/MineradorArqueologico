export const upgradeIds = [
  "power",
  "speed",
  "backpack",
  "saleValue",
  "chestValue",
  "yieldChance",
  "comboFocus",
  "stepSpeed",
] as const;

Object.freeze(upgradeIds);

export type UpgradeId = (typeof upgradeIds)[number];

export type UpgradeEffectKind =
  | "flatPower"
  | "speedMultiplier"
  | "backpackCapacity"
  | "saleMultiplier"
  | "chestCoinMultiplier"
  | "extraDropChance"
  | "comboWindowBonus"
  | "moveTempoBonus";

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
    description: "Ajuda a quebrar blocos mais duros nas camadas profundas.",
    baseCost: 120,
    growth: 1.45,
    effectKind: "flatPower",
    effectPerLevel: 6,
    maxLevel: 26,
  },
  speed: {
    id: "speed",
    name: "Mais Velocidade",
    description: "Reduz o tempo para terminar cada bloco.",
    baseCost: 160,
    growth: 1.5,
    effectKind: "speedMultiplier",
    effectPerLevel: 0.04,
    maxLevel: 20,
  },
  backpack: {
    id: "backpack",
    name: "Mochila Maior",
    description: "Aumenta o espaço para carregar minérios.",
    baseCost: 90,
    growth: 1.32,
    effectKind: "backpackCapacity",
    effectPerLevel: 6,
    maxLevel: 24,
  },
  saleValue: {
    id: "saleValue",
    name: "Venda Melhor",
    description: "Faz cada venda render mais moedas.",
    baseCost: 180,
    growth: 1.48,
    effectKind: "saleMultiplier",
    effectPerLevel: 0.05,
    maxLevel: 16,
  },
  chestValue: {
    id: "chestValue",
    name: "Baús Melhores",
    description: "Aumenta as moedas encontradas nos baús.",
    baseCost: 220,
    growth: 1.5,
    effectKind: "chestCoinMultiplier",
    effectPerLevel: 0.08,
    maxLevel: 10,
  },
  yieldChance: {
    id: "yieldChance",
    name: "Mais Rendimento",
    description: "Dá chance de ganhar um minério extra.",
    baseCost: 260,
    growth: 1.52,
    effectKind: "extraDropChance",
    effectPerLevel: 0.025,
    maxLevel: 12,
  },
  comboFocus: {
    id: "comboFocus",
    name: "Combo Maior",
    description: "Mantém o combo ativo por mais tempo.",
    baseCost: 210,
    growth: 1.46,
    effectKind: "comboWindowBonus",
    effectPerLevel: 0.12,
    maxLevel: 12,
  },
  stepSpeed: {
    id: "stepSpeed",
    name: "Velocidade de Passo",
    description: "Deixa o movimento pela mina mais rápido.",
    baseCost: 240,
    growth: 1.5,
    effectKind: "moveTempoBonus",
    effectPerLevel: 0.025,
    maxLevel: 10,
  },
};

for (const upgrade of Object.values(upgradeCatalog)) {
  Object.freeze(upgrade);
}

Object.freeze(upgradeCatalog);

export function getUpgradeDefinition(id: UpgradeId) {
  return upgradeCatalog[id];
}

export function getUpgradeList() {
  return upgradeIds.map((id) => upgradeCatalog[id]);
}
