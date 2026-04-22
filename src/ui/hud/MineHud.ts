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
  valueText: Phaser.GameObjects.Text;
  nodes: Phaser.GameObjects.GameObject[];
};

export class MineHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly energyFill: Phaser.GameObjects.Rectangle;
  private readonly energyGlow: Phaser.GameObjects.Rectangle;
  private readonly pickaxeText: Phaser.GameObjects.Text;
  private readonly cardsText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly comboFill: Phaser.GameObjects.Rectangle;
  private readonly resourceChips: Record<keyof ResourceInventory, ResourceChip>;

  private readonly energyBarX = 108;
  private readonly comboBarX = 272;
  private lastInfoKey = "";
  private lastEnergyWidth = -1;
  private lastEnergyColor = -1;
  private lastComboWidth = -1;
  private lastComboColor = "";

  constructor(scene: Phaser.Scene) {
    const viewportWidth = scene.scale.width;
    const mainX = 18;
    const mainY = 18;
    const mainWidth = 336;
    const mainHeight = 62;
    const resourceWidth = 176;
    const resourceX = viewportWidth - resourceWidth - 18;
    const resourceY = 18;

    const mainChrome = createPanelChrome(scene, {
      x: mainX,
      y: mainY,
      width: mainWidth,
      height: mainHeight,
      accentColor: gameTheme.colors.accentCool,
      alpha: 0.95,
    });

    const resourceChrome = createPanelChrome(scene, {
      x: resourceX,
      y: resourceY,
      width: resourceWidth,
      height: 40,
      accentColor: gameTheme.colors.accent,
      alpha: 0.95,
    });

    const title = scene.add.text(
      mainX + 14,
      mainY + 8,
      "MINERADOR",
      makeGameTextStyle({
        family: "display",
        color: "#f7f3e6",
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    const depthLabel = scene.add.text(
      mainX + 14,
      mainY + 28,
      "PROF.",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.depthText = scene.add.text(
      mainX + 14,
      mainY + 42,
      "0m",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "26px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );

    this.energyText = scene.add.text(
      mainX + this.energyBarX,
      mainY + 10,
      "ENERGIA 100%",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const energyTrack = scene.add.rectangle(
      mainX + this.energyBarX,
      mainY + 32,
      210,
      12,
      gameTheme.colors.panelDeep,
      1,
    );
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.9);

    this.energyFill = scene.add.rectangle(
      mainX + this.energyBarX,
      mainY + 32,
      210,
      8,
      gameTheme.colors.success,
      1,
    );
    this.energyFill.setOrigin(0, 0.5);

    this.energyGlow = scene.add.rectangle(
      mainX + this.energyBarX + 166,
      mainY + 32,
      18,
      8,
      0xffffff,
      0.16,
    );
    this.energyGlow.setOrigin(0, 0.5);

    const pickaxePill = this.createPill(scene, { x: mainX + 108, y: mainY + 44, width: 62 });
    const cardsPill = this.createPill(scene, { x: mainX + 178, y: mainY + 44, width: 74 });
    const comboPill = this.createPill(scene, { x: mainX + 260, y: mainY + 44, width: 76 });

    this.pickaxeText = scene.add.text(
      mainX + 139,
      mainY + 55,
      "Lv1",
      makeGameTextStyle({
        family: "display",
        color: "#ffe2a3",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.pickaxeText.setOrigin(0.5, 0.5);

    this.cardsText = scene.add.text(
      mainX + 215,
      mainY + 55,
      "0/0",
      makeGameTextStyle({
        family: "display",
        color: "#d7f8ff",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.cardsText.setOrigin(0.5, 0.5);

    this.comboText = scene.add.text(
      mainX + 298,
      mainY + 55,
      "x0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.comboText.setOrigin(0.5, 0.5);

    const comboTrack = scene.add.rectangle(
      mainX + this.comboBarX,
      mainY + 64,
      52,
      4,
      gameTheme.colors.panelDeep,
      1,
    );
    comboTrack.setOrigin(0, 0.5);

    this.comboFill = scene.add.rectangle(
      mainX + this.comboBarX,
      mainY + 64,
      52,
      2,
      gameTheme.colors.accent,
      1,
    );
    this.comboFill.setOrigin(0, 0.5);

    const resourceTitle = scene.add.text(
      resourceX + 14,
      resourceY + 9,
      "COLETA",
      makeGameTextStyle({
        family: "display",
        color: "#f7f3e6",
        fontSize: "13px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    this.resourceChips = {
      coal: this.createResourceChip(scene, { x: resourceX + 14, y: resourceY + 22, label: "C", color: gameTheme.colors.coal }),
      iron: this.createResourceChip(scene, { x: resourceX + 54, y: resourceY + 22, label: "F", color: gameTheme.colors.iron }),
      gold: this.createResourceChip(scene, { x: resourceX + 94, y: resourceY + 22, label: "O", color: gameTheme.colors.gold }),
      diamond: this.createResourceChip(scene, { x: resourceX + 134, y: resourceY + 22, label: "D", color: gameTheme.colors.diamond }),
    };

    this.container = scene.add.container(0, 0, [
      ...mainChrome,
      ...resourceChrome,
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
      resourceTitle,
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
      this.resourceChips.coal.valueText.setText(`C${snapshot.inventory.coal}`);
      this.resourceChips.iron.valueText.setText(`F${snapshot.inventory.iron}`);
      this.resourceChips.gold.valueText.setText(`O${snapshot.inventory.gold}`);
      this.resourceChips.diamond.valueText.setText(`D${snapshot.inventory.diamond}`);
    }

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const energyWidth = Math.max(12, Math.round(210 * normalizedEnergy));
    const energyColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;

    if (energyWidth !== this.lastEnergyWidth) {
      this.lastEnergyWidth = energyWidth;
      this.energyFill.width = energyWidth;
      this.energyGlow.x = 18 + this.energyBarX + Math.max(6, energyWidth - 18);
      this.energyGlow.visible = energyWidth > 18;
    }

    if (energyColor !== this.lastEnergyColor) {
      this.lastEnergyColor = energyColor;
      this.energyFill.fillColor = energyColor;
    }

    const comboWidth = Math.max(8, Math.round(52 * Phaser.Math.Clamp(snapshot.comboWindowRatio, 0, 1)));

    if (comboWidth !== this.lastComboWidth) {
      this.lastComboWidth = comboWidth;
      this.comboFill.width = comboWidth;
    }

    if (snapshot.comboColor !== this.lastComboColor) {
      this.lastComboColor = snapshot.comboColor;
      this.comboFill.fillColor = Phaser.Display.Color.HexStringToColor(snapshot.comboColor).color;
    }
  }

  private createPill(scene: Phaser.Scene, options: { x: number; y: number; width: number }) {
    const bg = scene.add.rectangle(options.x, options.y, options.width, 22, gameTheme.colors.panelDeep, 0.94);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    return [bg];
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, 32, 18, gameTheme.colors.panelDeep, 0.84);
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
      valueText,
      nodes: [bg, icon, valueText],
    };
  }
}
