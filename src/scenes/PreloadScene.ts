import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    // O loop principal entra nos proximos commits. Por enquanto deixamos
    // o runtime Phaser validado e pronto para assumir o jogo aos poucos.
    this.scene.pause();
  }
}
