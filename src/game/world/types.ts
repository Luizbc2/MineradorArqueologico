export const tileKinds = [
  "empty",
  "grass",
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
