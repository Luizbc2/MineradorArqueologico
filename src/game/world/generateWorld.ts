import {
  PLAYER_SPAWN_TILE,
  SURFACE_ROW,
  WORLD_HEIGHT_TILES,
  WORLD_WIDTH_TILES,
} from "./constants";
import type { TileCell, TileKind, WorldGrid } from "./types";

type RandomFn = () => number;
type OreChance = {
  kind: Extract<TileKind, "coal" | "iron" | "gold" | "diamond">;
  chance: number;
};

function createSeededRandom(seed: number): RandomFn {
  let current = seed >>> 0;

  return () => {
    current += 0x6d2b79f5;
    let value = current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createFilledGrid(kind: TileKind): WorldGrid {
  return Array.from({ length: WORLD_HEIGHT_TILES }, () =>
    Array.from({ length: WORLD_WIDTH_TILES }, (): TileCell => ({ kind })),
  );
}

function getOreChances(depth: number): OreChance[] {
  if (depth < 20) {
    return [
      { kind: "coal", chance: 0.052 },
      { kind: "iron", chance: 0.012 },
    ];
  }

  if (depth < 60) {
    return [
      { kind: "coal", chance: 0.032 },
      { kind: "iron", chance: 0.046 },
      { kind: "gold", chance: 0.008 },
    ];
  }

  if (depth < 120) {
    return [
      { kind: "coal", chance: 0.018 },
      { kind: "iron", chance: 0.04 },
      { kind: "gold", chance: 0.028 },
      { kind: "diamond", chance: 0.006 },
    ];
  }

  if (depth < 220) {
    return [
      { kind: "coal", chance: 0.01 },
      { kind: "iron", chance: 0.028 },
      { kind: "gold", chance: 0.038 },
      { kind: "diamond", chance: 0.014 },
    ];
  }

  return [
    { kind: "coal", chance: 0.006 },
    { kind: "iron", chance: 0.018 },
    { kind: "gold", chance: 0.044 },
    { kind: "diamond", chance: 0.024 },
  ];
}

function getOreKindForDepth(depth: number, roll: number): TileKind {
  let threshold = 0;

  for (const ore of getOreChances(depth)) {
    threshold += ore.chance;

    if (roll < threshold) {
      return ore.kind;
    }
  }

  return "stone";
}

export function generateWorld(seed = 0x0badc0de): WorldGrid {
  const random = createSeededRandom(seed);
  const grid = createFilledGrid("dirt");
  const rowChestCount = new Array(WORLD_HEIGHT_TILES).fill(0);

  for (let y = 0; y < WORLD_HEIGHT_TILES; y += 1) {
    for (let x = 0; x < WORLD_WIDTH_TILES; x += 1) {
      let kind: TileKind = y === SURFACE_ROW ? "grass" : "dirt";

      if (y > SURFACE_ROW + 2) {
        kind = "stone";
      }

      const depth = Math.max(0, y - SURFACE_ROW);
      const depthFactor = y / WORLD_HEIGHT_TILES;

      if (kind === "stone") {
        kind = getOreKindForDepth(depth, random());
      }

      if (y > 10 && y < WORLD_HEIGHT_TILES - 5) {
        const chestChance = 0.012 + depthFactor * 0.04;
        const maxPerRow = 2 + (depthFactor > 0.6 ? 1 : 0);

        if (rowChestCount[y] < maxPerRow && random() < chestChance) {
          let nearChest = false;

          for (let offsetY = -1; offsetY <= 1 && !nearChest; offsetY += 1) {
            for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
              const nextX = x + offsetX;
              const nextY = y + offsetY;

              if (nextX < 0 || nextX >= WORLD_WIDTH_TILES || nextY < 0 || nextY >= WORLD_HEIGHT_TILES) {
                continue;
              }

              if (grid[nextY][nextX].kind === "chest") {
                nearChest = true;
                break;
              }
            }
          }

          if (!nearChest) {
            kind = "chest";
            rowChestCount[y] += 1;
          }
        }
      }

      if (y === WORLD_HEIGHT_TILES - 1) {
        kind = "bedrock";
      }

      grid[y][x] = { kind };
    }
  }

  const totalChests = grid.flat().filter((cell) => cell.kind === "chest").length;
  const targetMinimumChests = 18;

  if (totalChests < targetMinimumChests) {
    let needed = targetMinimumChests - totalChests;

    for (let attempt = 0; attempt < 500 && needed > 0; attempt += 1) {
      const randomY = 12 + Math.floor(random() * Math.min(120, WORLD_HEIGHT_TILES - 20));
      const randomX = 4 + Math.floor(random() * (WORLD_WIDTH_TILES - 8));
      const current = grid[randomY][randomX].kind;

      if (current === "chest" || current === "bedrock") {
        continue;
      }

      if (current === "diamond" && random() < 0.6) {
        continue;
      }

      grid[randomY][randomX] = { kind: "chest" };
      needed -= 1;
    }
  }

  const chamberTop = Math.max(1, PLAYER_SPAWN_TILE.y - 1);

  for (let y = chamberTop; y < SURFACE_ROW; y += 1) {
    const widthOffset = y <= PLAYER_SPAWN_TILE.y ? 2 : 3;

    for (let x = PLAYER_SPAWN_TILE.x - widthOffset; x <= PLAYER_SPAWN_TILE.x + widthOffset; x += 1) {
      grid[y][x] = { kind: "empty" };
    }
  }

  return grid;
}
