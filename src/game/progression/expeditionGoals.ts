import { createResourceInventory, resourceKinds } from "../inventory/resourceInventory";
import type { ResourceInventory, ResourceKind } from "../inventory/resourceInventory";

export type ExpeditionPerks = {
  comboWindowBonus: number;
  miningSpeedBonus: number;
  moveTempoBonus: number;
};

type ExpeditionGoalType =
  | "depth"
  | "resource"
  | "chest"
  | "card"
  | "pickaxe"
  | "upgrade"
  | "coinsSold"
  | "surfaceReturnDepth";

type ExpeditionGoalDefinition = {
  id: string;
  title: string;
  description: string;
  rewardLabel: string;
  type: ExpeditionGoalType;
  target: number;
  resource?: ResourceKind;
  perk: Partial<ExpeditionPerks>;
};

export type ExpeditionProgressionState = {
  deepestDepth: number;
  maxReturnDepth: number;
  resources: ResourceInventory;
  chestsOpened: number;
  cardsFound: number;
  pickaxeLevel: number;
  upgradeLevels: number;
  coinsSold: number;
};

type GoalProgressView = {
  title: string;
  description: string;
  rewardLabel: string;
  current: number;
  target: number;
};

export type ExpeditionProgressionSnapshot = {
  rank: number;
  completedCount: number;
  totalGoals: number;
  progressLabel: string;
  perkSummary: string;
  activeGoal: GoalProgressView | null;
  nextGoal: GoalProgressView | null;
  newlyCompleted: Array<{
    title: string;
    rewardLabel: string;
  }>;
  perks: ExpeditionPerks;
};

const defaultPerks: ExpeditionPerks = {
  comboWindowBonus: 0,
  miningSpeedBonus: 0,
  moveTempoBonus: 0,
};

