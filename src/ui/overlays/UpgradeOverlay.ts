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
  private readonly panelRoot: Phaser.GameObjects.Container;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly descriptionText: Phaser.GameObjects.Text;
  private readonly currentPowerText: Phaser.GameObjects.Text;
  private readonly nextPowerText: Phaser.GameObjects.Text;
  private readonly costIronText: Phaser.GameObjects.Text;
  private readonly costGoldText: Phaser.GameObjects.Text;
  private readonly costDiamondText: Phaser.GameObjects.Text;
  private readonly upgradeButton: Phaser.GameObjects.Container;
  private readonly upgradeButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly upgradeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly upgradeButtonGlow: Phaser.GameObjects.Rectangle;
  private readonly upgradeButtonLabel: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Container;
  private readonly closeButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly closeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly closeButtonLabel: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const viewportWidth = scene.scale.width;
    const viewportHeight = scene.scale.height;
    const panelWidth = 540;
    const panelHeight = 320;
    const panelX = (viewportWidth - panelWidth) / 2;
    const panelY = (viewportHeight - panelHeight) / 2 - 10;
    const centerX = viewportWidth / 2;

    const scrim = scene.add.rectangle(0, 0, viewportWidth, viewportHeight, gameTheme.colors.bgTop, 0.9);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      accentColor: gameTheme.colors.accent,
    });

    const forgePanel = scene.add.rectangle(panelX + 24, panelY + 40, panelWidth - 48, 96, gameTheme.colors.panelDeep, 0.96);
    forgePanel.setOrigin(0);
    forgePanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    const costPanel = scene.add.rectangle(panelX + 24, panelY + 152, panelWidth - 48, 76, gameTheme.colors.panelDeep, 0.96);
    costPanel.setOrigin(0);
    costPanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    const title = scene.add.text(
      centerX,
      panelY + 32,
      "FORJA DA PICARETA",
      makeGameTextStyle({
        family: "display",
        color: "#ffe7b0",
        fontSize: "26px",
        fontStyle: "800",
        strokeThickness: 5,
      }),
    );
    title.setOrigin(0.5);

    const subtitle = scene.add.text(
      centerX,
      panelY + 58,
      "Lapide a ferramenta para cavar mais rapido e mais fundo",
      makeGameTextStyle({
        color: "#d7e8f2",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );
    subtitle.setOrigin(0.5);

    this.levelText = scene.add.text(
      centerX,
      panelY + 76,
      "",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "23px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );
    this.levelText.setOrigin(0.5);

    this.descriptionText = scene.add.text(
      centerX,
      panelY + 102,
      "Cada nivel reduz o tempo de escavacao e melhora o ritmo da expedicao.",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "15px",
        align: "center",
        wordWrapWidth: 330,
      }),
    );
    this.descriptionText.setOrigin(0.5, 0);

    this.currentPowerText = scene.add.text(
      centerX - 108,
      panelY + 158,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#dff9f0",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.currentPowerText.setOrigin(0.5, 0);

    this.nextPowerText = scene.add.text(
      centerX + 108,
      panelY + 158,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#ffe39b",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.nextPowerText.setOrigin(0.5, 0);

    const ironChip = scene.add.rectangle(centerX - 156, panelY + 197, 96, 22, 0x251b13, 0.98);
    ironChip.setOrigin(0);
    ironChip.setStrokeStyle(1, 0x6a4e36, 0.8);
    const goldChip = scene.add.rectangle(centerX - 48, panelY + 197, 96, 22, 0x31260d, 0.98);
    goldChip.setOrigin(0);
    goldChip.setStrokeStyle(1, 0x7d6731, 0.8);
    const diamondChip = scene.add.rectangle(centerX + 60, panelY + 197, 96, 22, 0x102734, 0.98);
    diamondChip.setOrigin(0);
    diamondChip.setStrokeStyle(1, 0x38657b, 0.8);

    this.costIronText = scene.add.text(
      centerX - 108,
      panelY + 199,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#f0c79f",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.costIronText.setOrigin(0.5, 0);

    this.costGoldText = scene.add.text(
      centerX,
      panelY + 199,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#ffe28a",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.costGoldText.setOrigin(0.5, 0);

    this.costDiamondText = scene.add.text(
      centerX + 108,
      panelY + 199,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#b8f7fa",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.costDiamondText.setOrigin(0.5, 0);

    this.upgradeButtonBody = scene.add.rectangle(0, 0, 164, 46, 0xe8cb79, 1);
    this.upgradeButtonBody.setStrokeStyle(2, 0x6f531c, 0.88);
    this.upgradeButtonGlow = scene.add.rectangle(0, 0, 164, 46, 0xffefb6, 0.08);
    this.upgradeButtonLabel = scene.add.text(
      0,
      -13,
      "EVOLUIR",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textDark,
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    this.upgradeButtonLabel.setOrigin(0.5, 0);
    this.upgradeButton = scene.add.container(centerX - 82, panelY + 268, [
      this.upgradeButtonGlow,
      this.upgradeButtonBody,
      this.upgradeButtonLabel,
    ]);
    this.upgradeButtonHitArea = this.upgradeButtonBody;
    this.upgradeButtonHitArea.setInteractive({ useHandCursor: true });

    this.closeButtonBody = scene.add.rectangle(0, 0, 140, 46, gameTheme.colors.panelRaised, 1);
    this.closeButtonBody.setStrokeStyle(2, gameTheme.colors.border, 0.9);
    this.closeButtonLabel = scene.add.text(
      0,
      -13,
      "FECHAR",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "17px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    this.closeButtonLabel.setOrigin(0.5, 0);
    this.closeButton = scene.add.container(centerX + 96, panelY + 268, [
      this.closeButtonBody,
      this.closeButtonLabel,
    ]);
    this.closeButtonHitArea = this.closeButtonBody;
    this.closeButtonHitArea.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(
      centerX,
      panelY + 304,
      "Use U ou ESC para sair da forja",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "14px",
        fontStyle: "600",
        strokeThickness: 2,
      }),
    );
    hint.setOrigin(0.5);

    this.panelRoot = scene.add.container(0, 0, [
      ...chrome,
      forgePanel,
      costPanel,
      title,
      subtitle,
      this.levelText,
      this.descriptionText,
      this.currentPowerText,
      this.nextPowerText,
      ironChip,
      goldChip,
      diamondChip,
      this.costIronText,
      this.costGoldText,
      this.costDiamondText,
      this.upgradeButton,
      this.closeButton,
      hint,
    ]);

    this.container = scene.add.container(0, 0, [scrim, this.panelRoot]);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    this.upgradeButtonHitArea.on("pointerover", () => this.setUpgradeButtonState(true, true));
    this.upgradeButtonHitArea.on("pointerout", () => this.setUpgradeButtonState(false, true));
    this.closeButtonHitArea.on("pointerover", () => this.setCloseButtonState(true));
    this.closeButtonHitArea.on("pointerout", () => this.setCloseButtonState(false));
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: OverlaySnapshot) {
    const currentSpeed = Math.round((1 + (snapshot.level - 1) * 0.25) * 100);
    const nextSpeed = Math.round((1 + snapshot.level * 0.25) * 100);

    this.levelText.setText(`LV ${snapshot.level}  ->  LV ${snapshot.level + 1}`);
    this.currentPowerText.setText(`ATUAL ${currentSpeed}%`);
    this.nextPowerText.setText(`PROXIMO ${nextSpeed}%`);
    this.costIronText.setText(`FERRO ${snapshot.cost.iron}`);
    this.costGoldText.setText(`OURO ${snapshot.cost.gold}`);
    this.costDiamondText.setText(`DIA ${snapshot.cost.diamond}`);

    this.upgradeButtonHitArea.removeAllListeners("pointerup");
    this.closeButtonHitArea.removeAllListeners("pointerup");
    this.upgradeButtonHitArea.on("pointerup", snapshot.onUpgrade);
    this.closeButtonHitArea.on("pointerup", snapshot.onClose);

    this.upgradeButtonHitArea.disableInteractive();
    if (snapshot.canUpgrade) {
      this.upgradeButtonHitArea.setInteractive({ useHandCursor: true });
    }

    this.setUpgradeButtonState(false, snapshot.canUpgrade);
    this.setCloseButtonState(false);
    this.container.setVisible(true);
    this.container.setAlpha(0);

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 140,
      ease: "quad.out",
    });
  }

  hide() {
    this.container.setVisible(false);
  }

  get isVisible() {
    return this.container.visible;
  }

  private setUpgradeButtonState(hovered: boolean, enabled: boolean) {
    const fill = enabled ? (hovered ? 0xf6dd95 : 0xe8cb79) : 0x78684a;
    const label = enabled ? gameTheme.colors.textDark : "#d7d3ca";
    this.upgradeButtonBody.setFillStyle(fill, 1);
    this.upgradeButtonGlow.setAlpha(enabled ? (hovered ? 0.18 : 0.08) : 0.02);
    this.upgradeButtonLabel.setColor(label);
    this.upgradeButton.setAlpha(enabled ? 1 : 0.62);
  }

  private setCloseButtonState(hovered: boolean) {
    this.closeButtonBody.setFillStyle(hovered ? 0x31465f : gameTheme.colors.panelRaised, 1);
    this.closeButton.setScale(hovered ? 1.02 : 1);
  }
}
