import Phaser from "phaser";

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
    const scrim = scene.add.rectangle(0, 0, 640, 576, 0x05070d, 0.82);
    scrim.setOrigin(0);

    const panel = scene.add.rectangle(320, 288, 470, 290, 0x132031, 0.97);
    panel.setStrokeStyle(3, 0x34516e, 1);

    const title = scene.add.text(320, 176, "Card de Arqueologia", {
      color: "#ffe28a",
      fontFamily: "monospace",
      fontSize: "24px",
      fontStyle: "bold",
      stroke: "#091018",
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    this.bodyText = scene.add.text(320, 236, "", {
      color: "#e4edf7",
      fontFamily: "monospace",
      fontSize: "16px",
      align: "center",
      wordWrap: { width: 380, useAdvancedWrap: true },
      lineSpacing: 6,
      stroke: "#091018",
      strokeThickness: 3,
    });
    this.bodyText.setOrigin(0.5, 0);

    this.progressText = scene.add.text(320, 432, "", {
      color: "#d0dbea",
      fontFamily: "monospace",
      fontSize: "15px",
      stroke: "#091018",
      strokeThickness: 3,
    });
    this.progressText.setOrigin(0.5);

    this.closeButton = scene.add.text(320, 472, "Fechar", {
      color: "#091018",
      backgroundColor: "#ffe28a",
      fontFamily: "monospace",
      fontSize: "18px",
      fontStyle: "bold",
      padding: { left: 18, right: 18, top: 8, bottom: 8 },
    });
    this.closeButton.setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(320, 520, "Pressione ESC ou E para voltar", {
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
  }

  hide() {
    this.container.setVisible(false);
  }

  get isVisible() {
    return this.container.visible;
  }
}
