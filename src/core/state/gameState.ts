import type { AppScreen, GameState } from "../../types/app";

export function createGameState(screen: AppScreen = "home"): GameState {
  return {
    screen,
    isPaused: false,
    buildLabel: "commit-2",
  };
}
