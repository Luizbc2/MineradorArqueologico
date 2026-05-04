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
import {
  createPickaxeOwnershipState,
  normalizePickaxeOwnershipState,
} from "../progression/pickaxeState";
import type { PickaxeOwnershipState } from "../progression/pickaxeState";
import {
  createUpgradeLevelState,
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

const SAVE_KEY = "minerador-arqueologico:progression:v1";
const MAX_SAVED_COINS = 250_000;
const BASE_BACKPACK_CAPACITY = 24;
const MAX_SAVED_DEPTH = WORLD_HEIGHT_TILES - SURFACE_ROW - 1;
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

  const raw = localStorage.getItem(SAVE_KEY);

  if (!raw) {
    return createDefaultProgressionSave();
  }

  try {
    return normalizeProgressionSave(JSON.parse(raw) as ProgressionSavePayload);
  } catch {
    return createDefaultProgressionSave();
  }
}

export function saveProgression(data: ProgressionSaveData) {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function normalizeProgressionSave(
  payload: ProgressionSavePayload,
): ProgressionSaveData {
  const maxDepthReached = normalizePositiveInteger(payload.maxDepthReached, MAX_SAVED_DEPTH);
  const upgrades = normalizeUpgradeLevelState(payload.upgrades ?? {});
  const maxInventoryLoad = BASE_BACKPACK_CAPACITY + getUpgradeBonusSummary(upgrades).backpackCapacity;

  return {
    coins: normalizePositiveInteger(payload.coins, MAX_SAVED_COINS),
    maxDepthReached,
    inventory: normalizeInventory(payload.inventory, maxDepthReached, maxInventoryLoad),
    pickaxes: normalizePickaxeOwnershipState(payload.pickaxes ?? {}),
    upgrades,
    expedition: normalizeExpeditionProgressionState(payload.expedition ?? {}),
    archaeology: normalizeArchaeologyDeckState(payload.archaeology ?? {}),
    audioMuted: payload.audioMuted === true,
  };
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
