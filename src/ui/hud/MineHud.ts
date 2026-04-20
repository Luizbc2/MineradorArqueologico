import Phaser from "phaser";
import type { ResourceInventory } from "../../game/inventory/resourceInventory";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type HudSnapshot = {
  depth: number;
  energy: number;
  pickaxeLevel: number;
  cardsFound: number;
  cardsTotal: number;
  inventory: ResourceInventory;
};

type ResourceChip = {
  nodes: Phaser.GameObjects.GameObject[];
  glow: Phaser.GameObjects.Arc;
  valueText: Phaser.GameObjects.Text;
};

export class MineHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly energyFill: Phaser.GameObjects.Rectangle;
  private readonly energyShine: Phaser.GameObjects.Rectangle;
  private readonly depthText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly pickaxeText: Phaser.GameObjects.Text;
  private readonly cardsText: Phaser.GameObjects.Text;
  private readonly resourceChips: Record<keyof ResourceInventory, ResourceChip>;

  constructor(scene: Phaser.Scene) {
    const chrome = createPanelChrome(scene, {
      x: 14,
      y: 14,
      width: 486,
      height: 154,
      accentColor: gameTheme.colors.accentCool,
    });

    const title = scene.add.text(
      30,
      22,
      "MINERADOR ARQUEOLOGICO",
      makeGameTextStyle({
        family: "display",
        color: "#f5f0e6",
        fontSize: "23px",
        fontStyle: "800",
        strokeThickness: 5,
      }),
    );

    const subtitle = scene.add.text(
      31,
      46,
      "Subsolo vivo, loot raro e descobertas antigas",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "15px",
        fontStyle: "600",
        strokeThickness: 2,
      }),
    );

    const depthPanel = scene.add.rectangle(28, 74, 138, 54, gameTheme.colors.panelDeep, 0.98);
    depthPanel.setOrigin(0);
    depthPanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.95);

    const depthLabel = scene.add.text(
      42,
      81,
      "PROFUNDIDADE",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "13px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.depthText = scene.add.text(
      42,
      96,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#f9fafc",
        fontSize: "28px",
        fontStyle: "800",
        strokeThickness: 5,
      }),
    );

    const energyPanel = scene.add.rectangle(182, 74, 210, 54, gameTheme.colors.panelDeep, 0.98);
    energyPanel.setOrigin(0);
    energyPanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.95);

    this.energyText = scene.add.text(
      198,
      81,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "13px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const energyTrack = scene.add.rectangle(198, 110, 178, 14, gameTheme.colors.panel, 1);
    energyTrack.setOrigin(0, 0.5);
    energyTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.95);

    this.energyFill = scene.add.rectangle(198, 110, 178, 10, gameTheme.colors.success, 1);
    this.energyFill.setOrigin(0, 0.5);

    this.energyShine = scene.add.rectangle(216, 110, 28, 10, 0xffffff, 0.18);
    this.energyShine.setOrigin(0, 0.5);

    const pickaxePanel = scene.add.rectangle(408, 74, 78, 54, gameTheme.colors.panelDeep, 0.98);
    pickaxePanel.setOrigin(0);
    pickaxePanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.95);

    const pickaxeLabel = scene.add.text(
      422,
      81,
      "PICARETA",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.pickaxeText = scene.add.text(
      422,
      100,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#ffe7b0",
        fontSize: "24px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );

    const codexPill = scene.add.rectangle(28, 136, 174, 20, gameTheme.colors.panelDeep, 0.92);
    codexPill.setOrigin(0);
    codexPill.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.85);

    this.cardsText = scene.add.text(
      42,
      138,
      "",
      makeGameTextStyle({
        color: "#ffe3a1",
        fontSize: "15px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const inventoryHeading = scene.add.text(
      222,
      138,
      "COLETA",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "13px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.resourceChips = {
      coal: this.createResourceChip(scene, {
        x: 276,
        y: 136,
        label: "C",
        color: gameTheme.colors.coal,
      }),
      iron: this.createResourceChip(scene, {
        x: 331,
        y: 136,
        label: "F",
        color: gameTheme.colors.iron,
      }),
      gold: this.createResourceChip(scene, {
        x: 386,
        y: 136,
        label: "O",
        color: gameTheme.colors.gold,
      }),
      diamond: this.createResourceChip(scene, {
        x: 441,
        y: 136,
        label: "D",
        color: gameTheme.colors.diamond,
      }),
    };

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      subtitle,
      depthPanel,
      depthLabel,
      this.depthText,
      energyPanel,
      this.energyText,
      energyTrack,
      this.energyFill,
      this.energyShine,
      pickaxePanel,
      pickaxeLabel,
      this.pickaxeText,
      codexPill,
      this.cardsText,
      inventoryHeading,
      ...this.resourceChips.coal.nodes,
      ...this.resourceChips.iron.nodes,
      ...this.resourceChips.gold.nodes,
      ...this.resourceChips.diamond.nodes,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    scene.tweens.add({
      targets: this.energyShine,
      x: 346,
      duration: 1800,
      repeat: -1,
      ease: "sine.inOut",
      yoyo: true,
    });

    scene.tweens.add({
      targets: Object.values(this.resourceChips).map((chip) => chip.glow),
      alpha: 0.24,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  update(snapshot: HudSnapshot) {
    this.depthText.setText(`${snapshot.depth}m`);
    this.energyText.setText(`ENERGIA ${snapshot.energy}%`);
    this.pickaxeText.setText(`Lv${snapshot.pickaxeLevel}`);
    this.cardsText.setText(`CODEX ${snapshot.cardsFound}/${snapshot.cardsTotal}`);
    this.resourceChips.coal.valueText.setText(`C ${snapshot.inventory.coal}`);
    this.resourceChips.iron.valueText.setText(`F ${snapshot.inventory.iron}`);
    this.resourceChips.gold.valueText.setText(`O ${snapshot.inventory.gold}`);
    this.resourceChips.diamond.valueText.setText(`D ${snapshot.inventory.diamond}`);

    const normalizedEnergy = Phaser.Math.Clamp(snapshot.energy / 100, 0, 1);
    const fillWidth = Math.max(12, 178 * normalizedEnergy);
    this.energyFill.width = fillWidth;
    this.energyFill.fillColor =
      normalizedEnergy > 0.6
        ? gameTheme.colors.success
        : normalizedEnergy > 0.3
          ? gameTheme.colors.warning
          : gameTheme.colors.danger;
    this.energyShine.visible = fillWidth > 26;
    this.energyShine.x = 198 + Math.max(4, fillWidth - 22);
  }

  private createResourceChip(
    scene: Phaser.Scene,
    options: { x: number; y: number; label: string; color: number },
  ): ResourceChip {
    const bg = scene.add.rectangle(options.x, options.y, 46, 20, gameTheme.colors.panelDeep, 0.94);
    bg.setOrigin(0);
    bg.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.8);

    const glow = scene.add.circle(options.x + 10, options.y + 10, 7, options.color, 0.12);
    const icon = scene.add.circle(options.x + 10, options.y + 10, 4, options.color, 1);

    const valueText = scene.add.text(
      options.x + 20,
      options.y + 1,
      `${options.label} 0`,
      makeGameTextStyle({
        family: "display",
        color: gameTheme.colors.text,
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );

    return {
      nodes: [bg, glow, icon, valueText],
      glow,
      valueText,
    };
  }
}
