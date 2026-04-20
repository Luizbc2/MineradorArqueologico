import Phaser from "phaser";
import type { ResourceInventory } from "../../game/inventory/resourceInventory";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type HudSnapshot = {
  depth: number;
  energy: number;
  pickaxeLevel: number;
  cardsFound: number;
  cardsTotal: number;
  inventory: ResourceInventory;
};

export class MineHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly energyFill: Phaser.GameObjects.Rectangle;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly pickaxeText: Phaser.GameObjects.Text;
  private readonly cardsText: Phaser.GameObjects.Text;
  private readonly inventoryText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const chrome = createPanelChrome(scene, {
      x: 14,
      y: 14,
      width: 430,
      height: 122,
      accentColor: gameTheme.colors.accent,
    });

    const title = scene.add.text(
      30,
      24,
      "MINERADOR ARQUEOLOGICO",
      makeGameTextStyle({
        family: "display",
        color: "#ffe7b0",
        fontSize: "22px",
        fontStyle: "700",
        strokeThickness: 5,
      }),
    );

    const subtitle = scene.add.text(
      31,
      46,
      "Expedicao subterranea",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "15px",
        fontStyle: "600",
        strokeThickness: 2,
      }),
    );

    const energyTrack = scene.add.rectangle(258, 54, 150, 14, gameTheme.colors.panelDeep, 1);
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.8);

    this.energyFill = scene.add.rectangle(258, 54, 150, 10, gameTheme.colors.accentCool, 1);
    this.energyFill.setOrigin(0, 0.5);

    this.depthText = scene.add.text(
      30,
      70,
      "",
      makeGameTextStyle({ family: "display", fontSize: "20px", fontStyle: "700" }),
    );

    this.energyText = scene.add.text(
      258,
      34,
      "",
      makeGameTextStyle({ color: gameTheme.colors.textMuted, fontSize: "14px", fontStyle: "700" }),
    );

    this.pickaxeText = scene.add.text(
      200,
      72,
      "",
      makeGameTextStyle({ fontSize: "17px", fontStyle: "700" }),
    );

    this.cardsText = scene.add.text(
      200,
      96,
      "",
      makeGameTextStyle({ color: "#f5d78f", fontSize: "17px", fontStyle: "700" }),
    );

    this.inventoryText = scene.add.text(
      30,
      100,
      "",
      makeGameTextStyle({ color: gameTheme.colors.textMuted, fontSize: "16px", fontStyle: "600" }),
    );

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      subtitle,
      energyTrack,
      this.energyFill,
      this.depthText,
      this.energyText,
      this.pickaxeText,
      this.cardsText,
      this.inventoryText,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
  }

  update(snapshot: HudSnapshot) {
    this.depthText.setText(`${snapshot.depth}m`);
    this.energyText.setText(`ENERGIA ${snapshot.energy}%`);
    this.pickaxeText.setText(`Picareta  Lv ${snapshot.pickaxeLevel}`);
    this.cardsText.setText(`Codex  ${snapshot.cardsFound}/${snapshot.cardsTotal}`);
    this.inventoryText.setText(
      `C ${snapshot.inventory.coal}   F ${snapshot.inventory.iron}   O ${snapshot.inventory.gold}   D ${snapshot.inventory.diamond}`,
    );
    this.energyFill.width = Math.max(12, 150 * (snapshot.energy / 100));
  }
}
