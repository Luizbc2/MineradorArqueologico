import {
  getPickaxeDefinition,
  pickaxeIds,
} from "./pickaxeCatalog";
import type {
  PickaxeDefinition,
  PickaxeId,
} from "./pickaxeCatalog";

export type PickaxeOwnershipState = {
  owned: Record<PickaxeId, boolean>;
  equipped: PickaxeId;
};

export type PickaxePurchaseResult =
  | {
      ok: true;
      state: PickaxeOwnershipState;
      coins: number;
      pickaxe: PickaxeDefinition;
    }
  | {
      ok: false;
      reason: "already-owned" | "locked" | "not-enough-coins";
      state: PickaxeOwnershipState;
      coins: number;
      pickaxe: PickaxeDefinition;
    };

export function createPickaxeOwnershipState(): PickaxeOwnershipState {
  return {
    owned: pickaxeIds.reduce(
      (owned, id) => ({
        ...owned,
        [id]: id === "wood",
      }),
      {} as Record<PickaxeId, boolean>,
    ),
    equipped: "wood",
  };
}

export function ownsPickaxe(state: PickaxeOwnershipState, id: PickaxeId) {
  return state.owned[id];
}

export function canUnlockPickaxe(id: PickaxeId, maxDepthReached: number) {
  return maxDepthReached >= getPickaxeDefinition(id).unlockDepth;
}

export function canBuyPickaxe(
  state: PickaxeOwnershipState,
  id: PickaxeId,
  coins: number,
  maxDepthReached: number,
) {
  const pickaxe = getPickaxeDefinition(id);

  return (
    !ownsPickaxe(state, id) &&
    canUnlockPickaxe(id, maxDepthReached) &&
    coins >= pickaxe.cost
  );
}

export function buyPickaxe(
  state: PickaxeOwnershipState,
  id: PickaxeId,
  coins: number,
  maxDepthReached: number,
): PickaxePurchaseResult {
  const pickaxe = getPickaxeDefinition(id);

  if (ownsPickaxe(state, id)) {
    return { ok: false, reason: "already-owned", state, coins, pickaxe };
  }

  if (!canUnlockPickaxe(id, maxDepthReached)) {
    return { ok: false, reason: "locked", state, coins, pickaxe };
  }

  if (coins < pickaxe.cost) {
    return { ok: false, reason: "not-enough-coins", state, coins, pickaxe };
  }

  return {
    ok: true,
    coins: coins - pickaxe.cost,
    pickaxe,
    state: {
      owned: {
        ...state.owned,
        [id]: true,
      },
      equipped: id,
    },
  };
}

export function equipPickaxe(
  state: PickaxeOwnershipState,
  id: PickaxeId,
): PickaxeOwnershipState {
  if (!ownsPickaxe(state, id)) {
    return state;
  }

  return {
    ...state,
    equipped: id,
  };
}

export function getEquippedPickaxe(state: PickaxeOwnershipState) {
  return getPickaxeDefinition(state.equipped);
}

export function normalizePickaxeOwnershipState(
  state: Partial<PickaxeOwnershipState>,
): PickaxeOwnershipState {
  const fallback = createPickaxeOwnershipState();
  const owned = { ...fallback.owned, ...state.owned, wood: true };
  const equipped = state.equipped && owned[state.equipped]
    ? state.equipped
    : fallback.equipped;

  return { owned, equipped };
}

export function getNextLockedPickaxe(
  state: PickaxeOwnershipState,
): PickaxeDefinition | null {
  const nextId = pickaxeIds.find((id) => !ownsPickaxe(state, id));
  return nextId ? getPickaxeDefinition(nextId) : null;
}
