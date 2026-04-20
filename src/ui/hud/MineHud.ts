import Phaser from "phaser";
import type { ResourceInventory } from "../../game/inventory/resourceInventory";

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
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly pickaxeText: Phaser.GameObjects.Text;
  private readonly cardsText: Phaser.GameObjects.Text;
  private readonly inventoryText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const background = scene.add.rectangle(14, 14, 372, 92, 0x0b1320, 0.84);
    background.setOrigin(0);
    background.setStrokeStyle(2, 0x2f4766, 0.9);

    const title = scene.add.text(28, 24, "Minerador Arqueologico", {
      color: "#ffe28a",
      fontFamily: "monospace",
      fontSize: "20px",
      fontStyle: "bold",
      stroke: "#091018",
      strokeThickness: 4,
    });

    this.depthText = scene.add.text(28, 50, "", {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "16px",
      stroke: "#091018",
      strokeThickness: 3,
    });

    this.energyText = scene.add.text(170, 50, "", {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "16px",
      stroke: "#091018",
      strokeThickness: 3,
    });

    this.pickaxeText = scene.add.text(290, 50, "", {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "16px",
      stroke: "#091018",
      strokeThickness: 3,
    });

    this.cardsText = scene.add.text(28, 72, "", {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "15px",
      stroke: "#091018",
      strokeThickness: 3,
    });

    this.inventoryText = scene.add.text(28, 92, "", {
      color: "#cfd9e2",
      fontFamily: "monospace",
      fontSize: "14px",
      stroke: "#091018",
      strokeThickness: 3,
    });

    this.container = scene.add.container(0, 0, [
      background,
      title,
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
    this.depthText.setText(`Prof.: ${snapshot.depth}m`);
    this.energyText.setText(`Energia ${snapshot.energy}%`);
    this.pickaxeText.setText(`Picareta Lv ${snapshot.pickaxeLevel}`);
    this.cardsText.setText(`Cards ${snapshot.cardsFound}/${snapshot.cardsTotal}`);
    this.inventoryText.setText(
      `Carvao ${snapshot.inventory.coal}  Ferro ${snapshot.inventory.iron}  Ouro ${snapshot.inventory.gold}  Diamante ${snapshot.inventory.diamond}`,
    );
  }
}
