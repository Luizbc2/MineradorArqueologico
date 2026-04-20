import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    this.game.events.emit("phaser:booted");
    this.scene.start("preload");
  }
}
