export type AppScreen = "home" | "playing" | "paused" | "codex";

export type GameState = {
  screen: AppScreen;
  isPaused: boolean;
  buildLabel: string;
};

export type GameStateListener = (state: GameState) => void;

export type GameStore = {
  getState: () => GameState;
  subscribe: (listener: GameStateListener) => () => void;
  goHome: () => void;
  startGame: () => void;
  openCodex: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  togglePause: () => void;
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
