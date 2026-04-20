import Phaser from "phaser";
import type { PickaxeUpgradeCost } from "../../game/progression/pickaxeUpgrade";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

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
    const scrim = scene.add.rectangle(0, 0, 640, 576, gameTheme.colors.bgTop, 0.86);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: 105,
      y: 163,
      width: 430,
      height: 250,
      accentColor: gameTheme.colors.accent,
    });

    const title = scene.add.text(
      320,
      188,
      "Upgrade da Picareta",
      makeGameTextStyle({
        family: "display",
        color: "#ffe7b0",
        fontSize: "28px",
        fontStyle: "700",
        strokeThickness: 5,
      }),
    );
    title.setOrigin(0.5);

    this.levelText = scene.add.text(
      320,
      228,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.text,
        fontSize: "19px",
        fontStyle: "700",
      }),
    );
    this.levelText.setOrigin(0.5);

    this.descriptionText = scene.add.text(
      320,
      262,
      "Cada nivel aumenta a velocidade de escavacao.",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "17px",
        align: "center",
        wordWrapWidth: 340,
      }),
    );
    this.descriptionText.setOrigin(0.5, 0);

    this.costText = scene.add.text(
      320,
      330,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.text,
        fontSize: "17px",
        align: "center",
      }),
    );
    this.costText.setOrigin(0.5);

    this.upgradeButton = scene.add.text(
      250,
      400,
      "Evoluir",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textDark,
        fontSize: "20px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    this.upgradeButton.setOrigin(0.5);
    this.upgradeButton.setBackgroundColor("#ffe28a");
    this.upgradeButton.setPadding(18, 10, 18, 10);
    this.upgradeButton.setInteractive({ useHandCursor: true });

    this.closeButton = scene.add.text(
      390,
      400,
      "Fechar",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "20px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );
    this.closeButton.setOrigin(0.5);
    this.closeButton.setBackgroundColor("#26384e");
    this.closeButton.setPadding(18, 10, 18, 10);
    this.closeButton.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(
      320,
      448,
      "Use U ou ESC para fechar",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "15px",
        fontStyle: "600",
        strokeThickness: 2,
      }),
    );
    hint.setOrigin(0.5);

    this.container = scene.add.container(0, 0, [
      scrim,
      ...chrome,
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
    this.upgradeButton.setScale(1);
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
