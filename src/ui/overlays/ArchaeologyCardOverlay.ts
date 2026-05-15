import Phaser from "phaser";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type OverlaySnapshot = {
  body: string;
  collectedCount: number;
  totalCount: number;
  onClose: () => void;
};

export class ArchaeologyCardOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly cardRoot: Phaser.GameObjects.Container;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly progressText: Phaser.GameObjects.Text;
  private readonly progressFill: Phaser.GameObjects.Rectangle;
  private readonly chapterText: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Container;
  private readonly closeButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly closeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly closeButtonGlow: Phaser.GameObjects.Rectangle;
  private readonly closeButtonLabel: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const viewportWidth = scene.scale.width;
    const viewportHeight = scene.scale.height;
    const panelWidth = 560;
    const panelHeight = 360;
    const panelX = (viewportWidth - panelWidth) / 2;
    const panelY = (viewportHeight - panelHeight) / 2 - 6;
    const centerX = viewportWidth / 2;

    const scrim = scene.add.rectangle(0, 0, viewportWidth, viewportHeight, gameTheme.colors.bgTop, 0.9);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      accentColor: gameTheme.colors.accentCool,
    });

    const cardPlate = scene.add.rectangle(panelX + 20, panelY + 28, panelWidth - 40, 260, 0xead8b0, 0.98);
    cardPlate.setOrigin(0);
    cardPlate.setStrokeStyle(2, 0x9b7d41, 0.88);

    const cardInset = scene.add.rectangle(panelX + 32, panelY + 40, panelWidth - 64, 236, 0xf5ebd1, 0.92);
    cardInset.setOrigin(0);
    cardInset.setStrokeStyle(1, 0xc7ad74, 0.74);

    const cardBand = scene.add.rectangle(panelX + 20, panelY + 28, panelWidth - 40, 26, 0x4d3118, 0.96);
    cardBand.setOrigin(0);

    const codexSeal = scene.add.circle(panelX + panelWidth - 42, panelY + 54, 18, 0xb78438, 0.95);
    codexSeal.setStrokeStyle(2, 0x5b3a0f, 0.85);

    this.chapterText = scene.add.text(
      panelX + panelWidth - 42,
      panelY + 45,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#fff4d0",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.chapterText.setOrigin(0.5, 0);

    const title = scene.add.text(
      centerX,
      panelY + 44,
      "REGISTRO ARQUEOLÓGICO",
      makeGameTextStyle({
        family: "display",
        color: "#fff7db",
        fontSize: "24px",
        fontStyle: "800",
        strokeThickness: 5,
      }),
    );
    title.setOrigin(0.5);

    const subtitle = scene.add.text(
      centerX,
      panelY + 70,
      "Fragmento recuperado do códex subterrâneo",
      makeGameTextStyle({
        color: "#cde8df",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );
    subtitle.setOrigin(0.5);

    this.bodyText = scene.add.text(
      centerX,
      panelY + 96,
      "",
      makeGameTextStyle({
        color: "#31200d",
        fontSize: "22px",
        align: "center",
        wordWrapWidth: 420,
        strokeThickness: 0,
        family: "body",
        fontStyle: "700",
      }),
    );
    this.bodyText.setOrigin(0.5, 0);
    this.bodyText.setLineSpacing(10);

    this.progressText = scene.add.text(
      centerX,
      panelY + 294,
      "",
      makeGameTextStyle({
        color: "#d9edf0",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.progressText.setOrigin(0.5);

    const progressTrack = scene.add.rectangle(centerX - 124, panelY + 316, 248, 8, gameTheme.colors.panelDeep, 1);
    progressTrack.setOrigin(0, 0.5);
    progressTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    this.progressFill = scene.add.rectangle(centerX - 124, panelY + 316, 248, 6, gameTheme.colors.accentCool, 1);
    this.progressFill.setOrigin(0, 0.5);

    this.closeButtonBody = scene.add.rectangle(0, 0, 180, 44, 0xe8cb79, 1);
    this.closeButtonBody.setStrokeStyle(2, 0x70511d, 0.88);

    this.closeButtonGlow = scene.add.rectangle(0, 0, 180, 44, 0xffefb6, 0.08);

    this.closeButtonLabel = scene.add.text(
      0,
      -13,
      "VOLTAR AO TÚNEL",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textDark,
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    this.closeButtonLabel.setOrigin(0.5, 0);

    this.closeButton = scene.add.container(centerX, panelY + 356, [
      this.closeButtonGlow,
      this.closeButtonBody,
      this.closeButtonLabel,
    ]);
    this.closeButtonHitArea = this.closeButtonBody;
    this.closeButtonHitArea.setInteractive({ useHandCursor: true });
    this.closeButtonHitArea.on("pointerover", () => this.setButtonState(true));
    this.closeButtonHitArea.on("pointerout", () => this.setButtonState(false));

    const hint = scene.add.text(
      centerX,
      panelY + 402,
      "Pressione ESC ou E para fechar o registro",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "14px",
        fontStyle: "600",
        strokeThickness: 2,
      }),
    );
    hint.setOrigin(0.5);

    this.cardRoot = scene.add.container(0, 0, [
      ...chrome,
      cardPlate,
      cardInset,
      cardBand,
      codexSeal,
      this.chapterText,
      title,
      subtitle,
      this.bodyText,
      this.progressText,
      progressTrack,
      this.progressFill,
      this.closeButton,
      hint,
    ]);

    this.container = scene.add.container(0, 0, [scrim, this.cardRoot]);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: OverlaySnapshot) {
    const collectionRatio = Phaser.Math.Clamp(snapshot.collectedCount / snapshot.totalCount, 0, 1);
    const collectionPercent = Math.round(collectionRatio * 100);

    this.bodyText.setText(snapshot.body);
    this.progressText.setText(`Cards encontrados: ${snapshot.collectedCount}/${snapshot.totalCount} · ${collectionPercent}%`);
    this.chapterText.setText(`${snapshot.collectedCount}`);
    this.progressFill.width = Math.max(
      20,
      248 * collectionRatio,
    );
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.setButtonState(false);
    this.closeButtonHitArea.removeListener("pointerup", snapshot.onClose);
    this.closeButtonHitArea.removeAllListeners("pointerup");
    this.closeButtonHitArea.on("pointerup", snapshot.onClose);

    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 140,
      ease: "quad.out",
    });
  }

  hide() {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 120,
      ease: "quad.out",
      onComplete: () => this.container.setVisible(false),
    });
  }

  get isVisible() {
    return this.container.visible;
  }

  private setButtonState(hovered: boolean) {
    this.closeButtonBody.setFillStyle(hovered ? 0xf6dd95 : 0xe8cb79, 1);
    this.closeButtonGlow.setAlpha(hovered ? 0.18 : 0.08);
  }
}
