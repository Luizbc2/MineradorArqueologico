import Phaser from "phaser";
import { createPanelChrome, gameTheme, makeGameTextStyle } from "../theme/gameTheme";

type GoalView = {
  title: string;
  description: string;
  rewardLabel: string;
  current: number;
  target: number;
} | null;

export type ExpeditionGoalsSnapshot = {
  rank: number;
  progressLabel: string;
  perkSummary: string;
  activeGoal: GoalView;
  nextGoal: GoalView;
};

export class ExpeditionGoalsPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly rankText: Phaser.GameObjects.Text;
  private readonly progressText: Phaser.GameObjects.Text;
  private readonly activeTitle: Phaser.GameObjects.Text;
  private readonly rewardText: Phaser.GameObjects.Text;
  private readonly progressValueText: Phaser.GameObjects.Text;
  private readonly perkText: Phaser.GameObjects.Text;
  private readonly activeFill: Phaser.GameObjects.Rectangle;
  private readonly progressTrackWidth: number;

  private lastKey = "";
  private lastFillWidth = -1;

  constructor(scene: Phaser.Scene) {
    const viewportWidth = scene.scale.width || scene.cameras.main.width || 348;
    const viewportHeight = scene.scale.height || scene.cameras.main.height || 124;
    const compactLayout = viewportWidth < 960;
    const width = compactLayout ? Math.max(296, viewportWidth - 24) : 348;
    const height = compactLayout ? 132 : 124;
    const x = compactLayout ? 12 : viewportWidth - width - 16;
    const y = viewportHeight - height - (compactLayout ? 12 : 16);

    this.progressTrackWidth = width - 32;

    const chrome = createPanelChrome(scene, {
      x,
      y,
      width,
      height,
      accentColor: gameTheme.colors.accent,
      alpha: 0.975,
    });

    const title = scene.add.text(
      x + 16,
      y + 10,
      "OBJETIVO DA EXPEDICAO",
      makeGameTextStyle({
        family: "display",
        color: "#ffe9b0",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const rankPill = scene.add.rectangle(x + width - 66, y + 12, 50, 22, gameTheme.colors.panelDeep, 0.96);
    rankPill.setOrigin(0, 0);
    rankPill.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    this.rankText = scene.add.text(
      x + width - 41,
      y + 16,
      "R1",
      makeGameTextStyle({
        family: "display",
        color: "#d8fff6",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.rankText.setOrigin(0.5, 0);

    this.progressText = scene.add.text(
      x + 16,
      y + 30,
      "0/0 metas concluidas",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    this.activeTitle = scene.add.text(
      x + 16,
      y + 48,
      "Primeira meta",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 1,
        wordWrapWidth: width - 122,
      }),
    );

    this.progressValueText = scene.add.text(
      x + width - 16,
      y + 48,
      "0/1",
      makeGameTextStyle({
        family: "display",
        color: "#d8fff6",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.progressValueText.setOrigin(1, 0);

    this.rewardText = scene.add.text(
      x + 16,
      y + 70,
      "Recompensa: combo",
      makeGameTextStyle({
        color: "#ffe39b",
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
        wordWrapWidth: width - 32,
      }),
    );

    const progressTrack = scene.add.rectangle(
      x + 16,
      y + 94,
      this.progressTrackWidth,
      8,
      gameTheme.colors.panelDeep,
      1,
    );
    progressTrack.setOrigin(0, 0.5);
    progressTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.6);

    this.activeFill = scene.add.rectangle(
      x + 16,
      y + 94,
      this.progressTrackWidth,
      6,
      gameTheme.colors.accent,
      1,
    );
    this.activeFill.setOrigin(0, 0.5);

    const perkLabel = scene.add.text(
      x + 16,
      y + 103,
      "Perk ativo",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    this.perkText = scene.add.text(
      x + 78,
      y + 103,
      "Sem perks ativos",
      makeGameTextStyle({
        color: "#9bdccf",
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 1,
        wordWrapWidth: width - 94,
      }),
    );

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      rankPill,
      this.rankText,
      this.progressText,
      this.activeTitle,
      this.progressValueText,
      this.rewardText,
      progressTrack,
      this.activeFill,
      perkLabel,
      this.perkText,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1030);
  }

  getRoot() {
    return this.container;
  }

  update(snapshot: ExpeditionGoalsSnapshot) {
    const activeGoal = snapshot.activeGoal;
    const activeTitle = activeGoal ? this.truncate(activeGoal.title, 36) : "Expedicao lendaria";
    const rewardText = activeGoal
      ? `Recompensa: ${this.truncate(activeGoal.rewardLabel, 36)}`
      : "Recompensa: gloria total";
    const progressValue = activeGoal ? `${activeGoal.current}/${activeGoal.target}` : "MAX";
    const perkText = this.truncate(snapshot.perkSummary, 44);

    const key = [
      snapshot.rank,
      snapshot.progressLabel,
      activeTitle,
      rewardText,
      progressValue,
      perkText,
    ].join("|");

    if (key !== this.lastKey) {
      this.lastKey = key;
      this.rankText.setText(`R${snapshot.rank}`);
      this.progressText.setText(snapshot.progressLabel);
      this.activeTitle.setText(activeTitle);
      this.rewardText.setText(rewardText);
      this.progressValueText.setText(progressValue);
      this.perkText.setText(perkText);
    }

    const ratio = activeGoal
      ? Phaser.Math.Clamp(activeGoal.current / activeGoal.target, 0, 1)
      : 1;
    const fillWidth = Math.max(20, Math.round(this.progressTrackWidth * ratio));

    if (fillWidth !== this.lastFillWidth) {
      this.lastFillWidth = fillWidth;
      this.activeFill.width = fillWidth;
    }
  }

  destroy() {
    this.container.destroy(true);
  }

  private truncate(value: string, maxLength: number) {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
  }
}
