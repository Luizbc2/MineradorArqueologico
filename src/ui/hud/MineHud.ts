import Phaser from "phaser";
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

  private lastInfoKey = "";
  private lastEnergyWidth = -1;
  private lastEnergyColor = -1;
  private lastComboWidth = -1;
  private lastComboColor = "";

  constructor(scene: Phaser.Scene) {
    const panelX = 14;
    const panelY = 14;
    const panelWidth = 364;
    const panelHeight = 82;

    const chrome = createPanelChrome(scene, {
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      accentColor: gameTheme.colors.accentCool,
      alpha: 0.94,
    });

    const title = scene.add.text(
      panelX + 14,
      panelY + 10,
      "MINERADOR ARQUEOLOGICO",
      makeGameTextStyle({
        family: "display",
        color: "#f7f3e6",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    const subtitle = scene.add.text(
      panelX + 14,
      panelY + 25,
      "run atual",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const depthCaption = scene.add.text(
      panelX + 16,
      panelY + 44,
      "PROF.",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.depthText = scene.add.text(
      panelX + 54,
      panelY + 40,
      "0m",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "24px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );

    this.energyText = scene.add.text(
      panelX + 110,
      panelY + 16,
      "ENERGIA 100%",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const energyTrack = scene.add.rectangle(
      panelX + 110,
      panelY + 43,
      126,
      12,
      gameTheme.colors.panelDeep,
      1,
    );
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.9);

    this.energyFill = scene.add.rectangle(
      panelX + 110,
      panelY + 43,
      126,
      8,
      gameTheme.colors.success,
      1,
    );
    this.energyFill.setOrigin(0, 0.5);

    this.energyGlow = scene.add.rectangle(
      panelX + 214,
      panelY + 43,
      18,
      8,
      0xffffff,
      0.18,
    );
    this.energyGlow.setOrigin(0, 0.5);

    const pickaxePill = scene.add.rectangle(
      panelX + 110,
      panelY + 62,
      64,
      16,
      gameTheme.colors.panelDeep,
      0.94,
    );
    pickaxePill.setOrigin(0);
    pickaxePill.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.8);

    this.pickaxeText = scene.add.text(
      panelX + 117,
      panelY + 62,
      "PICK Lv1",
      makeGameTextStyle({
        family: "display",
        color: "#ffe2a3",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );

    const cardsPill = scene.add.rectangle(
      panelX + 181,
      panelY + 62,
      66,
      16,
      gameTheme.colors.panelDeep,
      0.94,
    );
    cardsPill.setOrigin(0);
    cardsPill.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.8);

    this.cardsText = scene.add.text(
      panelX + 188,
      panelY + 62,
      "CDX 0/0",
      makeGameTextStyle({
        color: "#d7f8ff",
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const comboPill = scene.add.rectangle(
      panelX + 254,
      panelY + 62,
      56,
      16,
      gameTheme.colors.panelDeep,
      0.94,
    );
    comboPill.setOrigin(0);
    comboPill.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.8);

    this.comboText = scene.add.text(
      panelX + 266,
      panelY + 62,
      "x0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );

    const comboTrack = scene.add.rectangle(
      panelX + 254,
      panelY + 48,
      56,
      5,
      gameTheme.colors.panelDeep,
      1,
    );
    comboTrack.setOrigin(0, 0.5);

    this.comboFill = scene.add.rectangle(
      panelX + 254,
      panelY + 48,
      56,
      3,
      gameTheme.colors.accent,
      1,
    );
    this.comboFill.setOrigin(0, 0.5);

    this.resourceChips = {
      coal: this.createResourceChip(scene, {
        x: panelX + 318,
        y: panelY + 18,
        label: "C",
        color: gameTheme.colors.coal,
      }),
      iron: this.createResourceChip(scene, {
        x: panelX + 318,
        y: panelY + 38,
        label: "F",
        color: gameTheme.colors.iron,
      }),
      gold: this.createResourceChip(scene, {
        x: panelX + 318,
        y: panelY + 58,
        label: "O",
        color: gameTheme.colors.gold,
      }),
      diamond: this.createResourceChip(scene, {
        x: panelX + 318,
        y: panelY + 78,
        label: "D",
        color: gameTheme.colors.diamond,
      }),
    };

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      subtitle,
      depthCaption,
      this.depthText,
      this.energyText,
      energyTrack,
      this.energyFill,
      this.energyGlow,
      pickaxePill,
      this.pickaxeText,
      cardsPill,
      this.cardsText,
      comboPill,
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
      this.pickaxeText.setText(`PICK Lv${snapshot.pickaxeLevel}`);
      this.cardsText.setText(`CDX ${snapshot.cardsFound}/${snapshot.cardsTotal}`);
      this.comboText.setText(snapshot.comboCount > 0 ? `x${snapshot.comboCount}` : "x0");
      this.comboText.setColor(snapshot.comboCount > 0 ? snapshot.comboColor : gameTheme.colors.textSoft);

      this.syncResourceChip(this.resourceChips.coal, "C", snapshot.inventory.coal);
      this.syncResourceChip(this.resourceChips.iron, "F", snapshot.inventory.iron);
      this.syncResourceChip(this.resourceChips.gold, "O", snapshot.inventory.gold);
      this.syncResourceChip(this.resourceChips.diamond, "D", snapshot.inventory.diamond);
    }

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const energyWidth = Math.max(10, Math.round(126 * normalizedEnergy));
    const energyColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;

    if (energyWidth !== this.lastEnergyWidth) {
      this.lastEnergyWidth = energyWidth;
      this.energyFill.width = energyWidth;
      this.energyGlow.x = 124 + Math.max(6, energyWidth - 18);
      this.energyGlow.visible = energyWidth > 18;
    }

    if (energyColor !== this.lastEnergyColor) {
      this.lastEnergyColor = energyColor;
      this.energyFill.fillColor = energyColor;
    }

    const comboWidth = Math.max(8, Math.round(56 * Phaser.Math.Clamp(snapshot.comboWindowRatio, 0, 1)));

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
    chip.bg.setAlpha(value > 0 ? 0.98 : 0.78);
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, 42, 16, gameTheme.colors.panelDeep, 0.82);
    bg.setOrigin(0, 1);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.7);

    const icon = scene.add.circle(options.x + 8, options.y - 8, 3, options.color, 1);

    const valueText = scene.add.text(
      options.x + 14,
      options.y - 15,
      `${options.label}0`,
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "10px",
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
