export const TILE_SIZE = 32;
export const VIEWPORT_WIDTH = 1920;
export const VIEWPORT_HEIGHT = 1080;

export const WORLD_WIDTH_TILES = 32;
export const WORLD_HEIGHT_TILES = 500;

export const WORLD_WIDTH_PX = WORLD_WIDTH_TILES * TILE_SIZE;
export const WORLD_HEIGHT_PX = WORLD_HEIGHT_TILES * TILE_SIZE;

export const SURFACE_ROW = 6;
export const PLAYER_SPAWN_TILE = {
  x: 16,
  y: 3,
} as const;
