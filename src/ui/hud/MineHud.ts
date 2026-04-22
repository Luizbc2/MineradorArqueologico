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
  private readonly energyBarX: number;
  private readonly energyBarWidth = 154;

  private lastInfoKey = "";
  private lastEnergyWidth = -1;
  private lastEnergyColor = -1;
  private lastComboWidth = -1;
  private lastComboColor = "";

  constructor(scene: Phaser.Scene) {
    const viewportWidth = Math.max(scene.scale.width || 0, scene.cameras.main.width || 0, 1280);
    const leftX = 16;
    const topY = 16;
    const mainWidth = 380;
    const mainHeight = 84;
    const resourcesWidth = 262;
    const resourcesX = viewportWidth - resourcesWidth - 16;

    const mainChrome = createPanelChrome(scene, {
      x: leftX,
      y: topY,
      width: mainWidth,
      height: mainHeight,
      accentColor: gameTheme.colors.accentCool,
      alpha: 0.98,
    });

    const resourcesChrome = createPanelChrome(scene, {
      x: resourcesX,
      y: topY,
      width: resourcesWidth,
      height: 60,
      accentColor: gameTheme.colors.accent,
      alpha: 0.98,
    });

    const title = scene.add.text(
      leftX + 16,
      topY + 10,
      "MINERADOR ARQUEOLOGICO",
      makeGameTextStyle({
        family: "display",
        color: "#f4fbff",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const depthLabel = scene.add.text(
      leftX + 16,
      topY + 29,
      "PROFUNDIDADE",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    this.depthText = scene.add.text(
      leftX + 16,
      topY + 46,
      "0m",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "22px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    this.energyBarX = leftX + 144;

    this.energyText = scene.add.text(
      this.energyBarX,
      topY + 12,
      "ENERGIA 100%",
      makeGameTextStyle({
        color: "#d6efec",
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    const energyTrack = scene.add.rectangle(
      this.energyBarX,
      topY + 36,
      this.energyBarWidth,
      12,
      gameTheme.colors.panelDeep,
      1,
    );
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.9);

    this.energyFill = scene.add.rectangle(
      this.energyBarX,
      topY + 36,
      this.energyBarWidth,
      8,
      gameTheme.colors.success,
      1,
    );
    this.energyFill.setOrigin(0, 0.5);

    this.energyGlow = scene.add.rectangle(
      this.energyBarX + this.energyBarWidth - 18,
      topY + 36,
      18,
      8,
      0xffffff,
      0.16,
    );
    this.energyGlow.setOrigin(0, 0.5);

    const pickaxePill = this.createPill(scene, { x: leftX + 144, y: topY + 54, width: 72 });
    const cardsPill = this.createPill(scene, { x: leftX + 224, y: topY + 54, width: 74 });
    const comboPill = this.createPill(scene, { x: leftX + 306, y: topY + 54, width: 58 });

    this.pickaxeText = scene.add.text(
      leftX + 180,
      topY + 65,
      "Lv1",
      makeGameTextStyle({
        family: "display",
        color: "#ffe8ab",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.pickaxeText.setOrigin(0.5, 0.5);

    this.cardsText = scene.add.text(
      leftX + 261,
      topY + 65,
      "0/0",
      makeGameTextStyle({
        family: "display",
        color: "#d6f7ff",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.cardsText.setOrigin(0.5, 0.5);

    this.comboText = scene.add.text(
      leftX + 335,
      topY + 65,
      "x0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.comboText.setOrigin(0.5, 0.5);

    const comboTrack = scene.add.rectangle(
      leftX + 310,
      topY + 78,
      48,
      4,
      gameTheme.colors.panelDeep,
      1,
    );
    comboTrack.setOrigin(0, 0.5);

    this.comboFill = scene.add.rectangle(
      leftX + 310,
      topY + 78,
      48,
      2,
      gameTheme.colors.accent,
      1,
    );
    this.comboFill.setOrigin(0, 0.5);

    const resourceTitle = scene.add.text(
      resourcesX + 16,
      topY + 10,
      "COLETA",
      makeGameTextStyle({
        family: "display",
        color: "#f7f3e6",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    this.resourceChips = {
      coal: this.createResourceChip(scene, { x: resourcesX + 16, y: topY + 30, label: "C", color: gameTheme.colors.coal }),
      iron: this.createResourceChip(scene, { x: resourcesX + 76, y: topY + 30, label: "F", color: gameTheme.colors.iron }),
      gold: this.createResourceChip(scene, { x: resourcesX + 136, y: topY + 30, label: "O", color: gameTheme.colors.gold }),
      diamond: this.createResourceChip(scene, { x: resourcesX + 196, y: topY + 30, label: "D", color: gameTheme.colors.diamond }),
    };

    this.container = scene.add.container(0, 0, [
      ...mainChrome,
      ...resourcesChrome,
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
    this.container.setDepth(3200);
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
      this.resourceChips.coal.valueText.setText(`${snapshot.inventory.coal}`);
      this.resourceChips.iron.valueText.setText(`${snapshot.inventory.iron}`);
      this.resourceChips.gold.valueText.setText(`${snapshot.inventory.gold}`);
      this.resourceChips.diamond.valueText.setText(`${snapshot.inventory.diamond}`);
    }

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const energyWidth = Math.max(10, Math.round(this.energyBarWidth * normalizedEnergy));
    const energyColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;

    if (energyWidth !== this.lastEnergyWidth) {
      this.lastEnergyWidth = energyWidth;
      this.energyFill.width = energyWidth;
      this.energyGlow.x = this.energyBarX + Math.max(8, energyWidth - 16);
      this.energyGlow.visible = energyWidth > 18;
    }

    if (energyColor !== this.lastEnergyColor) {
      this.lastEnergyColor = energyColor;
      this.energyFill.fillColor = energyColor;
    }

    const comboWidth = Math.max(8, Math.round(48 * Phaser.Math.Clamp(snapshot.comboWindowRatio, 0, 1)));

    if (comboWidth !== this.lastComboWidth) {
      this.lastComboWidth = comboWidth;
      this.comboFill.width = comboWidth;
    }

    if (snapshot.comboColor !== this.lastComboColor) {
      this.lastComboColor = snapshot.comboColor;
      this.comboFill.fillColor = Phaser.Display.Color.HexStringToColor(snapshot.comboColor).color;
    }
  }

  destroy() {
    this.container.destroy(true);
  }

  private createPill(scene: Phaser.Scene, options: { x: number; y: number; width: number }) {
    const bg = scene.add.rectangle(options.x, options.y, options.width, 22, gameTheme.colors.panelDeep, 0.92);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.88);

    return [bg];
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, 52, 18, gameTheme.colors.panelDeep, 0.94);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.78);

    const icon = scene.add.circle(options.x + 8, options.y + 9, 3, options.color, 1);

    const prefix = scene.add.text(
      options.x + 14,
      options.y + 3,
      options.label,
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "9px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const valueText = scene.add.text(
      options.x + 25,
      options.y + 3,
      "0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "9px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    return {
      valueText,
      nodes: [bg, icon, prefix, valueText],
    };
  }
}
