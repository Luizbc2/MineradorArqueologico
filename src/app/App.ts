import { gameConfig } from "../core/config/gameConfig";
import { createGameStore } from "../core/state/gameState";
import { createPlayer } from "../game/entities/player";
import { createRenderer } from "../game/rendering/renderer";
import { createWorld } from "../game/world/world";
import { createCodexScreen } from "../ui/screens/codexScreen";
import { createHomeScreen } from "../ui/screens/homeScreen";
import { createPlayingScreen } from "../ui/screens/playingScreen";

export function createApp() {
  const store = createGameStore();
  const world = createWorld();
  const player = createPlayer();
  const renderer = createRenderer();
  const root = document.createElement("div");
  root.className = "app-root";

  const render = () => {
    const state = store.getState();

    if (state.screen === "home") {
      root.replaceChildren(
        createHomeScreen({
          title: gameConfig.title,
          subtitle: gameConfig.subtitle,
          state,
          world,
          player,
          renderer,
          actions: {
            onStart: store.startGame,
            onOpenCodex: store.openCodex,
          },
        }),
      );
      return;
    }

    if (state.screen === "codex") {
      root.replaceChildren(
        createCodexScreen({
          state,
          onBack: store.goHome,
          onStart: store.startGame,
        }),
      );
      return;
    }

    root.replaceChildren(
      createPlayingScreen({
        state,
        title: gameConfig.title,
        player,
        renderer,
        world,
        actions: {
          onBack: store.goHome,
          onOpenCodex: store.openCodex,
          onPause: store.pauseGame,
          onResume: store.resumeGame,
        },
      }),
    );
  };

  store.subscribe(() => {
    render();
  });

  render();

  return root;
}
