import {
  createDefaultArchaeologyDeckState,
  normalizeArchaeologyDeckState,
} from "../archaeology/archaeologyCards";
import type { ArchaeologyDeckState } from "../archaeology/archaeologyCards";
import {
  createResourceInventory,
  resourceKinds,
} from "../inventory/resourceInventory";
import type { ResourceInventory } from "../inventory/resourceInventory";
import { getResourceSellValue } from "../economy/resourceSellValues";
import {
  getPickaxeList,
} from "../progression/pickaxeCatalog";
import type { PickaxeId } from "../progression/pickaxeCatalog";
import {
  createPickaxeOwnershipState,
  normalizePickaxeOwnershipState,
} from "../progression/pickaxeState";
import type { PickaxeOwnershipState } from "../progression/pickaxeState";
import {
  getUpgradeList,
} from "../progression/upgradeCatalog";
import {
  createUpgradeLevelState,
  getUpgradeCost,
  getUpgradeLevel,
  getUpgradeBonusSummary,
  normalizeUpgradeLevelState,
} from "../progression/upgradeState";
import type { UpgradeLevelState } from "../progression/upgradeState";
import {
  createDefaultExpeditionProgressionState,
  normalizeExpeditionProgressionState,
} from "../progression/expeditionGoals";
import type { ExpeditionProgressionState } from "../progression/expeditionGoals";
import {
  SURFACE_ROW,
  WORLD_HEIGHT_TILES,
} from "../world/constants";

const LEGACY_SAVE_KEYS = [
  "minerador-arqueologico:progression:v1",
  "minerador-arqueologico:progression:v3",
  "minerador-arqueologico:progression:v4",
] as const;
const SAVE_KEY = "minerador-arqueologico:progression:v5";
const SAVE_VERSION = 5;
const SAVE_CHECKSUM_SALT = "minerador-arqueologico-save-v5";
const MAX_SAVED_COINS = 250_000;
const BASE_BACKPACK_CAPACITY = 24;
const MAX_SAVED_DEPTH = WORLD_HEIGHT_TILES - SURFACE_ROW - 1;
const MAX_SALE_MULTIPLIER_AUDIT = 4;
const MAX_CHEST_MULTIPLIER_AUDIT = 2.8;
const MAX_CARDS_FROM_CHESTS_RATIO = 1;
const CHEST_AUDIT_BASE = 12;
const CHEST_AUDIT_PER_DEPTH = 0.22;
const RESOURCE_MIN_DEPTH: Partial<Record<keyof ResourceInventory, number>> = {
  fossil: 300,
  prismatic: 360,
  galactic: 520,
};
const RESOURCE_AUDIT_CAPS: Record<keyof ResourceInventory, { base: number; perDepth: number }> = {
  coal: { base: 28, perDepth: 0.8 },
  iron: { base: 18, perDepth: 0.58 },
  gold: { base: 10, perDepth: 0.38 },
  diamond: { base: 6, perDepth: 0.18 },
  obsidian: { base: 4, perDepth: 0.14 },
  crystal: { base: 3, perDepth: 0.1 },
  fossil: { base: 2, perDepth: 0.08 },
  prismatic: { base: 1, perDepth: 0.045 },
  galactic: { base: 1, perDepth: 0.025 },
};

export type ProgressionSaveData = {
  coins: number;
  maxDepthReached: number;
  inventory: ResourceInventory;
  pickaxes: PickaxeOwnershipState;
  upgrades: UpgradeLevelState;
  expedition: ExpeditionProgressionState;
  archaeology: ArchaeologyDeckState;
  audioMuted: boolean;
};

type ProgressionSavePayload = Partial<{
  coins: unknown;
  maxDepthReached: unknown;
  inventory: Partial<Record<keyof ResourceInventory, unknown>>;
  pickaxes: Partial<PickaxeOwnershipState>;
  upgrades: Partial<UpgradeLevelState>;
  expedition: Partial<ExpeditionProgressionState>;
  archaeology: Partial<ArchaeologyDeckState>;
  audioMuted: unknown;
}>;

type ProgressionSaveEnvelope = {
  version?: unknown;
  data?: ProgressionSavePayload;
  checksum?: unknown;
};

