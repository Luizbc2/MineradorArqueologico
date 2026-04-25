import Phaser from "phaser";
import ancientCrystalPickaxeUrl from "../assets/pickaxes/ancient-crystal.svg";
import copperPickaxeUrl from "../assets/pickaxes/copper.svg";
import diamondPickaxeUrl from "../assets/pickaxes/diamond.svg";
import goldPickaxeUrl from "../assets/pickaxes/gold.svg";
import ironPickaxeUrl from "../assets/pickaxes/iron.svg";
import obsidianPickaxeUrl from "../assets/pickaxes/obsidian.svg";
import pickaxeIconUrl from "../assets/pickaxes/pick_axe_cc0.png";
import stonePickaxeUrl from "../assets/pickaxes/stone.svg";
import woodPickaxeUrl from "../assets/pickaxes/wood.svg";
import villageHubCleanUrl from "../assets/surface/village-hub-clean-v1.png";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    this.load.image("pickaxe-icon", pickaxeIconUrl);
    this.load.svg("pickaxe-wood", woodPickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-stone", stonePickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-copper", copperPickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-iron", ironPickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-gold", goldPickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-diamond", diamondPickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-obsidian", obsidianPickaxeUrl, { width: 128, height: 128 });
    this.load.svg("pickaxe-ancientCrystal", ancientCrystalPickaxeUrl, { width: 128, height: 128 });
    this.load.image("surface-village-hub-clean", villageHubCleanUrl);

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.game.events.emit("phaser:preload-complete");
    });
  }

  create() {
    this.scene.start("mine");
  }
}
