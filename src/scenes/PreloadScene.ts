import Phaser from "phaser";
import villageHubUrl from "../assets/surface/village-hub-v2.png";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("surface-village-hub", villageHubUrl);

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    this.scene.start("mine");
  }
}
