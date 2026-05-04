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
const SAVE_VERSION = 2;
const SAVE_CHECKSUM_SALT = "minerador-arqueologico-save-v2";
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

export function saveProgression(data: ProgressionSaveData) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const normalized = normalizeProgressionSave(data as ProgressionSavePayload);
  localStorage.setItem(SAVE_KEY, JSON.stringify(wrapSavePayload(normalized)));
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

  return {
    coins: normalizePositiveInteger(payload.coins, MAX_SAVED_COINS),
    maxDepthReached,
    inventory: normalizeInventory(payload.inventory, maxDepthReached, maxInventoryLoad),
    pickaxes: normalizePickaxeOwnershipState(payload.pickaxes ?? {}, maxDepthReached),
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
