import { createPhaserGame } from "./phaser/createPhaserGame";
import { mountLegacyGame } from "../game/legacy/mountLegacyGame";

export function bootstrapApp() {
  createPhaserGame();
  mountLegacyGame();
}
