import Phaser from "phaser";
import type { PickaxeDefinition, PickaxeId } from "../../game/progression/pickaxeCatalog";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type PickaxeShopLine = {
  pickaxe: PickaxeDefinition;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  canBuy: boolean;
};

type OverlaySnapshot = {
  coins: number;
  maxDepthReached: number;
  pickaxes: PickaxeShopLine[];
  onBuy: (id: PickaxeId) => void;
  onEquip: (id: PickaxeId) => void;
  onClose: () => void;
};

const PANEL_WIDTH = 760;
const PANEL_HEIGHT = 540;
const CARD_WIDTH = 204;
const CARD_HEIGHT = 320;
const CARD_GAP = 18;
const CARDS_PER_PAGE = 3;

export class UpgradeOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly panelRoot: Phaser.GameObjects.Container;
  private readonly carouselRoot: Phaser.GameObjects.Container;
  private readonly coinsText: Phaser.GameObjects.Text;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly pageText: Phaser.GameObjects.Text;
  private readonly previousButton: Phaser.GameObjects.Container;
  private readonly previousButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly previousButtonBody: Phaser.GameObjects.Rectangle;
  private readonly nextButton: Phaser.GameObjects.Container;
  private readonly nextButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly nextButtonBody: Phaser.GameObjects.Rectangle;
  private readonly closeButton: Phaser.GameObjects.Container;
  private readonly closeButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly closeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;
  private cardRoots: Phaser.GameObjects.Container[] = [];
  private pageIndex = 0;
  private snapshot?: OverlaySnapshot;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const viewportWidth = scene.scale.width;
    const viewportHeight = scene.scale.height;
    const panelX = (viewportWidth - PANEL_WIDTH) / 2;
    const panelY = (viewportHeight - PANEL_HEIGHT) / 2 - 4;
    const centerX = viewportWidth / 2;

    const scrim = scene.add.rectangle(0, 0, viewportWidth, viewportHeight, gameTheme.colors.bgTop, 0.9);
    scrim.setOrigin(0);

    const chrome = createPanelChrome(scene, {
      x: panelX,
      y: panelY,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      accentColor: gameTheme.colors.accent,
    });

    const title = scene.add.text(
      centerX,
      panelY + 35,
      "CATALOGO DE PICARETAS",
      makeGameTextStyle({
        family: "display",
        color: "#ffe7b0",
        fontSize: "26px",
        fontStyle: "800",
        strokeThickness: 5,
        resolution: 6,
      }),
    );
    title.setOrigin(0.5);

    this.coinsText = scene.add.text(
      panelX + 34,
      panelY + 68,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#ffe28a",
        fontSize: "15px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );

    this.depthText = scene.add.text(
      panelX + PANEL_WIDTH - 34,
      panelY + 68,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#b8f7fa",
        fontSize: "15px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    this.depthText.setOrigin(1, 0);

    this.carouselRoot = scene.add.container(0, 0);

    this.previousButtonBody = scene.add.rectangle(0, 0, 44, 58, gameTheme.colors.panelRaised, 1);
    this.previousButtonBody.setStrokeStyle(2, gameTheme.colors.border, 0.9);
    const previousLabel = scene.add.text(
      0,
      -18,
      "<",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "28px",
        fontStyle: "800",
        resolution: 6,
      }),
    );
    previousLabel.setOrigin(0.5, 0);
    this.previousButton = scene.add.container(panelX + 28, panelY + 244, [
      this.previousButtonBody,
      previousLabel,
    ]);
    this.previousButtonHitArea = this.previousButtonBody;
    this.previousButtonHitArea.setInteractive({ useHandCursor: true });

    this.nextButtonBody = scene.add.rectangle(0, 0, 44, 58, gameTheme.colors.panelRaised, 1);
    this.nextButtonBody.setStrokeStyle(2, gameTheme.colors.border, 0.9);
    const nextLabel = scene.add.text(
      0,
      -18,
      ">",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "28px",
        fontStyle: "800",
        resolution: 6,
      }),
    );
    nextLabel.setOrigin(0.5, 0);
    this.nextButton = scene.add.container(panelX + PANEL_WIDTH - 28, panelY + 244, [
      this.nextButtonBody,
      nextLabel,
    ]);
    this.nextButtonHitArea = this.nextButtonBody;
    this.nextButtonHitArea.setInteractive({ useHandCursor: true });

    this.pageText = scene.add.text(
      centerX,
      panelY + 436,
      "",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "13px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    this.pageText.setOrigin(0.5, 0);

    this.closeButtonBody = scene.add.rectangle(0, 0, 150, 42, gameTheme.colors.panelRaised, 1);
    this.closeButtonBody.setStrokeStyle(2, gameTheme.colors.border, 0.9);
    const closeButtonLabel = scene.add.text(
      0,
      -12,
      "FECHAR",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "16px",
        fontStyle: "800",
        resolution: 6,
      }),
    );
    closeButtonLabel.setOrigin(0.5, 0);
    this.closeButton = scene.add.container(centerX - 75, panelY + 468, [
      this.closeButtonBody,
      closeButtonLabel,
    ]);
    this.closeButtonHitArea = this.closeButtonBody;
    this.closeButtonHitArea.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(
      centerX,
      panelY + 502,
      "Use E ou ESC para sair da oficina",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "13px",
        fontStyle: "600",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    hint.setOrigin(0.5);

    this.panelRoot = scene.add.container(0, 0, [
      ...chrome,
      title,
      this.coinsText,
      this.depthText,
      this.carouselRoot,
      this.previousButton,
      this.nextButton,
      this.pageText,
      this.closeButton,
      hint,
    ]);

    this.container = scene.add.container(0, 0, [scrim, this.panelRoot]);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    this.previousButtonHitArea.on("pointerover", () => this.setArrowState("previous", true));
    this.previousButtonHitArea.on("pointerout", () => this.setArrowState("previous", false));
    this.nextButtonHitArea.on("pointerover", () => this.setArrowState("next", true));
    this.nextButtonHitArea.on("pointerout", () => this.setArrowState("next", false));
    this.closeButtonHitArea.on("pointerover", () => this.setCloseButtonState(true));
    this.closeButtonHitArea.on("pointerout", () => this.setCloseButtonState(false));
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: OverlaySnapshot) {
    this.snapshot = snapshot;
    this.pageIndex = Phaser.Math.Clamp(this.pageIndex, 0, this.getLastPage(snapshot));
    this.coinsText.setText(`MOEDAS ${snapshot.coins}`);
    this.depthText.setText(`PROFUNDIDADE ${snapshot.maxDepthReached}m`);
    this.renderCards(snapshot);

    this.previousButtonHitArea.removeAllListeners("pointerup");
    this.nextButtonHitArea.removeAllListeners("pointerup");
    this.closeButtonHitArea.removeAllListeners("pointerup");
    this.previousButtonHitArea.on("pointerup", () => this.changePage(-1));
    this.nextButtonHitArea.on("pointerup", () => this.changePage(1));
    this.closeButtonHitArea.on("pointerup", snapshot.onClose);

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

  private changePage(direction: -1 | 1) {
    if (!this.snapshot) {
      return;
    }

    this.pageIndex = Phaser.Math.Clamp(
      this.pageIndex + direction,
      0,
      this.getLastPage(this.snapshot),
    );
    this.renderCards(this.snapshot);
  }

  private renderCards(snapshot: OverlaySnapshot) {
    for (const card of this.cardRoots) {
      card.destroy(true);
    }

    this.cardRoots = [];

    const panelX = (this.scene.scale.width - PANEL_WIDTH) / 2;
    const panelY = (this.scene.scale.height - PANEL_HEIGHT) / 2 - 4;
    const startX = panelX + 70;
    const startY = panelY + 102;
    const pageStart = this.pageIndex * CARDS_PER_PAGE;
    const visibleLines = snapshot.pickaxes.slice(pageStart, pageStart + CARDS_PER_PAGE);

    visibleLines.forEach((line, index) => {
      const x = startX + index * (CARD_WIDTH + CARD_GAP);
      const card = this.createPickaxeCard(x, startY, line, snapshot);
      this.applyCardCameraFilter(card);
      this.carouselRoot.add(card);
      this.cardRoots.push(card);
    });

    const totalPages = this.getLastPage(snapshot) + 1;
    this.pageText.setText(`${this.pageIndex + 1}/${totalPages}`);
    this.setArrowEnabled("previous", this.pageIndex > 0);
    this.setArrowEnabled("next", this.pageIndex < totalPages - 1);
  }

  private applyCardCameraFilter(card: Phaser.GameObjects.Container) {
    card.cameraFilter = this.carouselRoot.cameraFilter;

    for (const child of card.list) {
      child.cameraFilter = this.carouselRoot.cameraFilter;

      if (child instanceof Phaser.GameObjects.Container) {
        for (const nestedChild of child.list) {
          nestedChild.cameraFilter = this.carouselRoot.cameraFilter;
        }
      }
    }
  }

  private createPickaxeCard(
    x: number,
    y: number,
    line: PickaxeShopLine,
    snapshot: OverlaySnapshot,
  ) {
    const borderColor = line.equipped
      ? gameTheme.colors.accent
      : line.owned
        ? gameTheme.colors.success
        : gameTheme.colors.borderSoft;
    const bodyColor = line.locked ? 0x171313 : gameTheme.colors.panelDeep;
    const body = this.scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, bodyColor, line.locked ? 0.72 : 0.98);
    body.setOrigin(0);
    body.setStrokeStyle(2, borderColor, line.locked ? 0.38 : 0.92);

    const title = this.scene.add.text(
      CARD_WIDTH / 2,
      16,
      line.pickaxe.name,
      makeGameTextStyle({
        family: "display",
        color: line.locked ? "#8d8170" : gameTheme.colors.text,
        fontSize: "15px",
        fontStyle: "800",
        align: "center",
        wordWrapWidth: CARD_WIDTH - 24,
        strokeThickness: 3,
        resolution: 6,
      }),
    );
    title.setOrigin(0.5, 0);

    const tierText = this.scene.add.text(
      CARD_WIDTH / 2,
      58,
      `TIER ${line.pickaxe.tier}`,
      makeGameTextStyle({
        family: "display",
        color: line.locked ? "#766b60" : "#ffe28a",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    tierText.setOrigin(0.5, 0);

    const art = this.createPickaxeArt(CARD_WIDTH / 2, 147, line.pickaxe.id, line.locked);

    const powerLabel = this.scene.add.text(
      36,
      222,
      "FORCA",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    const powerValue = this.scene.add.text(
      36,
      240,
      String(line.pickaxe.power),
      makeGameTextStyle({
        family: "display",
        color: line.locked ? "#8d8170" : "#ffe28a",
        fontSize: "20px",
        fontStyle: "800",
        strokeThickness: 3,
        resolution: 6,
      }),
    );

    const priceLabel = this.scene.add.text(
      CARD_WIDTH - 36,
      222,
      "PRECO",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    priceLabel.setOrigin(1, 0);
    const priceValue = this.scene.add.text(
      CARD_WIDTH - 36,
      240,
      String(line.pickaxe.cost),
      makeGameTextStyle({
        family: "display",
        color: line.canBuy ? "#ffe28a" : gameTheme.colors.textSoft,
        fontSize: "20px",
        fontStyle: "800",
        strokeThickness: 3,
        resolution: 6,
      }),
    );
    priceValue.setOrigin(1, 0);

    const action = getActionLabel(line);
    const actionBody = this.scene.add.rectangle(CARD_WIDTH / 2, 292, 160, 34, getActionFill(line), line.locked ? 0.38 : 1);
    actionBody.setStrokeStyle(2, getActionStroke(line), line.locked ? 0.35 : 0.86);
    const actionText = this.scene.add.text(
      CARD_WIDTH / 2,
      282,
      action,
      makeGameTextStyle({
        family: "display",
        color: line.canBuy || line.owned ? gameTheme.colors.textDark : "#b9aa91",
        fontSize: "13px",
        fontStyle: "800",
        resolution: 6,
      }),
    );
    actionText.setOrigin(0.5, 0);

    if (line.canBuy || (line.owned && !line.equipped)) {
      actionBody.setInteractive({ useHandCursor: true });
      actionBody.on("pointerup", () => {
        if (line.owned) {
          snapshot.onEquip(line.pickaxe.id);
          return;
        }

        snapshot.onBuy(line.pickaxe.id);
      });
    }

    return this.scene.add.container(x, y, [
      body,
      title,
      tierText,
      ...art,
      powerLabel,
      powerValue,
      priceLabel,
      priceValue,
      actionBody,
      actionText,
    ]);
  }

  private createPickaxeArt(x: number, y: number, id: PickaxeId, locked: boolean) {
    const colors = getPickaxeColors(id, locked);
    const alpha = locked ? 0.46 : 1;
    const glow = this.scene.add.circle(x, y, 54, colors.glow, locked ? 0.05 : 0.18);
    const shadow = this.scene.add.ellipse(x + 2, y + 46, 116, 18, 0x030508, locked ? 0.12 : 0.22);
    const art = this.scene.add.container(x, y);

    const handle = this.scene.add.rectangle(-6, 16, colors.handleWidth, colors.handleLength, colors.handle, alpha);
    handle.setAngle(colors.handleAngle);
    handle.setStrokeStyle(1, 0x120d09, locked ? 0.28 : 0.58);

    const grip = this.scene.add.rectangle(
      colors.gripX,
      colors.gripY,
      colors.gripWidth,
      colors.gripHeight,
      colors.grip,
      alpha,
    );
    grip.setAngle(colors.handleAngle);

    const head = this.scene.add.polygon(0, 0, colors.headPoints, colors.head, alpha);
    head.setStrokeStyle(2, colors.stroke, locked ? 0.32 : 0.78);

    const edge = this.scene.add.polygon(0, 0, colors.edgePoints, colors.edge, alpha);
    const gem = this.scene.add.polygon(0, 0, colors.gemPoints, colors.gem, locked ? 0.28 : 0.88);
    gem.setStrokeStyle(2, colors.stroke, locked ? 0.2 : 0.62);

    art.add([handle, grip, head, edge, gem]);
    art.setScale(colors.scale);

    return [glow, shadow, art];
  }

  private getLastPage(snapshot: OverlaySnapshot) {
    return Math.max(0, Math.ceil(snapshot.pickaxes.length / CARDS_PER_PAGE) - 1);
  }

  private setArrowEnabled(kind: "previous" | "next", enabled: boolean) {
    const body = kind === "previous" ? this.previousButtonBody : this.nextButtonBody;
    const button = kind === "previous" ? this.previousButton : this.nextButton;
    body.disableInteractive();

    if (enabled) {
      body.setInteractive({ useHandCursor: true });
    }

    button.setAlpha(enabled ? 1 : 0.38);
  }

  private setArrowState(kind: "previous" | "next", hovered: boolean) {
    const body = kind === "previous" ? this.previousButtonBody : this.nextButtonBody;
    body.setFillStyle(hovered ? 0x31465f : gameTheme.colors.panelRaised, 1);
  }

  private setCloseButtonState(hovered: boolean) {
    this.closeButtonBody.setFillStyle(hovered ? 0x31465f : gameTheme.colors.panelRaised, 1);
    this.closeButton.setScale(hovered ? 1.02 : 1);
  }
}

function getActionLabel(line: PickaxeShopLine) {
  if (line.equipped) {
    return "EQUIPADA";
  }

  if (line.owned) {
    return "EQUIPAR";
  }

  if (line.locked) {
    return `${line.pickaxe.unlockDepth}m`;
  }

  return line.canBuy ? "COMPRAR" : "SEM MOEDAS";
}

function getActionFill(line: PickaxeShopLine) {
  if (line.equipped) {
    return gameTheme.colors.accent;
  }

  if (line.owned || line.canBuy) {
    return gameTheme.colors.success;
  }

  return gameTheme.colors.panelRaised;
}

function getActionStroke(line: PickaxeShopLine) {
  if (line.equipped) {
    return 0x6f531c;
  }

  if (line.owned || line.canBuy) {
    return 0x2f6942;
  }

  return gameTheme.colors.borderSoft;
}

function getPickaxeColors(id: PickaxeId, locked: boolean) {
  if (locked) {
    return {
      handle: 0x3a332d,
      grip: 0x27211d,
      head: 0x5d5852,
      edge: 0x79716a,
      gem: 0x5f5750,
      glow: 0x5b5248,
      stroke: 0x2a241f,
      handleWidth: 12,
      handleLength: 100,
      handleAngle: 34,
      gripX: -24,
      gripY: 54,
      gripWidth: 16,
      gripHeight: 24,
      scale: 1,
      headPoints: [-54, -38, -12, -54, 54, -42, 46, -24, -5, -26, -18, -8, -36, -8, -24, -28],
      edgePoints: [42, -48, 74, -42, 56, -25, 38, -28],
      gemPoints: [-6, -28, 8, -31, 17, -20, 6, -9, -9, -14],
    };
  }

  switch (id) {
    case "wood":
      return {
        handle: 0x8b5a2b,
        grip: 0x4b3020,
        head: 0x9a6a3b,
        edge: 0xc08a4d,
        gem: 0xd8b06a,
        glow: 0xc08a4d,
        stroke: 0x5a351b,
        handleWidth: 12,
        handleLength: 96,
        handleAngle: 32,
        gripX: -24,
        gripY: 54,
        gripWidth: 16,
        gripHeight: 22,
        scale: 0.96,
        headPoints: [-46, -36, -14, -44, 43, -36, 38, -22, -4, -22, -16, -6, -32, -7, -22, -24],
        edgePoints: [36, -42, 58, -37, 45, -24, 32, -26],
        gemPoints: [-6, -26, 7, -28, 15, -19, 5, -10, -8, -13],
      };
    case "stone":
      return {
        handle: 0x7c5631,
        grip: 0x51351f,
        head: 0x87909a,
        edge: 0xb6c0c8,
        gem: 0xcfd9e2,
        glow: 0x87909a,
        stroke: 0x4c5662,
        handleWidth: 11,
        handleLength: 102,
        handleAngle: 34,
        gripX: -25,
        gripY: 55,
        gripWidth: 18,
        gripHeight: 24,
        scale: 1,
        headPoints: [-56, -36, -17, -50, 51, -39, 63, -28, 48, -15, 1, -22, -14, -2, -34, -5, -23, -24],
        edgePoints: [48, -42, 74, -31, 52, -17, 37, -24],
        gemPoints: [-7, -27, 8, -31, 18, -19, 5, -7, -10, -13],
      };
    case "copper":
      return {
        handle: 0x79502c,
        grip: 0x4b2d1c,
        head: 0xc8753f,
        edge: 0xf0a060,
        gem: 0xffc184,
        glow: 0xc8753f,
        stroke: 0x6d3922,
        handleWidth: 11,
        handleLength: 106,
        handleAngle: 34,
        gripX: -25,
        gripY: 56,
        gripWidth: 20,
        gripHeight: 24,
        scale: 1.02,
        headPoints: [-58, -35, -15, -54, 52, -44, 70, -33, 53, -13, 1, -21, -15, 3, -37, -2, -23, -25],
        edgePoints: [51, -49, 81, -34, 56, -17, 40, -25],
        gemPoints: [-8, -29, 9, -33, 20, -20, 6, -6, -11, -13],
      };
    case "iron":
      return {
        handle: 0x79502c,
        grip: 0x3d2a20,
        head: 0xbfc9d8,
        edge: 0xe6eef6,
        gem: 0xd49a63,
        glow: 0xbfc9d8,
        stroke: 0x5c697a,
        handleWidth: 12,
        handleLength: 112,
        handleAngle: 35,
        gripX: -26,
        gripY: 58,
        gripWidth: 22,
        gripHeight: 26,
        scale: 1.03,
        headPoints: [-64, -34, -18, -58, 55, -46, 75, -33, 55, -10, 2, -19, -17, 6, -40, 1, -24, -25],
        edgePoints: [53, -51, 86, -34, 58, -15, 39, -25],
        gemPoints: [-8, -30, 9, -34, 21, -20, 6, -5, -12, -13],
      };
    case "gold":
      return {
        handle: 0x7c5631,
        grip: 0x4b3020,
        head: 0xf3c55d,
        edge: 0xffe28a,
        gem: 0xfff1aa,
        glow: 0xf3c55d,
        stroke: 0x8f6b20,
        handleWidth: 12,
        handleLength: 114,
        handleAngle: 35,
        gripX: -27,
        gripY: 59,
        gripWidth: 23,
        gripHeight: 26,
        scale: 1.05,
        headPoints: [-66, -33, -20, -59, 56, -48, 80, -32, 57, -8, 4, -18, -17, 9, -43, 3, -25, -25],
        edgePoints: [54, -53, 91, -33, 60, -12, 38, -25],
        gemPoints: [-9, -31, 10, -36, 23, -20, 7, -4, -13, -13],
      };
    case "diamond":
      return {
        handle: 0x60442a,
        grip: 0x2c2d3d,
        head: 0x89dff5,
        edge: 0xc8fbff,
        gem: 0xffffff,
        glow: 0x89dff5,
        stroke: 0x2c7288,
        handleWidth: 12,
        handleLength: 118,
        handleAngle: 36,
        gripX: -28,
        gripY: 60,
        gripWidth: 24,
        gripHeight: 28,
        scale: 1.06,
        headPoints: [-68, -34, -21, -62, 58, -50, 83, -31, 58, -5, 5, -17, -18, 12, -45, 4, -26, -26],
        edgePoints: [56, -56, 96, -32, 61, -10, 37, -25],
        gemPoints: [-12, -32, 11, -38, 27, -20, 7, 0, -16, -12],
      };
    case "obsidian":
      return {
        handle: 0x4c3844,
        grip: 0x241a27,
        head: 0x5b4b78,
        edge: 0xa38bd6,
        gem: 0xe99bff,
        glow: 0xa38bd6,
        stroke: 0x21182e,
        handleWidth: 12,
        handleLength: 122,
        handleAngle: 36,
        gripX: -29,
        gripY: 61,
        gripWidth: 26,
        gripHeight: 28,
        scale: 1.08,
        headPoints: [-70, -31, -23, -66, 59, -54, 88, -34, 61, -3, 8, -18, -19, 15, -48, 3, -25, -28],
        edgePoints: [58, -59, 101, -35, 64, -8, 36, -25],
        gemPoints: [-13, -34, 12, -41, 29, -20, 8, 2, -17, -12],
      };
    case "ancientCrystal":
      return {
        handle: 0x38555c,
        grip: 0x27353b,
        head: 0x7effda,
        edge: 0xe3fff5,
        gem: 0xffef8a,
        glow: 0x7effda,
        stroke: 0x1f8170,
        handleWidth: 12,
        handleLength: 126,
        handleAngle: 37,
        gripX: -30,
        gripY: 62,
        gripWidth: 28,
        gripHeight: 30,
        scale: 1.1,
        headPoints: [-73, -34, -24, -70, 60, -58, 94, -36, 63, 1, 10, -17, -20, 19, -51, 4, -26, -30],
        edgePoints: [59, -64, 108, -37, 66, -6, 34, -25],
        gemPoints: [-14, -36, 13, -44, 32, -20, 9, 5, -19, -12],
      };
  }
}
