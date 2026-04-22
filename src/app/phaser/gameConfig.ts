import Phaser from "phaser";
import { BootScene } from "../../scenes/BootScene";
import { MineScene } from "../../scenes/MineScene";
import { PreloadScene } from "../../scenes/PreloadScene";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../game/world/constants";

export const PHASER_ROOT_ID = "phaser-root";

export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: PHASER_ROOT_ID,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  autoRound: true,
  backgroundColor: "#05070d",
  pixelArt: true,
  transparent: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    powerPreference: "high-performance",
  },
  fps: {
    target: 60,
    smoothStep: false,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MineScene],
};
