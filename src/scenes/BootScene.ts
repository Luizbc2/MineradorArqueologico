import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    this.game.events.emit("phaser:booted");
    this.scene.start("preload");
    void this.prepareFonts();
  }

  private async prepareFonts() {
    if (typeof document === "undefined" || !("fonts" in document)) {
      return;
    }

    const fontsToWarm = [
      '800 16px "Sora"',
      '700 16px "Sora"',
      '500 16px "Sora"',
    ];

    await Promise.race([
      Promise.all(fontsToWarm.map((font) => document.fonts.load(font))).then(() => document.fonts.ready),
      new Promise((resolve) => window.setTimeout(resolve, 1500)),
    ]);
  }
}
