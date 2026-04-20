import Phaser from "phaser";
import { PHASER_ROOT_ID, phaserGameConfig } from "./gameConfig";

function ensurePhaserRoot() {
  let root = document.getElementById(PHASER_ROOT_ID);

  if (!root) {
    root = document.createElement("div");
    root.id = PHASER_ROOT_ID;
    root.setAttribute("aria-hidden", "true");
    root.hidden = true;
    document.body.append(root);
  }

  return root;
}

export function createPhaserGame() {
  ensurePhaserRoot();
  return new Phaser.Game(phaserGameConfig);
}
