import Phaser from "phaser";
import { BootScene } from "../../scenes/BootScene";
import { PreloadScene } from "../../scenes/PreloadScene";

export const PHASER_ROOT_ID = "phaser-root";

export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: PHASER_ROOT_ID,
  width: 640,
  height: 576,
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
  scene: [BootScene, PreloadScene],
};
