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

const PANEL_WIDTH = 640;
const PANEL_HEIGHT = 520;
const ROW_WIDTH = 584;
const ROW_HEIGHT = 36;
const ROW_GAP = 41;
const COLUMN_X = {
  name: 12,
  power: 326,
  price: 414,
  action: 526,
} as const;

export class UpgradeOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly panelRoot: Phaser.GameObjects.Container;
  private readonly listRoot: Phaser.GameObjects.Container;
  private readonly coinsText: Phaser.GameObjects.Text;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Container;
  private readonly closeButtonHitArea: Phaser.GameObjects.Rectangle;
  private readonly closeButtonBody: Phaser.GameObjects.Rectangle;
  private readonly scene: Phaser.Scene;
  private rowRoots: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const viewportWidth = scene.scale.width;
    const viewportHeight = scene.scale.height;
    const panelWidth = PANEL_WIDTH;
    const panelHeight = PANEL_HEIGHT;
    const panelX = (viewportWidth - panelWidth) / 2;
    const panelY = (viewportHeight - panelHeight) / 2 - 4;
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

    const title = scene.add.text(
      centerX,
      panelY + 33,
      "CATALOGO DE PICARETAS",
      makeGameTextStyle({
        family: "display",
        color: "#ffe7b0",
        fontSize: "25px",
        fontStyle: "800",
        strokeThickness: 5,
      }),
    );
    title.setOrigin(0.5);

    this.coinsText = scene.add.text(
      panelX + 30,
      panelY + 62,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#ffe28a",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );

    this.depthText = scene.add.text(
      panelX + panelWidth - 30,
      panelY + 62,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#b8f7fa",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.depthText.setOrigin(1, 0);

    const headerStyle = makeGameTextStyle({
      family: "display",
      color: gameTheme.colors.textSoft,
      fontSize: "12px",
      fontStyle: "800",
      strokeThickness: 2,
      resolution: 6,
    });
    const nameHeader = scene.add.text(panelX + 40, panelY + 94, "PICARETA", headerStyle);
    const powerHeader = scene.add.text(panelX + 28 + COLUMN_X.power, panelY + 94, "FORCA", headerStyle);
    powerHeader.setOrigin(0.5, 0);
    const priceHeader = scene.add.text(panelX + 28 + COLUMN_X.price, panelY + 94, "PRECO", headerStyle);
    priceHeader.setOrigin(0.5, 0);
    const statusHeader = scene.add.text(panelX + 28 + COLUMN_X.action, panelY + 94, "STATUS", headerStyle);
    statusHeader.setOrigin(0.5, 0);

    this.listRoot = scene.add.container(0, 0);

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
      }),
    );
    closeButtonLabel.setOrigin(0.5, 0);
    this.closeButton = scene.add.container(centerX - 75, panelY + 472, [
      this.closeButtonBody,
      closeButtonLabel,
    ]);
    this.closeButtonHitArea = this.closeButtonBody;
    this.closeButtonHitArea.setInteractive({ useHandCursor: true });

    const hint = scene.add.text(
      centerX,
      panelY + 503,
      "Use E ou ESC para sair da oficina",
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
      this.coinsText,
      this.depthText,
      nameHeader,
      powerHeader,
      priceHeader,
      statusHeader,
      this.listRoot,
      this.closeButton,
      hint,
    ]);

    this.container = scene.add.container(0, 0, [scrim, this.panelRoot]);
    this.container.setDepth(2000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    this.closeButtonHitArea.on("pointerover", () => this.setCloseButtonState(true));
    this.closeButtonHitArea.on("pointerout", () => this.setCloseButtonState(false));
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: OverlaySnapshot) {
    this.coinsText.setText(`MOEDAS ${snapshot.coins}`);
    this.depthText.setText(`PROFUNDIDADE ${snapshot.maxDepthReached}m`);
    this.renderRows(snapshot);

    this.closeButtonHitArea.removeAllListeners("pointerup");
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

  private renderRows(snapshot: OverlaySnapshot) {
    for (const row of this.rowRoots) {
      row.destroy(true);
    }

    this.rowRoots = [];

    const panelX = (this.scene.scale.width - PANEL_WIDTH) / 2;
    const startY = (this.scene.scale.height - PANEL_HEIGHT) / 2 + 120;

    snapshot.pickaxes.forEach((line, index) => {
      const y = startY + index * ROW_GAP;
      const row = this.createPickaxeRow(panelX + 28, y, line, snapshot);
      this.applyRowCameraFilter(row);
      this.listRoot.add(row);
      this.rowRoots.push(row);
    });
  }

  private applyRowCameraFilter(row: Phaser.GameObjects.Container) {
    row.cameraFilter = this.listRoot.cameraFilter;

    for (const child of row.list) {
      child.cameraFilter = this.listRoot.cameraFilter;
    }
  }

  private createPickaxeRow(
    x: number,
    y: number,
    line: PickaxeShopLine,
    snapshot: OverlaySnapshot,
  ) {
    const bodyColor = line.equipped
      ? 0x3d3422
      : line.owned
        ? 0x28332a
        : line.locked
          ? 0x171313
          : gameTheme.colors.panelDeep;
    const body = this.scene.add.rectangle(0, 0, ROW_WIDTH, ROW_HEIGHT, bodyColor, 0.96);
    body.setOrigin(0);
    body.setStrokeStyle(1, line.equipped ? gameTheme.colors.accent : gameTheme.colors.borderSoft, 0.8);

    const name = this.scene.add.text(
      COLUMN_X.name,
      8,
      line.pickaxe.name,
      makeGameTextStyle({
        family: "display",
        color: line.locked ? "#7f7468" : gameTheme.colors.text,
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );

    const power = this.scene.add.text(
      COLUMN_X.power,
      8,
      String(line.pickaxe.power),
      makeGameTextStyle({
        family: "display",
        color: line.locked ? "#7f7468" : "#ffe28a",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    power.setOrigin(0.5, 0);

    const price = this.scene.add.text(
      COLUMN_X.price,
      8,
      String(line.pickaxe.cost),
      makeGameTextStyle({
        family: "display",
        color: line.canBuy ? "#ffe28a" : gameTheme.colors.textSoft,
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 2,
        resolution: 6,
      }),
    );
    price.setOrigin(0.5, 0);

    const action = getActionLabel(line);
    const actionBody = this.scene.add.rectangle(COLUMN_X.action, 18, 108, 26, getActionFill(line), line.locked ? 0.38 : 1);
    actionBody.setStrokeStyle(1, getActionStroke(line), line.locked ? 0.35 : 0.8);
    const actionText = this.scene.add.text(
      COLUMN_X.action,
      11,
      action,
      makeGameTextStyle({
        family: "display",
        color: line.canBuy || line.owned ? gameTheme.colors.textDark : "#b9aa91",
        fontSize: "12px",
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
      name,
      power,
      price,
      actionBody,
      actionText,
    ]);
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
