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
  normalizeUpgradeLevelState,
} from "../progression/upgradeState";
import type { UpgradeLevelState } from "../progression/upgradeState";

const SAVE_KEY = "minerador-arqueologico:progression:v1";

export type ProgressionSaveData = {
  coins: number;
  maxDepthReached: number;
  inventory: ResourceInventory;
  pickaxes: PickaxeOwnershipState;
  upgrades: UpgradeLevelState;
};

type ProgressionSavePayload = Partial<{
  coins: unknown;
  maxDepthReached: unknown;
  inventory: Partial<Record<keyof ResourceInventory, unknown>>;
  pickaxes: Partial<PickaxeOwnershipState>;
  upgrades: Partial<UpgradeLevelState>;
}>;

export function createDefaultProgressionSave(): ProgressionSaveData {
  return {
    coins: 0,
    maxDepthReached: 0,
    inventory: createResourceInventory(),
    pickaxes: createPickaxeOwnershipState(),
    upgrades: createUpgradeLevelState(),
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
  return {
    coins: normalizePositiveInteger(payload.coins),
    maxDepthReached: normalizePositiveInteger(payload.maxDepthReached),
    inventory: normalizeInventory(payload.inventory),
    pickaxes: normalizePickaxeOwnershipState(payload.pickaxes ?? {}),
    upgrades: normalizeUpgradeLevelState(payload.upgrades ?? {}),
  };
}

function normalizeInventory(
  inventory: ProgressionSavePayload["inventory"],
): ResourceInventory {
  return resourceKinds.reduce(
    (normalized, resource) => ({
      ...normalized,
      [resource]: normalizePositiveInteger(inventory?.[resource]),
    }),
    createResourceInventory(),
  );
}

function normalizePositiveInteger(value: unknown) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0;
}
