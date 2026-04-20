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
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly progressText: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const scrim = scene.add.rectangle(0, 0, 640, 576, gameTheme.colors.bgTop, 0.86);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: 85,
      y: 145,
      width: 470,
      height: 290,
      accentColor: gameTheme.colors.accentCool,
    });

    const title = scene.add.text(
      320,
      176,
      "Card de Arqueologia",
      makeGameTextStyle({
        family: "display",
        color: "#e9fff8",
        fontSize: "28px",
        fontStyle: "700",
        strokeThickness: 5,
      }),
    );
    title.setOrigin(0.5);

    this.bodyText = scene.add.text(
      320,
      236,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.text,
        fontSize: "18px",
        align: "center",
        wordWrapWidth: 390,
      }),
    );
    this.bodyText.setOrigin(0.5, 0);
    this.bodyText.setLineSpacing(8);

    this.progressText = scene.add.text(
      320,
      432,
      "",
      makeGameTextStyle({
        color: "#d4e4ee",
        fontSize: "16px",
        fontStyle: "700",
      }),
    );
    this.progressText.setOrigin(0.5);

    this.closeButton = scene.add.text(
      320,
      472,
      "Fechar",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textDark,
        fontSize: "20px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    this.closeButton.setOrigin(0.5);
    this.closeButton.setBackgroundColor("#ffe28a");
    this.closeButton.setPadding(22, 10, 22, 10);
    this.closeButton.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(
      320,
      520,
      "Pressione ESC ou E para voltar",
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
      this.bodyText,
      this.progressText,
      this.closeButton,
      hint,
    ]);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
  }

  show(snapshot: OverlaySnapshot) {
    this.bodyText.setText(snapshot.body);
    this.progressText.setText(`Cards encontrados: ${snapshot.collectedCount}/${snapshot.totalCount}`);
    this.container.setVisible(true);
    this.closeButton.removeAllListeners();
    this.closeButton.on("pointerup", snapshot.onClose);
    this.closeButton.setScale(1);
  }

  hide() {
    this.container.setVisible(false);
  }

  get isVisible() {
    return this.container.visible;
  }
}
