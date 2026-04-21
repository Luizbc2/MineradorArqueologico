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
  private readonly closeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly closeButtonGlow: Phaser.GameObjects.Rectangle;
  private readonly closeButtonLabel: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const scrim = scene.add.rectangle(0, 0, 640, 576, gameTheme.colors.bgTop, 0.9);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: 76,
      y: 126,
      width: 488,
      height: 320,
      accentColor: gameTheme.colors.accentCool,
    });

    const cardPlate = scene.add.rectangle(95, 153, 450, 240, 0xead8b0, 0.98);
    cardPlate.setOrigin(0);
    cardPlate.setStrokeStyle(2, 0x9b7d41, 0.88);

    const cardInset = scene.add.rectangle(107, 165, 426, 216, 0xf5ebd1, 0.92);
    cardInset.setOrigin(0);
    cardInset.setStrokeStyle(1, 0xc7ad74, 0.74);

    const cardBand = scene.add.rectangle(95, 153, 450, 26, 0x4d3118, 0.96);
    cardBand.setOrigin(0);

    const codexSeal = scene.add.circle(505, 179, 18, 0xb78438, 0.95);
    codexSeal.setStrokeStyle(2, 0x5b3a0f, 0.85);

    this.chapterText = scene.add.text(
      505,
      170,
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
      320,
      168,
      "REGISTRO ARQUEOLOGICO",
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
      320,
      194,
      "Fragmento recuperado do codex subterraneo",
      makeGameTextStyle({
        color: "#cde8df",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );
    subtitle.setOrigin(0.5);

    this.bodyText = scene.add.text(
      320,
      220,
      "",
      makeGameTextStyle({
        color: "#31200d",
        fontSize: "21px",
        align: "center",
        wordWrapWidth: 370,
        strokeThickness: 0,
        family: "body",
        fontStyle: "700",
      }),
    );
    this.bodyText.setOrigin(0.5, 0);
    this.bodyText.setLineSpacing(10);

    this.progressText = scene.add.text(
      320,
      403,
      "",
      makeGameTextStyle({
        color: "#d9edf0",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.progressText.setOrigin(0.5);

    const progressTrack = scene.add.rectangle(196, 425, 248, 8, gameTheme.colors.panelDeep, 1);
    progressTrack.setOrigin(0, 0.5);
    progressTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    this.progressFill = scene.add.rectangle(196, 425, 248, 6, gameTheme.colors.accentCool, 1);
    this.progressFill.setOrigin(0, 0.5);

    this.closeButtonBody = scene.add.rectangle(320, 468, 166, 42, 0xe8cb79, 1);
    this.closeButtonBody.setStrokeStyle(2, 0x70511d, 0.88);

    this.closeButtonGlow = scene.add.rectangle(320, 468, 166, 42, 0xffefb6, 0.08);

    this.closeButtonLabel = scene.add.text(
      320,
      456,
      "VOLTAR AO TUNEL",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textDark,
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    this.closeButtonLabel.setOrigin(0.5, 0);

    this.closeButton = scene.add.container(0, 0, [
      this.closeButtonGlow,
      this.closeButtonBody,
      this.closeButtonLabel,
    ]);
    this.closeButton.setSize(166, 42);
    this.closeButton.setInteractive(
      new Phaser.Geom.Rectangle(237, 447, 166, 42),
      Phaser.Geom.Rectangle.Contains,
    );
    this.closeButton.on("pointerover", () => this.setButtonState(true));
    this.closeButton.on("pointerout", () => this.setButtonState(false));

    const hint = scene.add.text(
      320,
      512,
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

  show(snapshot: OverlaySnapshot) {
    this.bodyText.setText(snapshot.body);
    this.progressText.setText(`Cards encontrados: ${snapshot.collectedCount}/${snapshot.totalCount}`);
    this.chapterText.setText(`${snapshot.collectedCount}`);
    this.progressFill.width = Math.max(
      20,
      248 * Phaser.Math.Clamp(snapshot.collectedCount / snapshot.totalCount, 0, 1),
    );
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.cardRoot.setScale(0.94);
    this.setButtonState(false);
    this.closeButton.removeListener("pointerup", snapshot.onClose);
    this.closeButton.removeAllListeners("pointerup");
    this.closeButton.on("pointerup", snapshot.onClose);

    this.scene.tweens.killTweensOf([this.container, this.cardRoot]);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 140,
      ease: "quad.out",
    });
    this.scene.tweens.add({
      targets: this.cardRoot,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: "back.out",
    });
  }

  hide() {
    this.container.setVisible(false);
  }

  get isVisible() {
    return this.container.visible;
  }

  private setButtonState(hovered: boolean) {
    this.closeButtonBody.setFillStyle(hovered ? 0xf6dd95 : 0xe8cb79, 1);
    this.closeButtonGlow.setAlpha(hovered ? 0.18 : 0.08);
    this.closeButton.setScale(hovered ? 1.03 : 1);
  }
}