export function createDefaultProgressionSave(): ProgressionSaveData {
  return {
    coins: 0,
    maxDepthReached: 0,
    inventory: createResourceInventory(),
    pickaxes: createPickaxeOwnershipState(),
    upgrades: createUpgradeLevelState(),
    expedition: createDefaultExpeditionProgressionState(),
    archaeology: createDefaultArchaeologyDeckState(),
    audioMuted: false,
  };
}

export function loadProgressionSave(): ProgressionSaveData {
  if (typeof localStorage === "undefined") {
    return createDefaultProgressionSave();
  }

  clearLegacyProgressionSaves();
  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return createDefaultProgressionSave();
  }

  try {
    const parsed = JSON.parse(raw) as ProgressionSavePayload | ProgressionSaveEnvelope;
    const payload = unwrapSavePayload(parsed);

    if (!payload) {
      return createDefaultProgressionSave();
    }

    return normalizeProgressionSave(payload);
  } catch {
    return createDefaultProgressionSave();
  }
}

function clearLegacyProgressionSaves() {
  for (const key of LEGACY_SAVE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function saveProgression(data: ProgressionSaveData) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const previous = readStoredProgressionSave() ?? createDefaultProgressionSave();
  const normalized = enforceTrustedSaveTransition(previous, sanitizeProgressionSave(data));
  localStorage.setItem(SAVE_KEY, JSON.stringify(wrapSavePayload(normalized)));
}

export function sanitizeProgressionSave(data: ProgressionSaveData): ProgressionSaveData {
  return normalizeProgressionSave(data as ProgressionSavePayload);
}

function unwrapSavePayload(
  parsed: ProgressionSavePayload | ProgressionSaveEnvelope,
): ProgressionSavePayload | null {
  if ("data" in parsed || "checksum" in parsed || "version" in parsed) {
    const envelope = parsed as ProgressionSaveEnvelope;

    if (envelope.version !== SAVE_VERSION || !envelope.data || typeof envelope.checksum !== "string") {
      return null;
    }

    return envelope.checksum === createSaveChecksum(envelope.data)
      ? envelope.data
      : null;
  }

  return parsed as ProgressionSavePayload;
}

function readStoredProgressionSave(): ProgressionSaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ProgressionSavePayload | ProgressionSaveEnvelope;
    const payload = unwrapSavePayload(parsed);

    return payload ? normalizeProgressionSave(payload) : null;
  } catch {
    return null;
  }
}

function wrapSavePayload(data: ProgressionSaveData): ProgressionSaveEnvelope {
  return {
    version: SAVE_VERSION,
    data,
    checksum: createSaveChecksum(data),
  };
}

