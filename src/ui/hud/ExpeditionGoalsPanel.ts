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
  private readonly progressText: Phaser.GameObjects.Text;
  private readonly rankText: Phaser.GameObjects.Text;
  private readonly activeTitle: Phaser.GameObjects.Text;
  private readonly activeDescription: Phaser.GameObjects.Text;
  private readonly activeReward: Phaser.GameObjects.Text;
  private readonly activeProgress: Phaser.GameObjects.Text;
  private readonly activeFill: Phaser.GameObjects.Rectangle;
  private readonly nextTitle: Phaser.GameObjects.Text;
  private readonly nextReward: Phaser.GameObjects.Text;
  private readonly perkText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const chrome = createPanelChrome(scene, {
      x: 430,
      y: 84,
      width: 196,
      height: 134,
      accentColor: gameTheme.colors.accent,
      alpha: 0.94,
    });

    const title = scene.add.text(
      444,
      92,
      "EXPEDICAO",
      makeGameTextStyle({
        family: "display",
        color: "#f7e9bf",
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );

    this.rankText = scene.add.text(
      562,
      93,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#d9fff7",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );
    this.rankText.setOrigin(1, 0);

    this.progressText = scene.add.text(
      444,
      112,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "12px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const activePanel = scene.add.rectangle(444, 128, 168, 42, gameTheme.colors.panelDeep, 0.94);
    activePanel.setOrigin(0);
    activePanel.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.8);

    this.activeTitle = scene.add.text(
      452,
      132,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#f8fbff",
        fontSize: "13px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    this.activeDescription = scene.add.text(
      452,
      146,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.textMuted,
        fontSize: "11px",
        fontStyle: "600",
        strokeThickness: 2,
        wordWrapWidth: 118,
      }),
    );

    this.activeReward = scene.add.text(
      452,
      172,
      "",
      makeGameTextStyle({
        color: "#ffe39b",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );

    this.activeProgress = scene.add.text(
      600,
      172,
      "",
      makeGameTextStyle({
        family: "display",
        color: "#dbfdfa",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.activeProgress.setOrigin(1, 0);

    const activeTrack = scene.add.rectangle(452, 191, 148, 6, gameTheme.colors.panel, 1);
    activeTrack.setOrigin(0, 0.5);

    this.activeFill = scene.add.rectangle(452, 191, 148, 4, gameTheme.colors.accent, 1);
    this.activeFill.setOrigin(0, 0.5);

    this.nextTitle = scene.add.text(
      444,
      199,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.nextReward = scene.add.text(
      444,
      212,
      "",
      makeGameTextStyle({
        color: "#9cd8ff",
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.perkText = scene.add.text(
      444,
      226,
      "",
      makeGameTextStyle({
        color: "#b6f0df",
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
        wordWrapWidth: 170,
      }),
    );

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      this.rankText,
      this.progressText,
      activePanel,
      this.activeTitle,
      this.activeDescription,
      this.activeReward,
      this.activeProgress,
      activeTrack,
      this.activeFill,
      this.nextTitle,
      this.nextReward,
      this.perkText,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1080);
  }

  update(snapshot: ExpeditionGoalsSnapshot) {
    this.rankText.setText(`R${snapshot.rank}`);
    this.progressText.setText(snapshot.progressLabel);
    this.perkText.setText(snapshot.perkSummary);

    if (!snapshot.activeGoal) {
      this.activeTitle.setText("Expedicao Lendaria");
      this.activeDescription.setText("Todas as metas desta run foram concluidas.");
      this.activeReward.setText("Recompensa: gloria total");
      this.activeProgress.setText("MAX");
      this.activeFill.width = 148;
      this.nextTitle.setText("Proximo: reinicie e tente bater seu proprio ritmo");
      this.nextReward.setText("Replay: refine rota, streak e profundidade");
      return;
    }

    const activeRatio = Phaser.Math.Clamp(snapshot.activeGoal.current / snapshot.activeGoal.target, 0, 1);

    this.activeTitle.setText(snapshot.activeGoal.title);
    this.activeDescription.setText(snapshot.activeGoal.description);
    this.activeReward.setText(`Premio: ${snapshot.activeGoal.rewardLabel}`);
    this.activeProgress.setText(`${snapshot.activeGoal.current}/${snapshot.activeGoal.target}`);
    this.activeFill.width = Math.max(12, 148 * activeRatio);

    if (snapshot.nextGoal) {
      this.nextTitle.setText(`Depois: ${snapshot.nextGoal.title}`);
      this.nextReward.setText(`Proximo premio: ${snapshot.nextGoal.rewardLabel}`);
      return;
    }

    this.nextTitle.setText("Depois: ultima meta ativa");
    this.nextReward.setText("Finalize a expedicao para fechar a run.");
  }
}
