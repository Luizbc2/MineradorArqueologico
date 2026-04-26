import Phaser from "phaser";
import minerCustomSheetUrl from "../assets/player/miner-custom-sheet.png";
import pickMetalUrl from "../assets/pickaxes/pick-metal.png";
import pickStoneUrl from "../assets/pickaxes/pick-stone.png";
import pickWoodUrl from "../assets/pickaxes/pick-wood.png";
import surfaceVendorSignUrl from "../assets/signs/surface-vendor-sign.png";
import surfaceWorkshopSignUrl from "../assets/signs/surface-workshop-sign.png";
import villageHubCleanUrl from "../assets/surface/village-hub-clean-v1.png";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.spritesheet("player-miner", minerCustomSheetUrl, {
      frameWidth: 80,
      frameHeight: 80,
    });
    this.load.image("pickaxe-metal", pickMetalUrl);
    this.load.image("pickaxe-stone", pickStoneUrl);
    this.load.image("pickaxe-wood", pickWoodUrl);
    this.load.image("surface-vendor-sign", surfaceVendorSignUrl);
    this.load.image("surface-workshop-sign", surfaceWorkshopSignUrl);
    this.load.image("surface-village-hub-clean", villageHubCleanUrl);

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    this.scene.start("mine");
  }
}
