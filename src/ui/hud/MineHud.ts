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
  private readonly energyBarWidth: number;
  private readonly comboBarWidth = 74;

  private lastInfoKey = "";
  private lastEnergyWidth = -1;
  private lastEnergyColor = -1;
  private lastComboWidth = -1;
  private lastComboColor = "";

  constructor(scene: Phaser.Scene) {
    const viewportWidth = Math.max(scene.scale.width || 0, scene.cameras.main.width || 0, 960);
    const compactLayout = viewportWidth < 1180;
    const leftX = 16;
    const topY = 16;
    const mainWidth = compactLayout ? Math.min(viewportWidth - 32, 452) : 448;
    const mainHeight = 118;
    const resourcesWidth = compactLayout ? mainWidth : 316;
    const resourcesHeight = 90;
    const resourcesX = compactLayout ? leftX : viewportWidth - resourcesWidth - 16;
    const resourcesY = compactLayout ? topY + mainHeight + 10 : topY;
    const energySectionX = leftX + 156;
    const statsY = topY + 80;
    const statWidth = 86;

    this.energyBarX = energySectionX;
    this.energyBarWidth = mainWidth - (energySectionX - leftX) - 22;

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
      y: resourcesY,
      width: resourcesWidth,
      height: resourcesHeight,
      accentColor: gameTheme.colors.accent,
      alpha: 0.98,
    });

    const eyebrow = scene.add.text(
      leftX + 16,
      topY + 10,
      "STATUS DE CAMPO",
      makeGameTextStyle({
        family: "display",
        color: "#d9fff6",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const depthLabel = scene.add.text(
      leftX + 16,
      topY + 32,
      "Profundidade",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
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
        fontSize: "30px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const energyLabel = scene.add.text(
      energySectionX,
      topY + 18,
      "Energia",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    this.energyText = scene.add.text(
      leftX + mainWidth - 18,
      topY + 15,
      "100%",
      makeGameTextStyle({
        family: "display",
        color: "#f2fff7",
        fontSize: "17px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.energyText.setOrigin(1, 0);

    const energyTrack = scene.add.rectangle(
      this.energyBarX,
      topY + 42,
      this.energyBarWidth,
      14,
      gameTheme.colors.panelDeep,
      1,
    );
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.9);

    this.energyFill = scene.add.rectangle(
      this.energyBarX,
      topY + 42,
      this.energyBarWidth,
      10,
      gameTheme.colors.success,
      1,
    );
    this.energyFill.setOrigin(0, 0.5);

    this.energyGlow = scene.add.rectangle(
      this.energyBarX + this.energyBarWidth - 22,
      topY + 42,
      22,
      10,
      0xffffff,
      0.16,
    );
    this.energyGlow.setOrigin(0, 0.5);

    const energyHint = scene.add.text(
      energySectionX,
      topY + 54,
      "Sua reserva de escavacao e retorno",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "10px",
        fontStyle: "600",
        strokeThickness: 1,
      }),
    );

    const pickaxeCard = this.createStatCard(scene, {
      x: leftX + 156,
      y: statsY,
      width: statWidth,
      label: "Picareta",
      accentColor: gameTheme.colors.warning,
    });
    this.pickaxeText = pickaxeCard.valueText;

    const cardsCard = this.createStatCard(scene, {
      x: leftX + 252,
      y: statsY,
      width: statWidth,
      label: "Arquivos",
      accentColor: gameTheme.colors.accentCool,
    });
    this.cardsText = cardsCard.valueText;

    const comboCard = this.createStatCard(scene, {
      x: leftX + 348,
      y: statsY,
      width: 92,
      label: "Combo",
      accentColor: gameTheme.colors.accent,
    });
    this.comboText = comboCard.valueText;

    const comboTrack = scene.add.rectangle(
      leftX + 357,
      topY + 104,
      this.comboBarWidth,
      5,
      gameTheme.colors.panelDeep,
      1,
    );
    comboTrack.setOrigin(0, 0.5);

    this.comboFill = scene.add.rectangle(
      leftX + 357,
      topY + 104,
      this.comboBarWidth,
      3,
      gameTheme.colors.accent,
      1,
    );
    this.comboFill.setOrigin(0, 0.5);

    const resourcesTitle = scene.add.text(
      resourcesX + 16,
      resourcesY + 10,
      "RECURSOS",
      makeGameTextStyle({
        family: "display",
        color: "#fff0ca",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const resourcesHint = scene.add.text(
      resourcesX + resourcesWidth - 16,
      resourcesY + 10,
      "Coleta atual",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );
    resourcesHint.setOrigin(1, 0);

    this.resourceChips = {
      coal: this.createResourceChip(scene, {
        x: resourcesX + 16,
        y: resourcesY + 34,
        width: 136,
        label: "Carvao",
        color: gameTheme.colors.coal,
      }),
      iron: this.createResourceChip(scene, {
        x: resourcesX + 164,
        y: resourcesY + 34,
        width: 136,
        label: "Ferro",
        color: gameTheme.colors.iron,
      }),
      gold: this.createResourceChip(scene, {
        x: resourcesX + 16,
        y: resourcesY + 61,
        width: 136,
        label: "Ouro",
        color: gameTheme.colors.gold,
      }),
      diamond: this.createResourceChip(scene, {
        x: resourcesX + 164,
        y: resourcesY + 61,
        width: 136,
        label: "Diamante",
        color: gameTheme.colors.diamond,
      }),
    };

    this.container = scene.add.container(0, 0, [
      ...mainChrome,
      ...resourcesChrome,
      eyebrow,
      depthLabel,
      this.depthText,
      energyLabel,
      this.energyText,
      energyTrack,
      this.energyFill,
      this.energyGlow,
      energyHint,
      ...pickaxeCard.nodes,
      ...cardsCard.nodes,
      ...comboCard.nodes,
      comboTrack,
      this.comboFill,
      resourcesTitle,
      resourcesHint,
      ...this.resourceChips.coal.nodes,
      ...this.resourceChips.iron.nodes,
      ...this.resourceChips.gold.nodes,
      ...this.resourceChips.diamond.nodes,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(3200);
  }

  getRoot() {
    return this.container;
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
      this.energyText.setText(`${snapshot.energy}%`);
      this.pickaxeText.setText(`Lv ${snapshot.pickaxeLevel}`);
      this.cardsText.setText(`${snapshot.cardsFound}/${snapshot.cardsTotal}`);
      this.comboText.setText(snapshot.comboCount > 0 ? `x${snapshot.comboCount}` : "x0");
      this.comboText.setColor(snapshot.comboCount > 0 ? snapshot.comboColor : gameTheme.colors.textSoft);
      this.resourceChips.coal.valueText.setText(`${snapshot.inventory.coal}`);
      this.resourceChips.iron.valueText.setText(`${snapshot.inventory.iron}`);
      this.resourceChips.gold.valueText.setText(`${snapshot.inventory.gold}`);
      this.resourceChips.diamond.valueText.setText(`${snapshot.inventory.diamond}`);
    }

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const energyWidth = Math.max(12, Math.round(this.energyBarWidth * normalizedEnergy));
    const energyColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;

    if (energyWidth !== this.lastEnergyWidth) {
      this.lastEnergyWidth = energyWidth;
      this.energyFill.width = energyWidth;
      this.energyGlow.x = this.energyBarX + Math.max(8, energyWidth - 20);
      this.energyGlow.visible = energyWidth > 20;
    }

    if (energyColor !== this.lastEnergyColor) {
      this.lastEnergyColor = energyColor;
      this.energyFill.fillColor = energyColor;
    }

    const comboWidth = Math.max(10, Math.round(this.comboBarWidth * Phaser.Math.Clamp(snapshot.comboWindowRatio, 0, 1)));

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

  private createStatCard(
    scene: Phaser.Scene,
    options: {
      x: number;
      y: number;
      width: number;
      label: string;
      accentColor: number;
    },
  ) {
    const bg = scene.add.rectangle(options.x, options.y, options.width, 28, gameTheme.colors.panelDeep, 0.96);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    const accent = scene.add.rectangle(options.x, options.y + 5, 4, 18, options.accentColor, 0.95);
    accent.setOrigin(0);

    const label = scene.add.text(
      options.x + 12,
      options.y + 4,
      options.label,
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "9px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    const valueText = scene.add.text(
      options.x + options.width - 10,
      options.y + 8,
      "0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "13px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    valueText.setOrigin(1, 0);

    return {
      valueText,
      nodes: [bg, accent, label, valueText],
    };
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; width: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, options.width, 22, gameTheme.colors.panelDeep, 0.94);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.78);

    const accent = scene.add.rectangle(options.x, options.y + 4, 3, 14, options.color, 1);
    accent.setOrigin(0);

    const label = scene.add.text(
      options.x + 12,
      options.y + 4,
      options.label,
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    const valueText = scene.add.text(
      options.x + options.width - 8,
      options.y + 3,
      "0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    valueText.setOrigin(1, 0);

    return {
      valueText,
      nodes: [bg, accent, label, valueText],
    };
  }
}
