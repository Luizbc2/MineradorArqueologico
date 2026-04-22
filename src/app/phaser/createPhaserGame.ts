import Phaser from "phaser";
import { PHASER_ROOT_ID, phaserGameConfig } from "./gameConfig";
import { gameTheme } from "../../ui/theme/gameTheme";

function ensurePhaserRoot() {
  let root = document.getElementById(PHASER_ROOT_ID);

  if (!root) {
    root = document.createElement("div");
    root.id = PHASER_ROOT_ID;
    root.setAttribute("aria-label", "Nova area jogavel Phaser");
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.width = "100vw";
    root.style.height = "100vh";
    root.style.overflow = "hidden";
    root.style.background = `radial-gradient(circle at top, #0f1830 0%, #090d15 42%, #06080f 100%)`;
    root.style.boxSizing = "border-box";
    root.style.imageRendering = "auto";
    root.style.zIndex = "0";

    document.body.append(root);
  }

  root.style.display = "block";

  return root;
}

export function createPhaserGame() {
  ensurePhaserRoot();
  return new Phaser.Game(phaserGameConfig);
}
