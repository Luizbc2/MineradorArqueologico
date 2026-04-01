import { gameConfig } from "../core/config/gameConfig";
import { createGameState } from "../core/state/gameState";
import { createPlayer } from "../game/entities/player";
import { createRenderer } from "../game/rendering/renderer";
import { createWorld } from "../game/world/world";
import { createHomeScreen } from "../ui/screens/homeScreen";

export function createApp() {
  const state = createGameState();
  const world = createWorld();
  const player = createPlayer();
  const renderer = createRenderer();

  return createHomeScreen({
    title: gameConfig.title,
    subtitle: gameConfig.subtitle,
    state,
    world,
    player,
    renderer,
  });
}
