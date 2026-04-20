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
  backgroundColor: "#05070d",
  pixelArt: true,
  transparent: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
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
