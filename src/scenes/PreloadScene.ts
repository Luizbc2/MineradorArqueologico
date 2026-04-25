import Phaser from "phaser";
import pickMetalUrl from "../assets/pickaxes/pick-metal.png";
import pickStoneUrl from "../assets/pickaxes/pick-stone.png";
import pickWoodUrl from "../assets/pickaxes/pick-wood.png";
import villageHubCleanUrl from "../assets/surface/village-hub-clean-v1.png";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("pickaxe-metal", pickMetalUrl);
    this.load.image("pickaxe-stone", pickStoneUrl);
    this.load.image("pickaxe-wood", pickWoodUrl);
    this.load.image("surface-village-hub-clean", villageHubCleanUrl);

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    this.scene.start("mine");
  }
}
