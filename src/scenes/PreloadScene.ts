import Phaser from "phaser";
import vendorOutpostUrl from "../assets/surface/vendor-outpost-v3.png";
import workshopStationUrl from "../assets/surface/workshop-station-v3.png";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("surface-vendor-outpost", vendorOutpostUrl);
    this.load.image("surface-workshop-station", workshopStationUrl);

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    this.scene.start("mine");
  }
}