const expeditionGoals: ExpeditionGoalDefinition[] = [
  {
    id: "reach-20",
    title: "Primeira Camada",
    description: "Atinga 20m de profundidade.",
    rewardLabel: "Combo +0.20s",
    type: "depth",
    target: 20,
    perk: { comboWindowBonus: 0.2 },
  },
  {
    id: "collect-coal",
    title: "Pulmão da Mina",
    description: "Colete 8 unidades de carvão.",
    rewardLabel: "Mineração +6%",
    type: "resource",
    resource: "coal",
    target: 8,
    perk: { miningSpeedBonus: 0.06 },
  },
  {
    id: "open-chest",
    title: "Olho de Curador",
    description: "Abra 1 baú arqueológico.",
    rewardLabel: "Combo +0.15s",
    type: "chest",
    target: 1,
    perk: { comboWindowBonus: 0.15 },
  },
  {
    id: "find-cards",
    title: "Memória Viva",
    description: "Encontre 3 cards do codex.",
    rewardLabel: "Combo +0.20s",
    type: "card",
    target: 3,
    perk: { comboWindowBonus: 0.2 },
  },
  {
    id: "reach-60",
    title: "Fundo Chamando",
    description: "Atinga 60m de profundidade.",
    rewardLabel: "Velocidade de passo +8%",
    type: "depth",
    target: 60,
    perk: { moveTempoBonus: 0.08 },
  },
  {
    id: "upgrade-pickaxe",
    title: "Ferramenta Firme",
    description: "Leve a picareta ao nível 2.",
    rewardLabel: "Mineração +8%",
    type: "pickaxe",
    target: 2,
    perk: { miningSpeedBonus: 0.08 },
  },
  {
    id: "first-upgrades",
    title: "Oficina Ativa",
    description: "Compre 3 níveis de upgrades.",
    rewardLabel: "Velocidade de passo +5%",
    type: "upgrade",
    target: 3,
    perk: { moveTempoBonus: 0.05 },
  },
  {
    id: "collect-gold",
    title: "Veio Dourado",
    description: "Colete 4 unidades de ouro.",
    rewardLabel: "Velocidade de passo +6%",
    type: "resource",
    resource: "gold",
    target: 4,
    perk: { moveTempoBonus: 0.06 },
  },
  {
    id: "return-veteran",
    title: "Volte Vivo",
    description: "Retorne a base depois de chegar a 45m.",
    rewardLabel: "Combo +0.30s",
    type: "surfaceReturnDepth",
    target: 45,
    perk: { comboWindowBonus: 0.3 },
  },
  {
    id: "sell-500",
    title: "Primeiro Caixa",
    description: "Venda 500 moedas em minérios.",
    rewardLabel: "Velocidade de passo +5%",
    type: "coinsSold",
    target: 500,
    perk: { moveTempoBonus: 0.05 },
  },
  {
    id: "collect-diamond",
    title: "Brilho Azul",
    description: "Colete 3 diamantes.",
    rewardLabel: "Combo +0.25s",
    type: "resource",
    resource: "diamond",
    target: 3,
    perk: { comboWindowBonus: 0.25 },
  },
  {
    id: "open-8-chests",
    title: "Caçador de Baús",
    description: "Abra 8 baús arqueológicos.",
    rewardLabel: "Combo +0.25s",
    type: "chest",
    target: 8,
    perk: { comboWindowBonus: 0.25 },
  },
  {
    id: "gold-pickaxe",
    title: "Ferramenta Dourada",
    description: "Leve a picareta ao nível 5.",
    rewardLabel: "Mineração +8%",
    type: "pickaxe",
    target: 5,
    perk: { miningSpeedBonus: 0.08 },
  },
  {
    id: "reach-140",
    title: "Zona Profunda",
    description: "Atinga 140m de profundidade.",
    rewardLabel: "Mineração +10%",
    type: "depth",
    target: 140,
    perk: { miningSpeedBonus: 0.1 },
  },
  {
    id: "advanced-upgrades",
    title: "Oficina Forte",
    description: "Compre 12 níveis de upgrades.",
    rewardLabel: "Combo +0.25s",
    type: "upgrade",
    target: 12,
    perk: { comboWindowBonus: 0.25 },
  },
  {
    id: "collect-obsidian",
    title: "Pedra Negra",
    description: "Colete 3 unidades de obsidiana.",
    rewardLabel: "Velocidade de passo +6%",
    type: "resource",
    resource: "obsidian",
    target: 3,
    perk: { moveTempoBonus: 0.06 },
  },
  {
    id: "collect-crystal",
    title: "Cristal Vivo",
    description: "Colete 2 cristais.",
    rewardLabel: "Mineração +12%",
    type: "resource",
    resource: "crystal",
    target: 2,
    perk: { miningSpeedBonus: 0.12 },
  },
  {
    id: "return-220",
    title: "Rota Segura",
    description: "Retorne a base depois de chegar a 220m.",
    rewardLabel: "Mineração +10%",
    type: "surfaceReturnDepth",
    target: 220,
    perk: { miningSpeedBonus: 0.1 },
  },
  {
    id: "reach-320",
    title: "Camada Fóssil",
    description: "Atinga 320m de profundidade.",
    rewardLabel: "Velocidade de passo +6%",
    type: "depth",
    target: 320,
    perk: { moveTempoBonus: 0.06 },
  },
  {
    id: "collect-fossil",
    title: "Memória da Pedra",
    description: "Colete 2 fósseis.",
    rewardLabel: "Mineração +12%",
    type: "resource",
    resource: "fossil",
    target: 2,
    perk: { miningSpeedBonus: 0.12 },
  },
  {
    id: "ancient-crystal-pickaxe",
    title: "Catálogo Completo",
    description: "Leve a picareta ao nível 8.",
    rewardLabel: "Combo +0.35s",
    type: "pickaxe",
    target: 8,
    perk: { comboWindowBonus: 0.35 },
  },
  {
    id: "fossil-pickaxe",
    title: "Ferramenta Ancestral",
    description: "Leve a picareta ao nível 9.",
    rewardLabel: "Combo +0.30s",
    type: "pickaxe",
    target: 9,
    perk: { comboWindowBonus: 0.3 },
  },
  {
    id: "master-upgrades",
    title: "Oficina Mestra",
    description: "Compre 24 níveis de upgrades.",
    rewardLabel: "Mineração +10%",
    type: "upgrade",
    target: 24,
    perk: { miningSpeedBonus: 0.1 },
  },
  {
    id: "sell-5000",
    title: "Caixa Forte",
    description: "Venda 5.000 moedas em minérios.",
    rewardLabel: "Combo +0.25s",
    type: "coinsSold",
    target: 5000,
    perk: { comboWindowBonus: 0.25 },
  },
  {
    id: "reach-420",
    title: "Veio Prismático",
    description: "Atinga 420m de profundidade.",
    rewardLabel: "Mineração +12%",
    type: "depth",
    target: 420,
    perk: { miningSpeedBonus: 0.12 },
  },
  {
    id: "collect-prismatic",
    title: "Luz da Caverna",
    description: "Colete 2 minérios prismáticos.",
    rewardLabel: "Combo +0.30s",
    type: "resource",
    resource: "prismatic",
    target: 2,
    perk: { comboWindowBonus: 0.3 },
  },
  {
    id: "prismatic-pickaxe",
    title: "Ferramenta Radiante",
    description: "Leve a picareta ao nível 10.",
    rewardLabel: "Mineração +14%",
    type: "pickaxe",
    target: 10,
    perk: { miningSpeedBonus: 0.14 },
  },
  {
    id: "sell-20000",
    title: "Tesouro da Base",
    description: "Venda 20.000 moedas em minérios.",
    rewardLabel: "Velocidade de passo +8%",
    type: "coinsSold",
    target: 20000,
    perk: { moveTempoBonus: 0.08 },
  },
  {
    id: "expert-upgrades",
    title: "Oficina Especialista",
    description: "Compre 40 níveis de upgrades.",
    rewardLabel: "Combo +0.30s",
    type: "upgrade",
    target: 40,
    perk: { comboWindowBonus: 0.3 },
  },
  {
    id: "reach-560",
    title: "Mina Galáctica",
    description: "Atinga 560m de profundidade.",
    rewardLabel: "Mineração +14%",
    type: "depth",
    target: 560,
    perk: { miningSpeedBonus: 0.14 },
  },
  {
    id: "collect-galactic",
    title: "Estrela Enterrada",
    description: "Colete 2 minérios galácticos.",
    rewardLabel: "Combo +0.35s",
    type: "resource",
    resource: "galactic",
    target: 2,
    perk: { comboWindowBonus: 0.35 },
  },
  {
    id: "return-520",
    title: "Volta Impossível",
    description: "Retorne a base depois de chegar a 520m.",
    rewardLabel: "Velocidade de passo +8%",
    type: "surfaceReturnDepth",
    target: 520,
    perk: { moveTempoBonus: 0.08 },
  },
  {
    id: "galactic-pickaxe",
    title: "Catálogo Cósmico",
    description: "Leve a picareta ao nível 11.",
    rewardLabel: "Mineração +16%",
    type: "pickaxe",
    target: 11,
    perk: { miningSpeedBonus: 0.16 },
  },
  {
    id: "sell-50000",
    title: "Fortuna Profunda",
    description: "Venda 50.000 moedas em minérios.",
    rewardLabel: "Velocidade de passo +10%",
    type: "coinsSold",
    target: 50000,
    perk: { moveTempoBonus: 0.1 },
  },
  {
    id: "open-20-chests",
    title: "Curador da Mina",
    description: "Abra 20 baús arqueológicos.",
    rewardLabel: "Mineração +12%",
    type: "chest",
    target: 20,
    perk: { miningSpeedBonus: 0.12 },
  },
  {
    id: "legendary-upgrades",
    title: "Oficina Lendária",
    description: "Compre 60 níveis de upgrades.",
    rewardLabel: "Mineração +14%",
    type: "upgrade",
    target: 60,
    perk: { miningSpeedBonus: 0.14 },
  },
];

