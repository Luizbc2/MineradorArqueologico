import type { TileKind } from "./types";

export type TileDefinition = {
  breakable: boolean;
  hardness: number;
};

export const tileDefinitions: Record<TileKind, TileDefinition> = {
  empty: { breakable: false, hardness: 0 },
  grass: { breakable: true, hardness: 0.9 },
  dirt: { breakable: true, hardness: 1 },
  stone: { breakable: true, hardness: 2 },
  coal: { breakable: true, hardness: 1.2 },
  iron: { breakable: true, hardness: 1.8 },
  gold: { breakable: true, hardness: 2.4 },
  diamond: { breakable: true, hardness: 3.2 },
  obsidian: { breakable: true, hardness: 3.8 },
  crystal: { breakable: true, hardness: 4.4 },
  chest: { breakable: false, hardness: 0 },
  bedrock: { breakable: false, hardness: 999 },
};
