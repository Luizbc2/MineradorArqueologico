import Phaser from "phaser";
import type { PickaxeUpgradeCost } from "../../game/progression/pickaxeUpgrade";

type OverlaySnapshot = {
  level: number;
  cost: PickaxeUpgradeCost;
  canUpgrade: boolean;
  onUpgrade: () => void;
  onClose: () => void;
};

export class UpgradeOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly descriptionText: Phaser.GameObjects.Text;
  private readonly costText: Phaser.GameObjects.Text;
  private readonly upgradeButton: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const scrim = scene.add.rectangle(0, 0, 640, 576, 0x05070d, 0.82);
    scrim.setOrigin(0);

    const panel = scene.add.rectangle(320, 288, 430, 250, 0x132031, 0.97);
    panel.setStrokeStyle(3, 0x34516e, 1);

    const title = scene.add.text(320, 188, "Upgrade da Picareta", {
      color: "#ffe28a",
      fontFamily: "monospace",
      fontSize: "24px",
      fontStyle: "bold",
      stroke: "#091018",
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    this.levelText = scene.add.text(320, 228, "", {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "17px",
      stroke: "#091018",
      strokeThickness: 3,
    });
    this.levelText.setOrigin(0.5);

    this.descriptionText = scene.add.text(
      320,
      262,
      "Cada nivel aumenta a velocidade de escavacao.",
      {
        color: "#cfd9e2",
        fontFamily: "monospace",
        fontSize: "15px",
        align: "center",
        wordWrap: { width: 340, useAdvancedWrap: true },
        stroke: "#091018",
        strokeThickness: 3,
      },
    );
    this.descriptionText.setOrigin(0.5, 0);

    this.costText = scene.add.text(320, 330, "", {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "15px",
      align: "center",
      stroke: "#091018",
      strokeThickness: 3,
    });
    this.costText.setOrigin(0.5);

    this.upgradeButton = scene.add.text(250, 400, "Evoluir", {
      color: "#091018",
      backgroundColor: "#ffe28a",
      fontFamily: "monospace",
      fontSize: "18px",
      fontStyle: "bold",
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
    });
    this.upgradeButton.setOrigin(0.5);
    this.upgradeButton.setInteractive({ useHandCursor: true });

    this.closeButton = scene.add.text(390, 400, "Fechar", {
      color: "#d9e4f2",
      backgroundColor: "#26384e",
      fontFamily: "monospace",
      fontSize: "18px",
      fontStyle: "bold",
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
    });
    this.closeButton.setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(320, 448, "Use U ou ESC para fechar", {
      color: "#9cb2cb",
      fontFamily: "monospace",
      fontSize: "14px",
      stroke: "#091018",
      strokeThickness: 2,
    });
    hint.setOrigin(0.5);

    this.container = scene.add.container(0, 0, [
      scrim,
      panel,
      title,
      this.levelText,
      this.descriptionText,
      this.costText,
      this.upgradeButton,
      this.closeButton,
      hint,
    ]);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
  }

  show(snapshot: OverlaySnapshot) {
    this.levelText.setText(`Nivel atual: ${snapshot.level}`);
    this.costText.setText(
      `Custo proximo nivel\nFerro ${snapshot.cost.iron}  Ouro ${snapshot.cost.gold}  Diamante ${snapshot.cost.diamond}`,
    );
    this.upgradeButton.setAlpha(snapshot.canUpgrade ? 1 : 0.45);
    this.upgradeButton.disableInteractive();
    if (snapshot.canUpgrade) {
      this.upgradeButton.setInteractive({ useHandCursor: true });
    }

    this.upgradeButton.removeAllListeners();
    this.closeButton.removeAllListeners();
    this.upgradeButton.on("pointerup", snapshot.onUpgrade);
    this.closeButton.on("pointerup", snapshot.onClose);
    this.container.setVisible(true);
  }

  hide() {
    this.container.setVisible(false);
  }

  get isVisible() {
    return this.container.visible;
  }
}