export function createDefaultExpeditionProgressionState(): ExpeditionProgressionState {
  return {
    deepestDepth: 0,
    maxReturnDepth: 0,
    resources: createResourceInventory(),
    chestsOpened: 0,
    cardsFound: 0,
    pickaxeLevel: 1,
    upgradeLevels: 0,
    coinsSold: 0,
  };
}

export function normalizeExpeditionProgressionState(
  state: Partial<ExpeditionProgressionState> = {},
): ExpeditionProgressionState {
  const defaults = createDefaultExpeditionProgressionState();

  return {
    deepestDepth: normalizePositiveInteger(state.deepestDepth),
    maxReturnDepth: normalizePositiveInteger(state.maxReturnDepth),
    resources: normalizeResourceProgress(state.resources),
    chestsOpened: normalizePositiveInteger(state.chestsOpened),
    cardsFound: normalizePositiveInteger(state.cardsFound),
    pickaxeLevel: Math.max(1, normalizePositiveInteger(state.pickaxeLevel) || defaults.pickaxeLevel),
    upgradeLevels: normalizePositiveInteger(state.upgradeLevels),
    coinsSold: normalizePositiveInteger(state.coinsSold),
  };
}

export function createExpeditionProgression(initialState?: Partial<ExpeditionProgressionState>) {
  const stats = normalizeExpeditionProgressionState(initialState);

  let completedCount = 0;
  const perks: ExpeditionPerks = { ...defaultPerks };

  const buildSnapshot = (
    newlyCompleted: Array<{
      title: string;
      rewardLabel: string;
    }> = [],
  ): ExpeditionProgressionSnapshot => ({
    rank: completedCount + 1,
    completedCount,
    totalGoals: expeditionGoals.length,
    progressLabel: `${completedCount}/${expeditionGoals.length} metas`,
    perkSummary: buildPerkSummary(perks),
    activeGoal: toGoalView(expeditionGoals[completedCount], stats),
    nextGoal: toGoalView(expeditionGoals[completedCount + 1], stats),
    newlyCompleted,
    perks: { ...perks },
  });

  resolveProgress(() => buildSnapshot([]));

  return {
    applyDepth(depth: number) {
      stats.deepestDepth = Math.max(stats.deepestDepth, depth);
      return resolveProgress(buildSnapshot);
    },
    applyResource(resource: ResourceKind, amount = 1) {
      stats.resources[resource] += amount;
      return resolveProgress(buildSnapshot);
    },
    applyChestOpened() {
      stats.chestsOpened += 1;
      return resolveProgress(buildSnapshot);
    },
    applyCardFound() {
      stats.cardsFound += 1;
      return resolveProgress(buildSnapshot);
    },
    applyPickaxeLevel(level: number) {
      stats.pickaxeLevel = Math.max(stats.pickaxeLevel, level);
      return resolveProgress(buildSnapshot);
    },
    applyUpgradeLevels(levels: number) {
      stats.upgradeLevels = Math.max(stats.upgradeLevels, levels);
      return resolveProgress(buildSnapshot);
    },
    applyCoinsSold(coins: number) {
      stats.coinsSold += Math.max(0, Math.floor(coins));
      return resolveProgress(buildSnapshot);
    },
    applySurfaceReturn(fromDepth: number) {
      stats.maxReturnDepth = Math.max(stats.maxReturnDepth, fromDepth);
      return resolveProgress(buildSnapshot);
    },
    getSnapshot() {
      return buildSnapshot();
    },
    getState() {
      return cloneStats(stats);
    },
  };

  function resolveProgress(build: typeof buildSnapshot) {
    const newlyCompleted: Array<{
      title: string;
      rewardLabel: string;
    }> = [];

    while (completedCount < expeditionGoals.length) {
      const activeGoal = expeditionGoals[completedCount];

      if (!isGoalComplete(activeGoal, stats)) {
        break;
      }

      completedCount += 1;
      applyPerk(perks, activeGoal.perk);
      newlyCompleted.push({
        title: activeGoal.title,
        rewardLabel: activeGoal.rewardLabel,
      });
    }

    return build(newlyCompleted);
  }
}

