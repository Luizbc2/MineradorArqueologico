import { createPhaserGame } from "./phaser/createPhaserGame";

function activateModernRuntime() {
  document.documentElement.classList.add("phaser-runtime");
  document.body.classList.add("phaser-runtime");
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.style.background = "#070912";
}

export function bootstrapApp() {
  activateModernRuntime();
  createPhaserGame();
}
