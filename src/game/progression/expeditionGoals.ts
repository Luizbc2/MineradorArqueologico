import type { ResourceKind } from "../inventory/resourceInventory";

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
  resources: Record<ResourceKind, number>;
  chestsOpened: number;
  cardsFound: number;
  pickaxeLevel: number;
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
    id: "reach-140",
    title: "Zona Profunda",
    description: "Atinga 140m de profundidade.",
    rewardLabel: "Mineração +10%",
    type: "depth",
    target: 140,
    perk: { miningSpeedBonus: 0.1 },
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
];

export function createDefaultExpeditionProgressionState(): ExpeditionProgressionState {
  return {
    deepestDepth: 0,
    maxReturnDepth: 0,
    resources: {
      coal: 0,
      iron: 0,
      gold: 0,
      diamond: 0,
      crystal: 0,
    },
    chestsOpened: 0,
    cardsFound: 0,
    pickaxeLevel: 1,
  };
}

export function normalizeExpeditionProgressionState(
  state: Partial<ExpeditionProgressionState> = {},
): ExpeditionProgressionState {
  const defaults = createDefaultExpeditionProgressionState();

  return {
    deepestDepth: normalizePositiveInteger(state.deepestDepth),
    maxReturnDepth: normalizePositiveInteger(state.maxReturnDepth),
    resources: {
      coal: normalizePositiveInteger(state.resources?.coal),
      iron: normalizePositiveInteger(state.resources?.iron),
      gold: normalizePositiveInteger(state.resources?.gold),
      diamond: normalizePositiveInteger(state.resources?.diamond),
      crystal: normalizePositiveInteger(state.resources?.crystal),
    },
    chestsOpened: normalizePositiveInteger(state.chestsOpened),
    cardsFound: normalizePositiveInteger(state.cardsFound),
    pickaxeLevel: Math.max(1, normalizePositiveInteger(state.pickaxeLevel) || defaults.pickaxeLevel),
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
