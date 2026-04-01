export type AppScreen = "home" | "playing" | "paused" | "codex";

export type GameState = {
  screen: AppScreen;
  isPaused: boolean;
  buildLabel: string;
};

export type Player = {
  name: string;
  depth: number;
  energy: number;
  pickaxeLevel: number;
};

export type World = {
  width: number;
  depth: number;
  biome: "cavern";
};

export type Renderer = {
  mode: "canvas-2d";
  status: "planned" | "ready";
};
