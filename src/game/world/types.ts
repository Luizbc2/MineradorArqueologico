export const tileKinds = [
  "empty",
  "dirt",
  "stone",
  "coal",
  "iron",
  "gold",
  "diamond",
  "chest",
  "bedrock",
] as const;

export type TileKind = (typeof tileKinds)[number];

export type TileCell = {
  kind: TileKind;
};

export type WorldGrid = TileCell[][];
