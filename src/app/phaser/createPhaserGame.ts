import Phaser from "phaser";
import { PHASER_ROOT_ID, phaserGameConfig } from "./gameConfig";

function ensurePhaserRoot() {
  let root = document.getElementById(PHASER_ROOT_ID);
  const viewportWrapper = document.getElementById("viewport-wrapper");

  if (!root) {
    root = document.createElement("div");
    root.id = PHASER_ROOT_ID;
    root.setAttribute("aria-label", "Nova area jogavel Phaser");
    root.style.position = "relative";
    root.style.width = "640px";
    root.style.height = "576px";
    root.style.border = "4px solid #303a52";
    root.style.background = "#05070d";
    root.style.boxSizing = "content-box";
    root.style.imageRendering = "pixelated";
    root.style.boxShadow = "0 0 0 4px #0a111c inset";

    if (viewportWrapper) {
      viewportWrapper.append(root);
    } else {
      document.body.append(root);
    }
  }

  return root;
}

export function createPhaserGame() {
  ensurePhaserRoot();
  return new Phaser.Game(phaserGameConfig);
}