function isGoalComplete(goal: ExpeditionGoalDefinition, stats: ExpeditionProgressionState) {
  switch (goal.type) {
    case "depth":
      return stats.deepestDepth >= goal.target;
    case "resource":
      return goal.resource ? stats.resources[goal.resource] >= goal.target : false;
    case "chest":
      return stats.chestsOpened >= goal.target;
    case "card":
      return stats.cardsFound >= goal.target;
    case "pickaxe":
      return stats.pickaxeLevel >= goal.target;
    case "upgrade":
      return stats.upgradeLevels >= goal.target;
    case "coinsSold":
      return stats.coinsSold >= goal.target;
    case "surfaceReturnDepth":
      return stats.maxReturnDepth >= goal.target;
  }
}

function getGoalCurrent(goal: ExpeditionGoalDefinition, stats: ExpeditionProgressionState) {
  switch (goal.type) {
    case "depth":
      return stats.deepestDepth;
    case "resource":
      return goal.resource ? stats.resources[goal.resource] : 0;
    case "chest":
      return stats.chestsOpened;
    case "card":
      return stats.cardsFound;
    case "pickaxe":
      return stats.pickaxeLevel;
    case "upgrade":
      return stats.upgradeLevels;
    case "coinsSold":
      return stats.coinsSold;
    case "surfaceReturnDepth":
      return stats.maxReturnDepth;
  }
}

