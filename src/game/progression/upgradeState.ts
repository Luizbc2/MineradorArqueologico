import {
  getUpgradeDefinition,
  upgradeIds,
} from "./upgradeCatalog";
import type {
  UpgradeDefinition,
  UpgradeEffectKind,
  UpgradeId,
} from "./upgradeCatalog";

export type UpgradeLevelState = {
  levels: Record<UpgradeId, number>;
};

export type UpgradeBonusSummary = {
  flatPower: number;
  speedMultiplier: number;
  backpackCapacity: number;
  saleMultiplier: number;
  chestCoinMultiplier: number;
  extraDropChance: number;
  comboWindowBonus: number;
  moveTempoBonus: number;
};

export type UpgradePurchaseResult =
  | {
      ok: true;
      state: UpgradeLevelState;
      coins: number;
      upgrade: UpgradeDefinition;
      level: number;
    }
  | {
      ok: false;
      reason: "max-level" | "not-enough-coins";
      state: UpgradeLevelState;
      coins: number;
      upgrade: UpgradeDefinition;
      level: number;
    };

export function createUpgradeLevelState(): UpgradeLevelState {
  return {
    levels: upgradeIds.reduce(
      (levels, id) => ({
        ...levels,
        [id]: 0,
      }),
      {} as Record<UpgradeId, number>,
    ),
  };
}

export function getUpgradeLevel(state: UpgradeLevelState, id: UpgradeId) {
  const rawLevel = state.levels[id] ?? 0;
  const level = Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 0;

  return clampLevel(level, getUpgradeDefinition(id).maxLevel);
}

export function getUpgradeCost(state: UpgradeLevelState, id: UpgradeId) {
  const upgrade = getUpgradeDefinition(id);
  const level = getUpgradeLevel(state, id);

  if (level >= upgrade.maxLevel) {
    return null;
  }

  return Math.round(upgrade.baseCost * upgrade.growth ** level);
}

export function getUpgradeEffectValue(
  state: UpgradeLevelState,
  id: UpgradeId,
) {
  return getUpgradeLevel(state, id) * getUpgradeDefinition(id).effectPerLevel;
}

export function getUpgradeBonusSummary(
  state: UpgradeLevelState,
): UpgradeBonusSummary {
  const summary = upgradeIds.reduce<UpgradeBonusSummary>(
    (summary, id) => {
      const upgrade = getUpgradeDefinition(id);
      const value = getUpgradeEffectValue(state, id);

      if (upgrade.effectKind === "flatPower") {
        summary.flatPower += value;
      } else if (upgrade.effectKind === "speedMultiplier") {
        summary.speedMultiplier += value;
      } else if (upgrade.effectKind === "backpackCapacity") {
        summary.backpackCapacity += value;
      } else if (upgrade.effectKind === "saleMultiplier") {
        summary.saleMultiplier += value;
      } else if (upgrade.effectKind === "chestCoinMultiplier") {
        summary.chestCoinMultiplier += value;
      } else if (upgrade.effectKind === "extraDropChance") {
        summary.extraDropChance += value;
      } else if (upgrade.effectKind === "comboWindowBonus") {
        summary.comboWindowBonus += value;
      } else {
        summary.moveTempoBonus += value;
      }

      return summary;
    },
    {
      flatPower: 0,
      speedMultiplier: 0,
      backpackCapacity: 0,
      saleMultiplier: 0,
      chestCoinMultiplier: 0,
      extraDropChance: 0,
      comboWindowBonus: 0,
      moveTempoBonus: 0,
    },
  );

  return clampUpgradeBonusSummary(summary);
}

export function canBuyUpgrade(
  state: UpgradeLevelState,
  id: UpgradeId,
  coins: number,
) {
  const cost = getUpgradeCost(state, id);
  return cost !== null && coins >= cost;
}

export function buyUpgrade(
  state: UpgradeLevelState,
  id: UpgradeId,
  coins: number,
): UpgradePurchaseResult {
  const upgrade = getUpgradeDefinition(id);
  const level = getUpgradeLevel(state, id);
  const cost = getUpgradeCost(state, id);

  if (cost === null) {
    return { ok: false, reason: "max-level", state, coins, upgrade, level };
  }

  if (coins < cost) {
    return { ok: false, reason: "not-enough-coins", state, coins, upgrade, level };
  }

  const nextLevel = level + 1;

  return {
    ok: true,
    coins: coins - cost,
    upgrade,
    level: nextLevel,
    state: {
      levels: {
        ...state.levels,
        [id]: nextLevel,
      },
    },
  };
}

export function normalizeUpgradeLevelState(
  state: Partial<UpgradeLevelState>,
): UpgradeLevelState {
  const fallback = createUpgradeLevelState();

  return {
    levels: upgradeIds.reduce(
      (levels, id) => {
        const upgrade = getUpgradeDefinition(id);
        const rawLevel = state.levels?.[id] ?? fallback.levels[id];
        const level = Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 0;

        return {
          ...levels,
          [id]: clampLevel(level, upgrade.maxLevel),
        };
      },
      {} as Record<UpgradeId, number>,
    ),
  };
}

function clampLevel(level: number, maxLevel: number) {
  return Math.min(maxLevel, Math.max(0, level));
}

function clampFinite(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function clampUpgradeBonusSummary(summary: UpgradeBonusSummary): UpgradeBonusSummary {
  return {
    flatPower: clampFinite(summary.flatPower, 0, getMaximumUpgradeEffect("flatPower")),
    speedMultiplier: clampFinite(summary.speedMultiplier, 0, getMaximumUpgradeEffect("speedMultiplier")),
    backpackCapacity: clampFinite(summary.backpackCapacity, 0, getMaximumUpgradeEffect("backpackCapacity")),
    saleMultiplier: clampFinite(summary.saleMultiplier, 0, getMaximumUpgradeEffect("saleMultiplier")),
    chestCoinMultiplier: clampFinite(summary.chestCoinMultiplier, 0, getMaximumUpgradeEffect("chestCoinMultiplier")),
    extraDropChance: clampFinite(summary.extraDropChance, 0, getMaximumUpgradeEffect("extraDropChance")),
    comboWindowBonus: clampFinite(summary.comboWindowBonus, 0, getMaximumUpgradeEffect("comboWindowBonus")),
    moveTempoBonus: clampFinite(summary.moveTempoBonus, 0, getMaximumUpgradeEffect("moveTempoBonus")),
  };
}

function getMaximumUpgradeEffect(effectKind: UpgradeEffectKind) {
  return upgradeIds.reduce((total, id) => {
    const upgrade = getUpgradeDefinition(id);

    return upgrade.effectKind === effectKind
      ? total + upgrade.effectPerLevel * upgrade.maxLevel
      : total;
  }, 0);
}
