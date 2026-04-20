import Phaser from "phaser";
import { PHASER_ROOT_ID, phaserGameConfig } from "./gameConfig";
import { gameTheme } from "../../ui/theme/gameTheme";

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
    root.style.border = `1px solid #${gameTheme.colors.border.toString(16).padStart(6, "0")}`;
    root.style.borderRadius = "22px";
    root.style.overflow = "hidden";
    root.style.background = `linear-gradient(180deg, #0b1220 0%, #090d15 100%)`;
    root.style.boxSizing = "content-box";
    root.style.imageRendering = "pixelated";
    root.style.boxShadow =
      "0 28px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,209,102,0.08), inset 0 1px 0 rgba(255,255,255,0.08)";

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