function toGoalView(goal: ExpeditionGoalDefinition | undefined, stats: ExpeditionProgressionState): GoalProgressView | null {
  if (!goal) {
    return null;
  }

  return {
    title: goal.title,
    description: goal.description,
    rewardLabel: goal.rewardLabel,
    current: Math.min(goal.target, getGoalCurrent(goal, stats)),
    target: goal.target,
  };
}

function cloneStats(stats: ExpeditionProgressionState): ExpeditionProgressionState {
  return {
    ...stats,
    resources: { ...stats.resources },
  };
}

function normalizeResourceProgress(resources: Partial<ResourceInventory> | undefined) {
  return resourceKinds.reduce<ResourceInventory>(
    (normalized, resource) => ({
      ...normalized,
      [resource]: normalizePositiveInteger(resources?.[resource]),
    }),
    createResourceInventory(),
  );
}

function normalizePositiveInteger(value: unknown) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0;
}

function applyPerk(perks: ExpeditionPerks, next: Partial<ExpeditionPerks>) {
  perks.comboWindowBonus += next.comboWindowBonus ?? 0;
  perks.miningSpeedBonus += next.miningSpeedBonus ?? 0;
  perks.moveTempoBonus += next.moveTempoBonus ?? 0;
}

function buildPerkSummary(perks: ExpeditionPerks) {
  const parts: string[] = [];

  if (perks.comboWindowBonus > 0) {
    parts.push(`Combo +${perks.comboWindowBonus.toFixed(2)}s`);
  }

  if (perks.miningSpeedBonus > 0) {
    parts.push(`Mineração +${Math.round(perks.miningSpeedBonus * 100)}%`);
  }

  if (perks.moveTempoBonus > 0) {
    parts.push(`Passo +${Math.round(perks.moveTempoBonus * 100)}%`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Sem bônus ativos";
}
