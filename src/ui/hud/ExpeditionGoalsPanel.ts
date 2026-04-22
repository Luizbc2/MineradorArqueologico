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
  private readonly activeDescriptionText: Phaser.GameObjects.Text;
  private readonly rewardText: Phaser.GameObjects.Text;
  private readonly progressValueText: Phaser.GameObjects.Text;
  private readonly perkText: Phaser.GameObjects.Text;
  private readonly nextGoalText: Phaser.GameObjects.Text;
  private readonly activeFill: Phaser.GameObjects.Rectangle;
  private readonly progressTrackWidth: number;

  private lastKey = "";
  private lastFillWidth = -1;

  constructor(scene: Phaser.Scene) {
    const viewportWidth = scene.scale.width || scene.cameras.main.width || 380;
    const viewportHeight = scene.scale.height || scene.cameras.main.height || 176;
    const compactLayout = viewportWidth < 960;
    const width = compactLayout ? Math.max(320, viewportWidth - 24) : 404;
    const height = compactLayout ? 194 : 186;
    const x = compactLayout ? 12 : viewportWidth - width - 16;
    const y = viewportHeight - height - 16;
    const padding = 16;

    this.progressTrackWidth = width - padding * 2;

    const chrome = createPanelChrome(scene, {
      x,
      y,
      width,
      height,
      accentColor: gameTheme.colors.accent,
      alpha: 0.98,
    });

    const header = scene.add.text(
      x + padding,
      y + 14,
      "MISSAO ATIVA",
      makeGameTextStyle({
        family: "display",
        color: "#ffe9b0",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );

    const progressBadge = scene.add.rectangle(x + width - 132, y + 14, 88, 22, gameTheme.colors.panelDeep, 0.96);
    progressBadge.setOrigin(0, 0);
    progressBadge.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    this.progressText = scene.add.text(
      x + width - 88,
      y + 18,
      "0/0 metas",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );
    this.progressText.setOrigin(0.5, 0);

    const rankBadge = scene.add.rectangle(x + width - 38, y + 14, 24, 22, gameTheme.colors.panelDeep, 0.96);
    rankBadge.setOrigin(0, 0);
    rankBadge.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.82);

    this.rankText = scene.add.text(
      x + width - 26,
      y + 18,
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

    this.activeTitle = scene.add.text(
      x + padding,
      y + 46,
      "Primeiro objetivo",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "20px",
        fontStyle: "800",
        strokeThickness: 1,
        wordWrapWidth: width - padding * 2 - 90,
      }),
    );

    this.progressValueText = scene.add.text(
      x + width - padding,
      y + 48,
      "0/1",
      makeGameTextStyle({
        family: "display",
        color: "#e6fff8",
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 1,
      }),
    );
    this.progressValueText.setOrigin(1, 0);

    this.activeDescriptionText = scene.add.text(
      x + padding,
      y + 72,
      "Complete a primeira tarefa para acelerar a expedicao.",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 1,
        wordWrapWidth: width - padding * 2,
      }),
    );
    this.activeDescriptionText.setLineSpacing(4);

    const progressTrack = scene.add.rectangle(
      x + padding,
      y + 112,
      this.progressTrackWidth,
      10,
      gameTheme.colors.panelDeep,
      1,
    );
    progressTrack.setOrigin(0, 0.5);
    progressTrack.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.7);

    this.activeFill = scene.add.rectangle(
      x + padding,
      y + 112,
      this.progressTrackWidth,
      8,
      gameTheme.colors.accent,
      1,
    );
    this.activeFill.setOrigin(0, 0.5);

    this.rewardText = scene.add.text(
      x + padding,
      y + 124,
      "Recompensa: bonus de expedicao",
      makeGameTextStyle({
        color: "#ffe39b",
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 1,
        wordWrapWidth: width - padding * 2,
      }),
    );

    const footerDivider = scene.add.rectangle(
      x + padding,
      y + 150,
      width - padding * 2,
      1,
      gameTheme.colors.borderSoft,
      0.85,
    );
    footerDivider.setOrigin(0, 0);

    const perkLabel = scene.add.text(
      x + padding,
      y + 156,
      "Bonus ativo",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
      }),
    );

    this.perkText = scene.add.text(
      x + padding + 72,
      y + 156,
      "Sem bonus liberados",
      makeGameTextStyle({
        color: "#9bdccf",
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
        wordWrapWidth: width - padding * 2 - 72,
      }),
    );

    this.nextGoalText = scene.add.text(
      x + padding,
      y + 173,
      "Depois: continue a escavacao",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 1,
        wordWrapWidth: width - padding * 2,
      }),
    );

    this.container = scene.add.container(0, 0, [
      ...chrome,
      header,
      progressBadge,
      this.progressText,
      rankBadge,
      this.rankText,
      this.activeTitle,
      this.progressValueText,
      this.activeDescriptionText,
      progressTrack,
      this.activeFill,
      this.rewardText,
      footerDivider,
      perkLabel,
      this.perkText,
      this.nextGoalText,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1030);
  }

  getRoot() {
    return this.container;
  }

  update(snapshot: ExpeditionGoalsSnapshot) {
    const activeGoal = snapshot.activeGoal;
    const nextGoal = snapshot.nextGoal;
    const activeTitle = activeGoal ? this.truncate(activeGoal.title, 34) : "Expedicao concluida";
    const activeDescription = activeGoal
      ? this.truncate(activeGoal.description, 96)
      : "Todas as metas atuais foram concluidas. Hora de explorar mais fundo.";
    const rewardText = activeGoal
      ? `Recompensa: ${this.truncate(activeGoal.rewardLabel, 54)}`
      : "Recompensa: ciclo atual completo";
    const nextGoalText = nextGoal
      ? `Depois: ${this.truncate(nextGoal.title, 44)}`
      : "Depois: nenhuma meta pendente";
    const progressValue = activeGoal ? `${activeGoal.current}/${activeGoal.target}` : "MAX";
    const perkText = this.truncate(snapshot.perkSummary, 44);

    const key = [
      snapshot.rank,
      snapshot.progressLabel,
      activeTitle,
      activeDescription,
      rewardText,
      progressValue,
      perkText,
      nextGoalText,
    ].join("|");

    if (key !== this.lastKey) {
      this.lastKey = key;
      this.rankText.setText(`R${snapshot.rank}`);
      this.progressText.setText(snapshot.progressLabel);
      this.activeTitle.setText(activeTitle);
      this.activeDescriptionText.setText(activeDescription);
      this.rewardText.setText(rewardText);
      this.progressValueText.setText(progressValue);
      this.perkText.setText(perkText);
      this.nextGoalText.setText(nextGoalText);
    }

    const ratio = activeGoal
      ? Phaser.Math.Clamp(activeGoal.current / activeGoal.target, 0, 1)
      : 1;
    const fillWidth = Math.max(24, Math.round(this.progressTrackWidth * ratio));

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

    return `${value.slice(0, maxLength - 1)}...`;
  }
}
