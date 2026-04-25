import Phaser from "phaser";
import pickaxeIconUrl from "../assets/pickaxes/pick_axe_cc0.png";
import villageHubCleanUrl from "../assets/surface/village-hub-clean-v1.png";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("pickaxe-icon", pickaxeIconUrl);
    this.load.image("surface-village-hub-clean", villageHubCleanUrl);

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    this.scene.start("mine");
  }
}
