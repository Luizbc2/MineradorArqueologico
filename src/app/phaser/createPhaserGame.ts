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
  root.style.contain = "layout size paint";
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

  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.imageRendering = "pixelated";

  const context = canvas.getContext("2d");

  if (context) {
    context.imageSmoothingEnabled = false;
  }
}

function resizeGameToRoot(game: Phaser.Game) {
  const root = ensurePhaserRoot();
  const width = Math.max(1, Math.round(root.clientWidth));
  const height = Math.max(1, Math.round(root.clientHeight));

  game.scale.resize(width, height);
  applyPixelCanvasStyles(game);
}

export function createPhaserGame() {
  const root = ensurePhaserRoot();
  const game = new Phaser.Game(phaserGameConfig);
  resizeGameToRoot(game);
  game.scale.on(Phaser.Scale.Events.RESIZE, () => {
    applyPixelCanvasStyles(game);
  });

  const observer = new ResizeObserver(() => resizeGameToRoot(game));
  observer.observe(root);
  window.addEventListener("resize", () => resizeGameToRoot(game));

  return game;
}
