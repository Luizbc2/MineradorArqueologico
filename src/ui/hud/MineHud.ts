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

type StatCard = {
  valueText: Phaser.GameObjects.Text;
  detailText: Phaser.GameObjects.Text;
  nodes: Phaser.GameObjects.GameObject[];
};

type MineHudOptions = {
  onPauseToggle?: () => void;
};

export class MineHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly depthStatusText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly energyStatusText: Phaser.GameObjects.Text;
  private readonly energyFill: Phaser.GameObjects.Rectangle;
  private readonly energyGlow: Phaser.GameObjects.Rectangle;
  private readonly pickaxeText: Phaser.GameObjects.Text;
  private readonly cardsText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly comboDetailText: Phaser.GameObjects.Text;
  private readonly comboFill: Phaser.GameObjects.Rectangle;
  private readonly resourceChips: Record<keyof ResourceInventory, ResourceChip>;
  private readonly energyBarX: number;
  private readonly energyBarWidth: number;
  private readonly comboBarWidth: number;

  private lastInfoKey = "";
  private lastEnergyWidth = -1;
  private lastEnergyColor = -1;
  private lastComboWidth = -1;
  private lastComboColor = "";

  constructor(scene: Phaser.Scene, options: MineHudOptions = {}) {
    const viewportWidth = scene.scale.width || scene.cameras.main.width || 980;
    const compactLayout = viewportWidth < 1440;
    const narrowLayout = viewportWidth < 1040;
    const leftX = 16;
    const topY = 16;
    const panelPadding = narrowLayout ? 18 : 22;
    const gap = narrowLayout ? 12 : 14;
    const mainWidth = narrowLayout
      ? Math.max(420, viewportWidth - 24)
      : compactLayout
        ? Math.min(viewportWidth - 32, 688)
        : 724;
    const mainHeight = narrowLayout ? 238 : 226;
    const resourcesWidth = compactLayout ? mainWidth : 392;
    const resourcesHeight = narrowLayout ? 164 : 156;
    const resourcesX = compactLayout ? leftX : viewportWidth - resourcesWidth - 16;
    const resourcesY = compactLayout ? topY + mainHeight + 12 : topY;
    const headerY = topY + 14;
    const depthCardWidth = narrowLayout ? 196 : 212;
    const summaryTopY = topY + 54;
    const focusCardHeight = 84;
    const energySectionX = leftX + panelPadding + depthCardWidth + 16;
    const energySectionWidth = mainWidth - panelPadding * 2 - depthCardWidth - 16;
    const dividerY = summaryTopY + focusCardHeight + 16;
    const statCardsY = dividerY + 14;
    const statCardHeight = 64;
    const statCardWidth = Math.floor((mainWidth - panelPadding * 2 - gap * 2) / 3);
    const chipGap = 12;
    const chipWidth = Math.floor((resourcesWidth - panelPadding * 2 - chipGap) / 2);
    const chipHeight = 40;
    const actionButtonWidth = narrowLayout ? 144 : 152;
    const actionButtonHeight = 40;
    const actionButtonX = leftX + mainWidth - actionButtonWidth - panelPadding;
    const actionButtonY = topY + 14;

    this.energyBarX = energySectionX;
    this.energyBarWidth = energySectionWidth;
    this.comboBarWidth = statCardWidth - 24;

    const mainChrome = createPanelChrome(scene, {
      x: leftX,
      y: topY,
      width: mainWidth,
      height: mainHeight,
      accentColor: gameTheme.colors.accentCool,
      alpha: 0.985,
    });

    const resourcesChrome = createPanelChrome(scene, {
      x: resourcesX,
      y: resourcesY,
      width: resourcesWidth,
      height: resourcesHeight,
      accentColor: gameTheme.colors.accent,
      alpha: 0.985,
    });

    const header = scene.add.text(
      leftX + panelPadding,
      headerY,
      "PAINEL DE BORDO",
      makeGameTextStyle({
        family: "display",
        color: "#dcfff8",
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const headerHint = scene.add.text(
      leftX + panelPadding,
      headerY + 22,
      "Resumo rapido da expedicao",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );

    const depthPlate = scene.add.rectangle(
      leftX + panelPadding,
      summaryTopY,
      depthCardWidth,
      focusCardHeight,
      gameTheme.colors.panelDeep,
      0.96,
    );
    depthPlate.setOrigin(0);
    depthPlate.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.78);

    const depthAccent = scene.add.rectangle(
      leftX + panelPadding + 10,
      summaryTopY + 12,
      4,
      focusCardHeight - 24,
      gameTheme.colors.accentCool,
      0.95,
    );
    depthAccent.setOrigin(0);

    const depthLabel = scene.add.text(
      leftX + panelPadding + 20,
      summaryTopY + 10,
      "PROFUNDIDADE",
      makeGameTextStyle({
        family: "display",
        color: "#b8d8e6",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );

    this.depthText = scene.add.text(
      leftX + panelPadding + 20,
      summaryTopY + 24,
      "0 m",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: narrowLayout ? "34px" : "38px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    this.depthStatusText = scene.add.text(
      leftX + panelPadding + 20,
      summaryTopY + 60,
      "Superficie segura",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "13px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );

    const energyPlate = scene.add.rectangle(
      energySectionX,
      summaryTopY,
      energySectionWidth,
      focusCardHeight,
      gameTheme.colors.panelDeep,
      0.96,
    );
    energyPlate.setOrigin(0);
    energyPlate.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.78);

    const energyAccent = scene.add.rectangle(
      energySectionX + 10,
      summaryTopY + 12,
      4,
      focusCardHeight - 24,
      gameTheme.colors.success,
      0.95,
    );
    energyAccent.setOrigin(0);

    const energyLabel = scene.add.text(
      energySectionX + 20,
      summaryTopY + 10,
      "ENERGIA",
      makeGameTextStyle({
        family: "display",
        color: "#d7fff2",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );

    this.energyText = scene.add.text(
      energySectionX + 20,
      summaryTopY + 22,
      "100%",
      makeGameTextStyle({
        family: "display",
        color: "#effff8",
        fontSize: narrowLayout ? "32px" : "36px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    this.energyStatusText = scene.add.text(
      energySectionX + 140,
      summaryTopY + 34,
      "Reserva estavel",
      makeGameTextStyle({
        color: "#9ce7c5",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );

    const energyTrack = scene.add.rectangle(
      this.energyBarX,
      summaryTopY + 64,
      this.energyBarWidth,
      14,
      gameTheme.colors.panelDeep,
      1,
    );
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.9);

    this.energyFill = scene.add.rectangle(
      this.energyBarX,
      summaryTopY + 64,
      this.energyBarWidth,
      10,
      gameTheme.colors.success,
      1,
    );
    this.energyFill.setOrigin(0, 0.5);

    this.energyGlow = scene.add.rectangle(
      this.energyBarX + this.energyBarWidth - 26,
      summaryTopY + 64,
      26,
      10,
      0xffffff,
      0.12,
    );
    this.energyGlow.setOrigin(0, 0.5);

    const sectionDivider = scene.add.rectangle(
      leftX + panelPadding,
      dividerY,
      mainWidth - panelPadding * 2,
      1,
      gameTheme.colors.borderSoft,
      0.9,
    );
    sectionDivider.setOrigin(0, 0);

    const pickaxeCard = this.createStatCard(scene, {
      x: leftX + panelPadding,
      y: statCardsY,
      width: statCardWidth,
      height: statCardHeight,
      label: "PICARETA",
      accentColor: gameTheme.colors.warning,
      detail: "Ferramenta",
    });
    this.pickaxeText = pickaxeCard.valueText;

    const cardsCard = this.createStatCard(scene, {
      x: leftX + panelPadding + statCardWidth + gap,
      y: statCardsY,
      width: statCardWidth,
      height: statCardHeight,
      label: "CODEX",
      accentColor: gameTheme.colors.accentCool,
      detail: "Coleta atual",
    });
    this.cardsText = cardsCard.valueText;

    const comboCard = this.createStatCard(scene, {
      x: leftX + panelPadding + (statCardWidth + gap) * 2,
      y: statCardsY,
      width: statCardWidth,
      height: statCardHeight,
      label: "COMBO",
      accentColor: gameTheme.colors.accent,
      detail: "Estado atual",
    });
    this.comboText = comboCard.valueText;
    this.comboDetailText = comboCard.detailText;

    const comboTrack = scene.add.rectangle(
      leftX + panelPadding + (statCardWidth + gap) * 2 + 12,
      statCardsY + statCardHeight - 11,
      this.comboBarWidth,
      8,
      gameTheme.colors.panelDeep,
      1,
    );
    comboTrack.setOrigin(0, 0.5);
    comboTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.72);

    this.comboFill = scene.add.rectangle(
      leftX + panelPadding + (statCardWidth + gap) * 2 + 12,
      statCardsY + statCardHeight - 11,
      this.comboBarWidth,
      6,
      gameTheme.colors.accent,
      1,
    );
    this.comboFill.setOrigin(0, 0.5);

    const resourcesTitle = scene.add.text(
      resourcesX + panelPadding,
      resourcesY + 14,
      "MOCHILA DE RECURSOS",
      makeGameTextStyle({
        family: "display",
        color: "#fff0ca",
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const resourcesHint = scene.add.text(
      resourcesX + panelPadding,
      resourcesY + 36,
      "Recursos coletados nesta expedicao",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );

    const actionButton = this.createActionButton(scene, {
      x: actionButtonX,
      y: actionButtonY,
      width: actionButtonWidth,
      height: actionButtonHeight,
      label: "PAUSAR",
      hint: "ESC",
      onTrigger: options.onPauseToggle,
    });

    this.resourceChips = {
      coal: this.createResourceChip(scene, {
        x: resourcesX + panelPadding,
        y: resourcesY + 64,
        width: chipWidth,
        height: chipHeight,
        label: "Carvao",
        color: gameTheme.colors.coal,
      }),
      iron: this.createResourceChip(scene, {
        x: resourcesX + panelPadding + chipWidth + chipGap,
        y: resourcesY + 64,
        width: chipWidth,
        height: chipHeight,
        label: "Ferro",
        color: gameTheme.colors.iron,
      }),
      gold: this.createResourceChip(scene, {
        x: resourcesX + panelPadding,
        y: resourcesY + 64 + chipHeight + 10,
        width: chipWidth,
        height: chipHeight,
        label: "Ouro",
        color: gameTheme.colors.gold,
      }),
      diamond: this.createResourceChip(scene, {
        x: resourcesX + panelPadding + chipWidth + chipGap,
        y: resourcesY + 64 + chipHeight + 10,
        width: chipWidth,
        height: chipHeight,
        label: "Diamante",
        color: gameTheme.colors.diamond,
      }),
    };

    this.container = scene.add.container(0, 0, [
      ...mainChrome,
      ...resourcesChrome,
      header,
      headerHint,
      depthPlate,
      depthAccent,
      depthLabel,
      this.depthText,
      this.depthStatusText,
      energyPlate,
      energyAccent,
      energyLabel,
      this.energyText,
      this.energyStatusText,
      energyTrack,
      this.energyFill,
      this.energyGlow,
      sectionDivider,
      ...pickaxeCard.nodes,
      ...cardsCard.nodes,
      ...comboCard.nodes,
      comboTrack,
      this.comboFill,
      resourcesTitle,
      resourcesHint,
      actionButton,
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
      snapshot.comboLabel,
      snapshot.comboColor,
      snapshot.inventory.coal,
      snapshot.inventory.iron,
      snapshot.inventory.gold,
      snapshot.inventory.diamond,
    ].join("|");

    if (infoKey !== this.lastInfoKey) {
      this.lastInfoKey = infoKey;
      this.depthText.setText(`${snapshot.depth} m`);
      this.depthStatusText.setText(this.getDepthDescriptor(snapshot.depth));
      this.energyText.setText(`${snapshot.energy}%`);
      this.energyStatusText.setText(this.getEnergyDescriptor(snapshot.energy));
      this.energyStatusText.setColor(this.getEnergyTextColor(snapshot.energy));
      this.pickaxeText.setText(`LV ${snapshot.pickaxeLevel}`);
      this.cardsText.setText(`${snapshot.cardsFound} / ${snapshot.cardsTotal}`);
      this.comboText.setText(snapshot.comboCount > 0 ? `x${snapshot.comboCount}` : "x0");
      this.comboText.setColor(snapshot.comboCount > 0 ? snapshot.comboColor : gameTheme.colors.textSoft);
      this.comboDetailText.setText(snapshot.comboCount > 0 ? "Bonus ativo" : "Sem bonus");
      this.resourceChips.coal.valueText.setText(`${snapshot.inventory.coal}`);
      this.resourceChips.iron.valueText.setText(`${snapshot.inventory.iron}`);
      this.resourceChips.gold.valueText.setText(`${snapshot.inventory.gold}`);
      this.resourceChips.diamond.valueText.setText(`${snapshot.inventory.diamond}`);
    }

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const energyWidth = Math.max(18, Math.round(this.energyBarWidth * normalizedEnergy));
    const energyColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;

    if (energyWidth !== this.lastEnergyWidth) {
      this.lastEnergyWidth = energyWidth;
      this.energyFill.width = energyWidth;
      this.energyGlow.x = this.energyBarX + Math.max(10, energyWidth - 24);
      this.energyGlow.visible = energyWidth > 26;
    }

    if (energyColor !== this.lastEnergyColor) {
      this.lastEnergyColor = energyColor;
      this.energyFill.fillColor = energyColor;
    }

    const comboWidth = Math.max(12, Math.round(this.comboBarWidth * Phaser.Math.Clamp(snapshot.comboWindowRatio, 0, 1)));

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
      height: number;
      label: string;
      accentColor: number;
      detail: string;
    },
  ): StatCard {
    const bg = scene.add.rectangle(options.x, options.y, options.width, options.height, gameTheme.colors.panelDeep, 0.98);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    const glow = scene.add.rectangle(options.x + 10, options.y + 6, options.width - 20, 10, options.accentColor, 0.08);
    glow.setOrigin(0);

    const accent = scene.add.rectangle(options.x + 10, options.y + 9, 4, options.height - 18, options.accentColor, 0.95);
    accent.setOrigin(0);

    const label = scene.add.text(
      options.x + 22,
      options.y + 8,
      options.label,
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );

    const valueText = scene.add.text(
      options.x + 22,
      options.y + 24,
      "--",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "24px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const detailText = scene.add.text(
      options.x + 22,
      options.y + options.height - 18,
      options.detail,
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );

    return {
      valueText,
      detailText,
      nodes: [bg, glow, accent, label, valueText, detailText],
    };
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; width: number; height: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, options.width, options.height, gameTheme.colors.panelDeep, 0.96);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    const accent = scene.add.rectangle(options.x + 10, options.y + 9, 4, options.height - 18, options.color, 0.95);
    accent.setOrigin(0);

    const dot = scene.add.circle(options.x + 24, options.y + options.height / 2, 5, options.color, 1);

    const label = scene.add.text(
      options.x + 36,
      options.y + 8,
      options.label,
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "13px",
        fontStyle: "700",
        strokeThickness: 0,
      }),
    );

    const valueText = scene.add.text(
      options.x + options.width - 10,
      options.y + 6,
      "0",
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "22px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    valueText.setOrigin(1, 0);

    return {
      valueText,
      nodes: [bg, accent, dot, label, valueText],
    };
  }

  private createActionButton(
    scene: Phaser.Scene,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      hint: string;
      onTrigger?: () => void;
    },
  ) {
    const buttonX = options.x + options.width / 2;
    const buttonY = options.y + options.height / 2;

    const body = scene.add.rectangle(0, 0, options.width, options.height, gameTheme.colors.panelDeep, 0.98);
    body.setStrokeStyle(1, gameTheme.colors.border, 0.92);

    const glow = scene.add.rectangle(-options.width / 2 + 8, -options.height / 2 + 6, options.width - 16, 10, gameTheme.colors.accentCool, 0.08);
    glow.setOrigin(0);

    const accent = scene.add.rectangle(-options.width / 2 + 10, -options.height / 2 + 9, 4, options.height - 18, gameTheme.colors.accentCool, 0.95);
    accent.setOrigin(0);

    const label = scene.add.text(
      -options.width / 2 + 22,
      -options.height / 2 + 8,
      options.label,
      makeGameTextStyle({
        family: "display",
        color: "#effcff",
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );

    const hint = scene.add.text(
      options.width / 2 - 10,
      -options.height / 2 + 9,
      options.hint,
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 0,
      }),
    );
    hint.setOrigin(1, 0);

    const button = scene.add.container(buttonX, buttonY, [body, glow, accent, label, hint]);
    body.setInteractive({ useHandCursor: true });
    body.on("pointerover", () => {
      body.setFillStyle(gameTheme.colors.panelRaised, 1);
      glow.setAlpha(0.18);
    });
    body.on("pointerout", () => {
      body.setFillStyle(gameTheme.colors.panelDeep, 0.98);
      glow.setAlpha(0.08);
    });
    body.on("pointerdown", () => {
      options.onTrigger?.();
    });

    return button;
  }

  private getDepthDescriptor(depth: number) {
    if (depth <= 4) {
      return "Base segura e rota limpa";
    }

    if (depth <= 40) {
      return "Camada rasa com risco baixo";
    }

    if (depth <= 120) {
      return "Tunel estavel, bons recursos";
    }

    if (depth <= 240) {
      return "Zona funda, cavar com cuidado";
    }

    return "Profundidade extrema";
  }

  private getEnergyDescriptor(energy: number) {
    if (energy > 70) {
      return "Reserva estavel";
    }

    if (energy > 35) {
      return "Atencao ao consumo";
    }

    return "Reserva critica";
  }

  private getEnergyTextColor(energy: number) {
    if (energy > 70) {
      return "#9ce7c5";
    }

    if (energy > 35) {
      return "#ffd788";
    }

    return "#ff9f9f";
  }
}
