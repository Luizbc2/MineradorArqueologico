import Phaser from "phaser";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../../game/world/constants";
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

  private lastKey = "";
  private lastFillWidth = -1;

  constructor(scene: Phaser.Scene) {
    const width = 260;
    const height = 90;
    const x = VIEWPORT_WIDTH - width - 12;
    const y = VIEWPORT_HEIGHT - height - 12;

    const chrome = createPanelChrome(scene, {
      x,
      y,
      width,
      height,
      accentColor: gameTheme.colors.accent,
      alpha: 0.95,
    });

    const title = scene.add.text(
      x + 14,
      y + 9,
      "META ATIVA",
      makeGameTextStyle({
        family: "display",
        color: "#f6e6b5",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    this.rankText = scene.add.text(
      x + width - 14,
      y + 9,
      "R1",
      makeGameTextStyle({
        family: "display",
        color: "#d7fff6",
        fontSize: "14px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );
    this.rankText.setOrigin(1, 0);

    this.progressText = scene.add.text(
      x + 14,
      y + 28,
      "0/0 metas",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "11px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.activeTitle = scene.add.text(
      x + 14,
      y + 46,
      "Primeira meta",
      makeGameTextStyle({
        family: "display",
        color: "#ffffff",
        fontSize: "13px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );

    this.rewardText = scene.add.text(
      x + 14,
      y + 62,
      "Premio: combo",
      makeGameTextStyle({
        color: "#ffe39b",
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    const progressTrack = scene.add.rectangle(
      x + 164,
      y + 66,
      76,
      5,
      gameTheme.colors.panelDeep,
      1,
    );
    progressTrack.setOrigin(0, 0.5);

    this.activeFill = scene.add.rectangle(
      x + 164,
      y + 66,
      76,
      3,
      gameTheme.colors.accent,
      1,
    );
    this.activeFill.setOrigin(0, 0.5);

    this.progressValueText = scene.add.text(
      x + width - 14,
      y + 56,
      "0/1",
      makeGameTextStyle({
        family: "display",
        color: "#d7fff6",
        fontSize: "11px",
        fontStyle: "800",
        strokeThickness: 2,
      }),
    );
    this.progressValueText.setOrigin(1, 0);

    this.perkText = scene.add.text(
      x + 14,
      y + 76,
      "Sem perks ativos",
      makeGameTextStyle({
        color: "#9bdccf",
        fontSize: "9px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );

    this.container = scene.add.container(0, 0, [
      ...chrome,
      title,
      this.rankText,
      this.progressText,
      this.activeTitle,
      this.rewardText,
      progressTrack,
      this.activeFill,
      this.progressValueText,
      this.perkText,
    ]);

    this.container.setScrollFactor(0);
    this.container.setDepth(1030);
  }

  update(snapshot: ExpeditionGoalsSnapshot) {
    const activeGoal = snapshot.activeGoal;
    const activeTitle = activeGoal ? this.truncate(activeGoal.title, 23) : "Expedicao lendaria";
    const rewardText = activeGoal
      ? `Premio: ${this.truncate(activeGoal.rewardLabel, 18)}`
      : "Premio: gloria total";
    const progressValue = activeGoal ? `${activeGoal.current}/${activeGoal.target}` : "MAX";
    const perkText = this.truncate(snapshot.perkSummary, 33);

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
    const fillWidth = Math.max(12, Math.round(76 * ratio));

    if (fillWidth !== this.lastFillWidth) {
      this.lastFillWidth = fillWidth;
      this.activeFill.width = fillWidth;
    }
  }

  private truncate(value: string, maxLength: number) {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
  }
}
