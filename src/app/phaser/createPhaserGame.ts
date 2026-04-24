import Phaser from "phaser";
import { PHASER_ROOT_ID, phaserGameConfig } from "./gameConfig";

function applyRootStyles(root: HTMLElement) {
  root.setAttribute("aria-label", "Nova área jogável Phaser");
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.width = "100vw";
  root.style.height = "100vh";
  root.style.overflow = "hidden";
  root.style.background = "radial-gradient(circle at top, #0f1830 0%, #090d15 42%, #06080f 100%)";
  root.style.boxSizing = "border-box";
  root.style.zIndex = "0";
}

function ensurePhaserRoot() {
  let root = document.getElementById(PHASER_ROOT_ID);

  if (!root) {
    root = document.createElement("div");
    root.id = PHASER_ROOT_ID;
    document.body.append(root);
  }

  applyRootStyles(root);
  root.style.display = "block";

  return root;
}

function applyPixelCanvasStyles(game: Phaser.Game) {
  const canvas = game.canvas;
  const root = ensurePhaserRoot();

  if (!canvas) {
    return;
  }

  canvas.style.width = `${Math.round(root.clientWidth)}px`;
  canvas.style.height = `${Math.round(root.clientHeight)}px`;
  canvas.style.display = "block";
  canvas.style.imageRendering = "pixelated";
  canvas.style.transform = "translateZ(0)";

  const context = canvas.getContext("2d");

  if (context) {
    context.imageSmoothingEnabled = false;
  }
}

export function createPhaserGame() {
  ensurePhaserRoot();
  const game = new Phaser.Game(phaserGameConfig);
  applyPixelCanvasStyles(game);
  game.scale.on(Phaser.Scale.Events.RESIZE, () => {
    applyPixelCanvasStyles(game);
  });
  return game;
}
