import Phaser from "phaser";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type PauseOverlaySnapshot = {
  onResume: () => void;
};

export class PauseOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly panelRoot: Phaser.GameObjects.Container;
  private readonly resumeButton: Phaser.GameObjects.Container;
  private readonly resumeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly resumeButtonGlow: Phaser.GameObjects.Rectangle;
  private readonly menuButton: Phaser.GameObjects.Container;
  private readonly menuButtonBody: Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const viewportWidth = scene.scale.width;
    const viewportHeight = scene.scale.height;
    const panelWidth = 520;
    const panelHeight = 344;
    const panelX = (viewportWidth - panelWidth) / 2;
    const panelY = (viewportHeight - panelHeight) / 2 - 12;
    const centerX = viewportWidth / 2;

    const scrim = scene.add.rectangle(0, 0, viewportWidth, viewportHeight, gameTheme.colors.bgTop, 0.82);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      accentColor: gameTheme.colors.accentCool,
      alpha: 0.98,
    });

    const title = scene.add.text(
      centerX,
      panelY + 34,
      "PAUSA DA EXPEDICAO",
      makeGameTextStyle({
        family: "display",
        color: "#f1fbff",
        fontSize: "26px",
        fontStyle: "800",
        strokeThickness: 5,
      }),
    );
    title.setOrigin(0.5);

    const subtitle = scene.add.text(
      centerX,
      panelY + 60,
      "Respire, confira a rota e volte para o tunel quando quiser.",
      makeGameTextStyle({
        color: "#c9d9e9",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 2,
        align: "center",
        wordWrapWidth: 360,
      }),
    );
    subtitle.setOrigin(0.5, 0);

    const controlsPanel = scene.add.rectangle(panelX + 26, panelY + 104, panelWidth - 52, 112, gameTheme.colors.panelDeep, 0.96);
    controlsPanel.setOrigin(0);
    controlsPanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    const controlsTitle = scene.add.text(
      panelX + 42,
      panelY + 116,
      "ATALHOS RAPIDOS",
      makeGameTextStyle({
        family: "display",
        color: "#ffe8ab",
        fontSize: "13px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const controlsBody = scene.add.text(
      panelX + 42,
      panelY + 140,
      "ESC  pausa ou retoma\nE  interage com bau e registro\nU  abre a forja na superficie\nR  retorna para a base",
      makeGameTextStyle({
        color: gameTheme.colors.text,
        fontSize: "13px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );
    controlsBody.setLineSpacing(10);

    const roadmapPanel = scene.add.rectangle(panelX + 26, panelY + 226, panelWidth - 52, 44, gameTheme.colors.panelDeep, 0.9);
    roadmapPanel.setOrigin(0);
    roadmapPanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.72);

    const roadmapLabel = scene.add.text(
      centerX,
      panelY + 239,
      "Configuracoes e opcoes avancadas chegam no proximo passo.",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 1,
        align: "center",
      }),
    );
    roadmapLabel.setOrigin(0.5, 0);

    this.resumeButtonBody = scene.add.rectangle(0, 0, 172, 44, 0xe8cb79, 1);
    this.resumeButtonBody.setStrokeStyle(2, 0x70511d, 0.88);
    this.resumeButtonGlow = scene.add.rectangle(0, 0, 172, 44, 0xffefb6, 0.08);

    const resumeButtonLabel = scene.add.text(
      0,
      -13,
      "CONTINUAR",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textDark,
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    resumeButtonLabel.setOrigin(0.5, 0);

    this.resumeButton = scene.add.container(centerX - 88, panelY + 300, [
      this.resumeButtonGlow,
      this.resumeButtonBody,
      resumeButtonLabel,
    ]);
    this.resumeButton.setSize(172, 44);
    this.resumeButton.setInteractive(
      new Phaser.Geom.Rectangle(-86, -22, 172, 44),
      Phaser.Geom.Rectangle.Contains,
    );

    this.menuButtonBody = scene.add.rectangle(0, 0, 162, 44, gameTheme.colors.panelRaised, 1);
    this.menuButtonBody.setStrokeStyle(2, gameTheme.colors.border, 0.9);

    const menuButtonLabel = scene.add.text(
      0,
      -13,
      "MENU EM BREVE",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    menuButtonLabel.setOrigin(0.5, 0);

    this.menuButton = scene.add.container(centerX + 98, panelY + 300, [
      this.menuButtonBody,
      menuButtonLabel,
    ]);
    this.menuButton.setAlpha(0.74);

    const hint = scene.add.text(
      centerX,
      panelY + 336,
      "Pressione ESC para voltar para a expedicao",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "13px",
        fontStyle: "600",
        strokeThickness: 2,
      }),
    );
    hint.setOrigin(0.5);

    this.panelRoot = scene.add.container(0, 0, [
      ...chrome,
      title,
      subtitle,
      controlsPanel,
      controlsTitle,
      controlsBody,
      roadmapPanel,
      roadmapLabel,
      this.resumeButton,
      this.menuButton,
      hint,
    ]);

    this.container = scene.add.container(0, 0, [scrim, this.panelRoot]);
    this.container.setDepth(1980);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    this.resumeButton.on("pointerover", () => this.setResumeButtonState(true));
    this.resumeButton.on("pointerout", () => this.setResumeButtonState(false));
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: PauseOverlaySnapshot) {
    this.resumeButton.removeAllListeners("pointerup");
    this.resumeButton.on("pointerup", snapshot.onResume);
    this.setResumeButtonState(false);
    this.container.setVisible(true);
    this.container.setAlpha(0);
    this.panelRoot.setScale(0.96);

    this.scene.tweens.killTweensOf([this.container, this.panelRoot]);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 120,
      ease: "quad.out",
    });
    this.scene.tweens.add({
      targets: this.panelRoot,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "back.out",
    });
  }

  hide() {
    this.container.setVisible(false);
  }

  get isVisible() {
    return this.container.visible;
  }

  private setResumeButtonState(hovered: boolean) {
    this.resumeButtonBody.setFillStyle(hovered ? 0xf6dd95 : 0xe8cb79, 1);
    this.resumeButtonGlow.setAlpha(hovered ? 0.18 : 0.08);
    this.resumeButton.setScale(hovered ? 1.03 : 1);
  }
}
