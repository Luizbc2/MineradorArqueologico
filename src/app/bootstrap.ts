import { createPhaserGame } from "./phaser/createPhaserGame";

function activateModernRuntime() {
  document.documentElement.classList.add("phaser-runtime");
  document.body.classList.add("phaser-runtime");
  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";
  document.body.style.background = "#070912";

  const legacySelectors = [
    ".hud",
    "#game",
    "#instructions",
    "#arch-card",
    "#pause",
    "#upgrade",
    "#confetti-global",
    ".footer",
  ];

  for (const selector of legacySelectors) {
    document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      node.hidden = true;
      node.style.display = "none";
      node.style.visibility = "hidden";
      node.style.pointerEvents = "none";
    });
  }

  const viewportWrapper = document.getElementById("viewport-wrapper");
  if (viewportWrapper) {
    viewportWrapper.style.position = "fixed";
    viewportWrapper.style.inset = "0";
    viewportWrapper.style.padding = "0";
    viewportWrapper.style.margin = "0";
    viewportWrapper.style.display = "block";
    viewportWrapper.style.background = "#070912";
  }
}

export function bootstrapApp() {
  activateModernRuntime();
  createPhaserGame();
}
