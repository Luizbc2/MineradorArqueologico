import Phaser from "phaser";
import { getHudLayout } from "./hudLayout";
import {
  createHudElement,
  createHudIcon,
  createHudScope,
  setHudRect,
} from "./domHud";

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
  private readonly scope: HTMLDivElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly panel: HTMLElement;
  private readonly overviewText: HTMLDivElement;
  private readonly activeTitle: HTMLDivElement;
  private readonly activeDescription: HTMLDivElement;
  private readonly progressValue: HTMLDivElement;
  private readonly progressFill: HTMLDivElement;
  private readonly rewardText: HTMLDivElement;
  private readonly perkText: HTMLDivElement;
  private readonly nextGoalText: HTMLDivElement;

  private isOpen = false;

  constructor(scene: Phaser.Scene) {
    const viewportWidth = scene.scale.width || scene.cameras.main.width || 1280;
    const viewportHeight = scene.scale.height || scene.cameras.main.height || 720;
    const layout = getHudLayout(viewportWidth, viewportHeight);

    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-hud-scope--missions");

    this.toggleButton = createHudButton("MISSÕES", "missions", "accent");
    setHudRect(this.toggleButton, layout.missionButton);
    this.toggleButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(!this.isOpen);
    });

    this.panel = createHudPanel("MISSÕES", "down", "accent");
    setHudRect(this.panel, layout.missionPanel);

    const closeButton = createHudIconButton("close");
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false);
    });

    const body = createHudElement("div", "game-hud-panel__body");
    const overviewRow = createHudElement("div", "game-hud-mission__overview");
    this.overviewText = createHudElement("div", "game-hud-mission__overview-text", "0/0 metas");
    overviewRow.append(this.overviewText);

    this.activeTitle = createHudElement("div", "game-hud-mission__title", "Primeira camada");
    this.activeDescription = createHudElement(
      "div",
      "game-hud-mission__description",
      "Atinga a próxima meta para acelerar a expedição.",
    );

    const progressHeader = createHudElement("div", "game-hud-mission__progress-row");
    progressHeader.append(
      createHudElement("div", "game-hud-mission__progress-label", "PROGRESSO"),
    );
    this.progressValue = createHudElement("div", "game-hud-mission__progress-value", "0/1");
    progressHeader.append(this.progressValue);

    const progressTrack = createHudElement("div", "game-hud-bar");
    this.progressFill = createHudElement("div", "game-hud-bar__fill");
    progressTrack.append(this.progressFill);

    const rewardCard = createHudElement("div", "game-hud-reward");
    rewardCard.append(createHudElement("div", "game-hud-reward__label", "RECOMPENSA"));
    this.rewardText = createHudElement("div", "game-hud-reward__value", "Combo +0.20s");
    rewardCard.append(this.rewardText);

    this.perkText = createHudElement("div", "game-hud-mission__foot", "Bônus atual: sem bônus ativos");
    this.nextGoalText = createHudElement("div", "game-hud-mission__foot game-hud-mission__foot--muted", "Depois: continue cavando");

    body.append(
      overviewRow,
      this.activeTitle,
      this.activeDescription,
      progressHeader,
      progressTrack,
      rewardCard,
      this.perkText,
      this.nextGoalText,
    );

    this.panel.append(closeButton, body);
    this.scope.append(this.toggleButton, this.panel);
  }

  getRoot() {
    return this.container;
  }

  update(snapshot: ExpeditionGoalsSnapshot) {
    const activeGoal = snapshot.activeGoal;
    const nextGoal = snapshot.nextGoal;

    this.overviewText.textContent = snapshot.progressLabel;
    this.activeTitle.textContent = activeGoal?.title ?? "Ciclo concluído";
    this.activeDescription.textContent = activeGoal?.description
      ?? "Você concluiu as metas atuais. Explore mais fundo para o próximo ciclo.";
    this.progressValue.textContent = activeGoal ? `${activeGoal.current}/${activeGoal.target}` : "MAX";
    this.rewardText.textContent = activeGoal?.rewardLabel ?? "Ciclo completo";
    this.perkText.textContent = `Bônus atual: ${snapshot.perkSummary}`;
    this.nextGoalText.textContent = nextGoal
      ? `Depois: ${nextGoal.title}`
      : "Depois: nenhuma meta pendente";

    const ratio = activeGoal ? Phaser.Math.Clamp(activeGoal.current / activeGoal.target, 0, 1) : 1;
    this.progressFill.style.width = `${Math.round(ratio * 100)}%`;
  }

  destroy() {
    this.scope.remove();
    this.container.destroy();
  }

  private setOpen(value: boolean) {
    this.isOpen = value;
    this.toggleButton.classList.toggle("is-open", value);
    this.panel.classList.toggle("is-open", value);
  }
}

function createHudButton(label: string, icon: "missions", tone: "accent" | "cool") {
  const button = createHudElement("button", `game-hud-button game-hud-button--${tone}`) as HTMLButtonElement;
  button.type = "button";
  button.append(createHudIcon(icon), createHudElement("span", "game-hud-button__label", label));
  return button;
}

function createHudIconButton(icon: "close") {
  const button = createHudElement("button", "game-hud-icon-button") as HTMLButtonElement;
  button.type = "button";
  button.append(createHudIcon(icon));
  return button;
}

function createHudPanel(title: string, direction: "down" | "up", tone: "accent" | "cool") {
  const panel = createHudElement(
    "section",
    `game-hud-panel game-hud-panel--${direction} game-hud-panel--${tone}`,
  );
  const header = createHudElement("div", "game-hud-panel__header");
  header.append(createHudElement("div", "game-hud-panel__title", title));
  panel.append(header);
  return panel;
}
