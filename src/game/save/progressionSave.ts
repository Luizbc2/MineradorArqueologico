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
] as const;
const SAVE_KEY = "minerador-arqueologico:progression:v3";
const SAVE_VERSION = 3;
const SAVE_CHECKSUM_SALT = "minerador-arqueologico-save-v3";
const MAX_SAVED_COINS = 250_000;
const BASE_BACKPACK_CAPACITY = 24;
const MAX_SAVED_DEPTH = WORLD_HEIGHT_TILES - SURFACE_ROW - 1;
const MAX_SALE_MULTIPLIER_AUDIT = 4;
const MAX_CHEST_MULTIPLIER_AUDIT = 2.8;
const RESOURCE_MIN_DEPTH: Partial<Record<keyof ResourceInventory, number>> = {
  fossil: 300,
  prismatic: 360,
  galactic: 520,
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

  const normalized = sanitizeProgressionSave(data);
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
  const expedition = normalizeExpeditionProgressionState(payload.expedition ?? {});
  const auditedBudget = getAuditedEarnedBudget(expedition, maxDepthReached);
  const auditedProgression = auditPurchasedProgression({
    pickaxes: normalizePickaxeOwnershipState(payload.pickaxes ?? {}, maxDepthReached),
    upgrades,
    maxDepthReached,
    earnedBudget: auditedBudget,
  });
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
