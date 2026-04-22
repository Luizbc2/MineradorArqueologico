import Phaser from "phaser";
import { VIEWPORT_WIDTH } from "../../game/world/constants";
import type { ResourceInventory } from "../../game/inventory/resourceInventory";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type HudSnapshot = {
  depth: number;
  energy: number;
  pickaxeLevel: number;
  cardsFound: number;
  cardsTotal: number;
  comboCount: number;
  comboWindowRatio: number;
  comboLabel: string;
  comboColor: string;
  inventory: ResourceInventory;
};

type ResourceChip = {
  bg: Phaser.GameObjects.Rectangle;
  valueText: Phaser.GameObjects.Text;
  nodes: Phaser.GameObjects.GameObject[];
};

export class MineHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly pickaxeText: Phaser.GameObjects.Text;
  private readonly cardsText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly energyFill: Phaser.GameObjects.Rectangle;
  private readonly energyGlow: Phaser.GameObjects.Rectangle;
  private readonly comboFill: Phaser.GameObjects.Rectangle;
  private readonly resourceChips: Record<keyof ResourceInventory, ResourceChip>;
  private readonly energyBaseX: number;
  private readonly comboBaseX: number;

  private lastInfoKey = "";
  private lastEnergyWidth = -1;
  private lastEnergyColor = -1;
  private lastComboWidth = -1;
  private lastComboColor = "";

  constructor(scene: Phaser.Scene) {
    const panelX = 12;
    const panelY = 12;
    const panelWidth = VIEWPORT_WIDTH - 24;
    const panelHeight = 66;

    const chrome = createPanelChrome(scene, {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      accentColor: gameTheme.colors.accentCool,
      alpha: 0.95,
    });

    const title = scene.add.text(
      panelX + 14,
      panelY + 8,
      "MINERADOR",
      makeGameTextStyle({
        family: "display",
        color: "#f7f3e6",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    const depthLabel = scene.add.text(
      panelX + 16,
      panelY + 29,
      "PROFUNDIDADE",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.depthText = scene.add.text(
      panelX + 16,
      panelY + 42,
      "0m",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "22px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );

    this.energyBaseX = panelX + 128;

    this.energyText = scene.add.text(
      this.energyBaseX,
      panelY + 14,
      "ENERGIA 100%",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const energyTrack = scene.add.rectangle(
      this.energyBaseX,
      panelY + 40,
      142,
      12,
      gameTheme.colors.panelDeep,
      1,
    );
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.9);

    this.energyFill = scene.add.rectangle(
      this.energyBaseX,
      panelY + 40,
      142,
      8,
      gameTheme.colors.success,
      1,
    );
    this.energyFill.setOrigin(0, 0.5);

    this.energyGlow = scene.add.rectangle(
      this.energyBaseX + 112,
      panelY + 40,
      18,
      8,
      0xffffff,
      0.16,
    );
    this.energyGlow.setOrigin(0, 0.5);

    const pickaxePill = this.createInfoPill(scene, {
      x: panelX + 274,
      y: panelY + 29,
      width: 50,
    });
    const cardsPill = this.createInfoPill(scene, {
      x: panelX + 332,
      y: panelY + 29,
      width: 66,
    });
    const comboPill = this.createInfoPill(scene, {
      x: panelX + 406,
      y: panelY + 29,
      width: 50,
    });

    this.pickaxeText = scene.add.text(
      panelX + 299,
      panelY + 40,
      "Lv1",
      makeGameTextStyle({
        family: "display",
        color: "#ffe2a3",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
        align: "center",
      }),
    );
    this.pickaxeText.setOrigin(0.5, 0.5);

    this.cardsText = scene.add.text(
      panelX + 365,
      panelY + 40,
      "0/0",
      makeGameTextStyle({
        family: "display",
        color: "#d7f8ff",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
        align: "center",
      }),
    );
    this.cardsText.setOrigin(0.5, 0.5);

    this.comboText = scene.add.text(
      panelX + 431,
      panelY + 40,
      "x0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
        align: "center",
      }),
    );
    this.comboText.setOrigin(0.5, 0.5);

    const comboTrack = scene.add.rectangle(
      panelX + 406,
      panelY + 55,
      50,
      5,
      gameTheme.colors.panelDeep,
      1,
    );
    comboTrack.setOrigin(0, 0.5);

    this.comboBaseX = panelX + 406;
    this.comboFill = scene.add.rectangle(
      this.comboBaseX,
      panelY + 55,
      50,
      3,
      gameTheme.colors.accent,
      1,
    );
    this.comboFill.setOrigin(0, 0.5);

    this.resourceChips = {
      coal: this.createResourceChip(scene, {
        x: panelX + 472,
        y: panelY + 20,
        label: "C",
        color: gameTheme.colors.coal,
      }),
      iron: this.createResourceChip(scene, {
        x: panelX + 508,
        y: panelY + 20,
        label: "F",
        color: gameTheme.colors.iron,
      }),
      gold: this.createResourceChip(scene, {
        x: panelX + 544,
        y: panelY + 20,
        label: "O",
        color: gameTheme.colors.gold,
      }),
      diamond: this.createResourceChip(scene, {
        x: panelX + 580,
        y: panelY + 20,
        label: "D",
        color: gameTheme.colors.diamond,
      }),
    };

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      depthLabel,
      this.depthText,
      this.energyText,
      energyTrack,
      this.energyFill,
      this.energyGlow,
      ...pickaxePill,
      ...cardsPill,
      ...comboPill,
      this.pickaxeText,
      this.cardsText,
      this.comboText,
      comboTrack,
      this.comboFill,
      ...this.resourceChips.coal.nodes,
      ...this.resourceChips.iron.nodes,
      ...this.resourceChips.gold.nodes,
      ...this.resourceChips.diamond.nodes,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1020);
  }

  update(snapshot: HudSnapshot) {
    const infoKey = [
      snapshot.depth,
      snapshot.energy,
      snapshot.pickaxeLevel,
      snapshot.cardsFound,
      snapshot.cardsTotal,
      snapshot.comboCount,
      snapshot.comboColor,
      snapshot.inventory.coal,
      snapshot.inventory.iron,
      snapshot.inventory.gold,
      snapshot.inventory.diamond,
    ].join("|");

    if (infoKey !== this.lastInfoKey) {
      this.lastInfoKey = infoKey;
      this.depthText.setText(`${snapshot.depth}m`);
      this.energyText.setText(`ENERGIA ${snapshot.energy}%`);
      this.pickaxeText.setText(`Lv${snapshot.pickaxeLevel}`);
      this.cardsText.setText(`${snapshot.cardsFound}/${snapshot.cardsTotal}`);
      this.comboText.setText(snapshot.comboCount > 0 ? `x${snapshot.comboCount}` : "x0");
      this.comboText.setColor(snapshot.comboCount > 0 ? snapshot.comboColor : gameTheme.colors.textSoft);

      this.syncResourceChip(this.resourceChips.coal, "C", snapshot.inventory.coal);
      this.syncResourceChip(this.resourceChips.iron, "F", snapshot.inventory.iron);
      this.syncResourceChip(this.resourceChips.gold, "O", snapshot.inventory.gold);
      this.syncResourceChip(this.resourceChips.diamond, "D", snapshot.inventory.diamond);
    }

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const energyWidth = Math.max(12, Math.round(142 * normalizedEnergy));
    const energyColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;

    if (energyWidth !== this.lastEnergyWidth) {
      this.lastEnergyWidth = energyWidth;
      this.energyFill.width = energyWidth;
      this.energyGlow.x = this.energyBaseX + Math.max(6, energyWidth - 18);
      this.energyGlow.visible = energyWidth > 18;
    }

    if (energyColor !== this.lastEnergyColor) {
      this.lastEnergyColor = energyColor;
      this.energyFill.fillColor = energyColor;
    }

    const comboWidth = Math.max(8, Math.round(50 * Phaser.Math.Clamp(snapshot.comboWindowRatio, 0, 1)));

    if (comboWidth !== this.lastComboWidth) {
      this.lastComboWidth = comboWidth;
      this.comboFill.width = comboWidth;
    }

    if (snapshot.comboColor !== this.lastComboColor) {
      this.lastComboColor = snapshot.comboColor;
      this.comboFill.fillColor = Phaser.Display.Color.HexStringToColor(snapshot.comboColor).color;
    }
  }

  private syncResourceChip(chip: ResourceChip, label: string, value: number) {
    chip.valueText.setText(`${label}${value}`);
    chip.bg.setAlpha(value > 0 ? 0.98 : 0.76);
  }

  private createInfoPill(
    scene: Phaser.Scene,
    options: { x: number; y: number; width: number },
  ) {
    const bg = scene.add.rectangle(options.x, options.y, options.width, 22, gameTheme.colors.panelDeep, 0.94);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    return [bg];
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, 32, 18, gameTheme.colors.panelDeep, 0.82);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.75);

    const icon = scene.add.circle(options.x + 7, options.y + 9, 3, options.color, 1);

    const valueText = scene.add.text(
      options.x + 13,
      options.y + 3,
      `${options.label}0`,
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "9px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );

    return {
      bg,
      valueText,
      nodes: [bg, icon, valueText],
    };
  }
}