function createSaveChecksum(payload: unknown) {
  const input = `${SAVE_CHECKSUM_SALT}:${JSON.stringify(payload)}`;
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeProgressionSave(
  payload: ProgressionSavePayload,
): ProgressionSaveData {
  const maxDepthReached = normalizePositiveInteger(payload.maxDepthReached, MAX_SAVED_DEPTH);
  const upgrades = normalizeUpgradeLevelState(payload.upgrades ?? {});
  const maxInventoryLoad = BASE_BACKPACK_CAPACITY + getUpgradeBonusSummary(upgrades).backpackCapacity;
  const auditedExpedition = auditExpeditionProgression(
    normalizeExpeditionProgressionState(payload.expedition ?? {}),
    maxDepthReached,
  );
  const auditedBudget = getAuditedEarnedBudget(auditedExpedition, maxDepthReached);
  const auditedProgression = auditPurchasedProgression({
    pickaxes: normalizePickaxeOwnershipState(payload.pickaxes ?? {}, maxDepthReached),
    upgrades,
    maxDepthReached,
    earnedBudget: auditedBudget,
  });
  const expedition = {
    ...auditedExpedition,
    pickaxeLevel: getHighestOwnedPickaxeTier(auditedProgression.pickaxes),
    upgradeLevels: getTotalUpgradeLevels(auditedProgression.upgrades),
  };
  const remainingBudget = Math.max(0, auditedBudget - auditedProgression.spent);

  return {
    coins: Math.min(normalizePositiveInteger(payload.coins, MAX_SAVED_COINS), remainingBudget),
    maxDepthReached,
    inventory: normalizeInventory(payload.inventory, maxDepthReached, maxInventoryLoad),
    pickaxes: auditedProgression.pickaxes,
    upgrades: auditedProgression.upgrades,
    expedition,
    archaeology: normalizeArchaeologyDeckState(payload.archaeology ?? {}),
    audioMuted: payload.audioMuted === true,
  };
}

function enforceTrustedSaveTransition(
  previous: ProgressionSaveData,
  next: ProgressionSaveData,
): ProgressionSaveData {
  const maxDepthReached = Math.min(next.maxDepthReached, previous.maxDepthReached + 1);
  const depthLimitedNext = sanitizeProgressionSave({
    ...next,
    maxDepthReached,
    expedition: {
      ...next.expedition,
      deepestDepth: Math.min(next.expedition.deepestDepth, maxDepthReached),
      maxReturnDepth: Math.min(next.expedition.maxReturnDepth, maxDepthReached),
    },
  });
  const inventory = enforceInventoryTransition(previous, depthLimitedNext);
  const pickaxeResult = enforcePickaxeTransition(previous, depthLimitedNext);
  const upgradeResult = enforceUpgradeTransition(previous, {
    ...depthLimitedNext,
    inventory,
    pickaxes: pickaxeResult.pickaxes,
    coins: pickaxeResult.coins,
  });
  const coins = enforceCoinTransition(previous, {
    ...depthLimitedNext,
    inventory,
    pickaxes: pickaxeResult.pickaxes,
    upgrades: upgradeResult.upgrades,
    coins: upgradeResult.coins,
  });

  return sanitizeProgressionSave({
    ...depthLimitedNext,
    coins,
    inventory,
    pickaxes: pickaxeResult.pickaxes,
    upgrades: upgradeResult.upgrades,
  });
}

function enforceInventoryTransition(
  previous: ProgressionSaveData,
  next: ProgressionSaveData,
) {
  const previousLoad = getInventoryLoad(previous.inventory);
  const nextLoad = getInventoryLoad(next.inventory);

  if (nextLoad <= previousLoad) {
    return next.inventory;
  }

  if (nextLoad > previousLoad + 2) {
    return previous.inventory;
  }

  let increasedResource: keyof ResourceInventory | null = null;

  for (const resource of resourceKinds) {
    if (next.inventory[resource] < previous.inventory[resource]) {
      return previous.inventory;
    }

    if (next.inventory[resource] > previous.inventory[resource]) {
      if (increasedResource) {
        return previous.inventory;
      }

      increasedResource = resource;
    }
  }

  return next.inventory;
}

function enforcePickaxeTransition(
  previous: ProgressionSaveData,
  next: ProgressionSaveData,
) {
  const pickaxes = createPickaxeOwnershipState();
  let coins = next.coins;
  let acceptedNewPickaxe = false;

  for (const pickaxe of getPickaxeList()) {
    if (previous.pickaxes.owned[pickaxe.id]) {
      pickaxes.owned[pickaxe.id] = true;
      continue;
    }

    if (
      pickaxe.id === "wood" ||
      !next.pickaxes.owned[pickaxe.id] ||
      acceptedNewPickaxe ||
      previous.maxDepthReached < pickaxe.unlockDepth ||
      previous.coins < pickaxe.cost ||
      next.coins > previous.coins - pickaxe.cost
    ) {
      continue;
    }

    pickaxes.owned[pickaxe.id] = true;
    coins = Math.min(coins, previous.coins - pickaxe.cost);
    acceptedNewPickaxe = true;
  }

  pickaxes.equipped = pickaxes.owned[next.pickaxes.equipped]
    ? next.pickaxes.equipped
    : previous.pickaxes.equipped && pickaxes.owned[previous.pickaxes.equipped]
      ? previous.pickaxes.equipped
      : getBestOwnedPickaxeId(pickaxes);

  return { pickaxes, coins };
}

function enforceUpgradeTransition(
  previous: ProgressionSaveData,
  next: ProgressionSaveData,
) {
  const upgrades = createUpgradeLevelState();
  let coins = next.coins;
  let acceptedUpgrade = false;

  for (const upgrade of getUpgradeList()) {
    const previousLevel = getUpgradeLevel(previous.upgrades, upgrade.id);
    const nextLevel = getUpgradeLevel(next.upgrades, upgrade.id);

    upgrades.levels[upgrade.id] = previousLevel;

    if (nextLevel <= previousLevel || acceptedUpgrade) {
      continue;
    }

    const cost = getUpgradeCost(previous.upgrades, upgrade.id);

    if (cost === null || previous.coins < cost || next.coins > previous.coins - cost) {
      continue;
    }

    upgrades.levels[upgrade.id] = previousLevel + 1;
    coins = Math.min(coins, previous.coins - cost);
    acceptedUpgrade = true;
  }

  return { upgrades, coins };
}

function enforceCoinTransition(
  previous: ProgressionSaveData,
  next: ProgressionSaveData,
) {
  if (next.coins <= previous.coins) {
    return next.coins;
  }

  const maxIncrease = getAllowedCoinIncrease(previous, next);
  return Math.min(next.coins, previous.coins + maxIncrease);
}

function getAllowedCoinIncrease(
  previous: ProgressionSaveData,
  next: ProgressionSaveData,
) {
  let allowedIncrease = 0;

  if (
    next.expedition.coinsSold > previous.expedition.coinsSold &&
    getInventoryLoad(next.inventory) === 0 &&
    getInventoryLoad(previous.inventory) > 0
  ) {
    allowedIncrease += getAuditedInventorySaleValue(previous);
  }

  if (next.expedition.chestsOpened === previous.expedition.chestsOpened + 1) {
    allowedIncrease += getAuditedChestReward(previous.maxDepthReached, previous.upgrades);
  }

  return allowedIncrease;
}

function getInventoryLoad(inventory: ResourceInventory) {
  return resourceKinds.reduce((total, resource) => total + inventory[resource], 0);
}

function getAuditedInventorySaleValue(save: ProgressionSaveData) {
  const baseValue = resourceKinds.reduce(
    (total, resource) => total + save.inventory[resource] * getResourceSellValue(resource),
    0,
  );
  const saleMultiplier = 1 + getUpgradeBonusSummary(save.upgrades).saleMultiplier;

  return Math.ceil(baseValue * saleMultiplier * 1.2);
}

function getAuditedChestReward(depth: number, upgrades: UpgradeLevelState) {
  const baseReward = 35 + Math.floor(depth * 0.7);
  const deepBonus =
    depth >= 520 ? 1.35 :
    depth >= 420 ? 1.24 :
    depth >= 320 ? 1.15 :
    1;

  return Math.ceil(baseReward * deepBonus * (1 + getUpgradeBonusSummary(upgrades).chestCoinMultiplier));
}

function auditExpeditionProgression(
  expedition: ExpeditionProgressionState,
  maxDepthReached: number,
): ExpeditionProgressionState {
  const resources = resourceKinds.reduce(
    (audited, resource) => ({
      ...audited,
      [resource]: Math.min(expedition.resources[resource], getResourceAuditCap(resource, maxDepthReached)),
    }),
    createResourceInventory(),
  );
  const resourceCoinCap = resourceKinds.reduce(
    (total, resource) => total + resources[resource] * getResourceSellValue(resource),
    0,
  ) * MAX_SALE_MULTIPLIER_AUDIT;
  const chestCap = Math.min(
    expedition.chestsOpened,
    Math.ceil(CHEST_AUDIT_BASE + maxDepthReached * CHEST_AUDIT_PER_DEPTH),
  );
  const chestRewardAtDepth = 35 + Math.floor(maxDepthReached * 0.7);
  const chestCoinCap = chestCap * chestRewardAtDepth * MAX_CHEST_MULTIPLIER_AUDIT;

  return {
    deepestDepth: Math.min(expedition.deepestDepth, maxDepthReached),
    maxReturnDepth: Math.min(expedition.maxReturnDepth, maxDepthReached),
    resources,
    chestsOpened: chestCap,
    cardsFound: Math.min(expedition.cardsFound, Math.floor(chestCap * MAX_CARDS_FROM_CHESTS_RATIO)),
    pickaxeLevel: expedition.pickaxeLevel,
    upgradeLevels: expedition.upgradeLevels,
    coinsSold: Math.min(expedition.coinsSold, Math.floor(resourceCoinCap + chestCoinCap)),
  };
}

function getResourceAuditCap(resource: keyof ResourceInventory, maxDepthReached: number) {
  const minDepth = RESOURCE_MIN_DEPTH[resource] ?? 0;

  if (maxDepthReached < minDepth) {
    return 0;
  }

  const cap = RESOURCE_AUDIT_CAPS[resource];
  return Math.ceil(cap.base + (maxDepthReached - minDepth) * cap.perDepth);
}

function getAuditedEarnedBudget(
  expedition: ExpeditionProgressionState,
  maxDepthReached: number,
) {
  const maxResourceSales = resourceKinds.reduce(
    (total, resource) => total + expedition.resources[resource] * getResourceSellValue(resource),
    0,
  ) * MAX_SALE_MULTIPLIER_AUDIT;
  const chestRewardAtDepth = 35 + Math.floor(maxDepthReached * 0.7);
  const maxChestCoins = expedition.chestsOpened * chestRewardAtDepth * MAX_CHEST_MULTIPLIER_AUDIT;

  return Math.min(MAX_SAVED_COINS, Math.floor(maxResourceSales + maxChestCoins));
}

function auditPurchasedProgression(input: {
  pickaxes: PickaxeOwnershipState;
  upgrades: UpgradeLevelState;
  maxDepthReached: number;
  earnedBudget: number;
}) {
  let remainingBudget = input.earnedBudget;
  let spent = 0;
  const pickaxes = createPickaxeOwnershipState();

  for (const pickaxe of getPickaxeList()) {
    if (pickaxe.id === "wood" || !input.pickaxes.owned[pickaxe.id] || pickaxe.unlockDepth > input.maxDepthReached) {
      continue;
    }

    if (remainingBudget < pickaxe.cost) {
      continue;
    }

    pickaxes.owned[pickaxe.id] = true;
    remainingBudget -= pickaxe.cost;
    spent += pickaxe.cost;
  }

  pickaxes.equipped = input.pickaxes.owned[input.pickaxes.equipped] && pickaxes.owned[input.pickaxes.equipped]
    ? input.pickaxes.equipped
    : getBestOwnedPickaxeId(pickaxes);

  const upgrades = createUpgradeLevelState();

  for (const upgrade of getUpgradeList()) {
    const requestedLevel = getUpgradeLevel(input.upgrades, upgrade.id);

    for (let level = 0; level < requestedLevel; level += 1) {
      const cost = getUpgradeCost(upgrades, upgrade.id);

      if (cost === null || remainingBudget < cost) {
        break;
      }

      upgrades.levels[upgrade.id] += 1;
      remainingBudget -= cost;
      spent += cost;
    }
  }

  return {
    pickaxes,
    upgrades,
    spent,
  };
}

function getBestOwnedPickaxeId(state: PickaxeOwnershipState): PickaxeId {
  return getPickaxeList().reduce<PickaxeId>(
    (best, pickaxe) => state.owned[pickaxe.id] && pickaxe.tier > getPickaxeList().find((item) => item.id === best)!.tier
      ? pickaxe.id
      : best,
    "wood",
  );
}

function getHighestOwnedPickaxeTier(state: PickaxeOwnershipState) {
  return getPickaxeList().reduce(
    (highest, pickaxe) => state.owned[pickaxe.id] ? Math.max(highest, pickaxe.tier) : highest,
    1,
  );
}

function getTotalUpgradeLevels(state: UpgradeLevelState) {
  return getUpgradeList().reduce(
    (total, upgrade) => total + getUpgradeLevel(state, upgrade.id),
    0,
  );
}

function normalizeInventory(
  inventory: ProgressionSavePayload["inventory"],
  maxDepthReached: number,
  maxInventoryLoad: number,
): ResourceInventory {
  let remainingLoad = maxInventoryLoad;

  return resourceKinds.reduce(
    (normalized, resource) => {
      const minDepth = RESOURCE_MIN_DEPTH[resource] ?? 0;
      const quantity = maxDepthReached >= minDepth
        ? Math.min(remainingLoad, normalizePositiveInteger(inventory?.[resource], maxInventoryLoad))
        : 0;

      remainingLoad -= quantity;

      return {
        ...normalized,
        [resource]: quantity,
      };
    },
    createResourceInventory(),
  );
}

function normalizePositiveInteger(value: unknown, max = Number.MAX_SAFE_INTEGER) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(max, Math.max(0, Math.floor(parsed)));
}
