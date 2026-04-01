import type { AppScreen, GameState, GameStateListener, GameStore } from "../../types/app";

export function createGameState(screen: AppScreen = "home"): GameState {
  return {
    screen,
    isPaused: screen === "paused",
    buildLabel: "commit-6",
  };
}

export function createGameStore(initialScreen: AppScreen = "home"): GameStore {
  let state = createGameState(initialScreen);
  const listeners = new Set<GameStateListener>();

  const emit = () => {
    listeners.forEach((listener) => listener(state));
  };

  const patch = (nextState: Partial<GameState>) => {
    state = {
      ...state,
      ...nextState,
    };
    emit();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    goHome: () => {
      patch({
        screen: "home",
        isPaused: false,
      });
    },
    startGame: () => {
      patch({
        screen: "playing",
        isPaused: false,
      });
    },
    openCodex: () => {
      patch({
        screen: "codex",
        isPaused: false,
      });
    },
    pauseGame: () => {
      patch({
        screen: "paused",
        isPaused: true,
      });
    },
    resumeGame: () => {
      patch({
        screen: "playing",
        isPaused: false,
      });
    },
    togglePause: () => {
      if (state.screen === "playing") {
        patch({
          screen: "paused",
          isPaused: true,
        });
        return;
      }

      if (state.screen === "paused") {
        patch({
          screen: "playing",
          isPaused: false,
        });
      }
    },
  };
}
