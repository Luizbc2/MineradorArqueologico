import Phaser from "phaser";
import { createHudElement, createHudScope } from "../hud/domHud";

type PauseOverlaySnapshot = {
  onResume: () => void;
};

export class PauseOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scope: HTMLDivElement;
  private readonly overlay: HTMLElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly menuButton: HTMLButtonElement;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-modal-scope--pause", "modal");
    this.overlay = createHudElement("section", "game-modal-overlay");

    const card = createHudElement("div", "game-modal-card game-modal-card--pause");
    const accent = createHudElement("div", "game-modal-card__accent");
    const title = createHudElement("h2", "game-modal-card__title", "PAUSA DA EXPEDICAO");
    const subtitle = createHudElement(
      "p",
      "game-modal-card__subtitle",
      "Respire, confira a rota e volte para o tunel quando quiser.",
    );

    const controls = createHudElement("section", "game-modal-section");
    controls.append(createHudElement("div", "game-modal-section__title", "ATALHOS RAPIDOS"));

    const controlsList = createHudElement("div", "game-modal-controls");
    controlsList.append(
      createPauseShortcut("ESC", "pausa ou retoma a expedicao"),
      createPauseShortcut("E", "interage com bau ou registro"),
      createPauseShortcut("U", "abre a forja na superficie"),
      createPauseShortcut("R", "retorna para a base segura"),
    );
    controls.append(controlsList);

    const roadmap = createHudElement(
      "div",
      "game-modal-note",
      "Configuracoes e opcoes avancadas chegam no proximo passo.",
    );

    const actions = createHudElement("div", "game-modal-actions");
    this.resumeButton = createPauseButton("CONTINUAR", "primary");
    this.menuButton = createPauseButton("MENU EM BREVE", "secondary");
    this.menuButton.disabled = true;
    actions.append(this.resumeButton, this.menuButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint",
      "Pressione ESC para voltar para a expedicao",
    );

    card.append(accent, title, subtitle, controls, roadmap, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: PauseOverlaySnapshot) {
    this.resumeButton.onclick = snapshot.onResume;
    this.overlay.classList.add("is-open");
  }

  hide() {
    this.resumeButton.onclick = null;
    this.overlay.classList.remove("is-open");
  }

  get isVisible() {
    return this.overlay.classList.contains("is-open");
  }
}

function createPauseShortcut(key: string, description: string) {
  const row = createHudElement("div", "game-modal-controls__row");
  const chip = createHudElement("div", "game-modal-controls__key", key);
  const text = createHudElement("div", "game-modal-controls__text", description);
  row.append(chip, text);
  return row;
}

function createPauseButton(label: string, tone: "primary" | "secondary") {
  const button = createHudElement(
    "button",
    `game-modal-button game-modal-button--${tone}`,
  ) as HTMLButtonElement;
  button.type = "button";
  button.textContent = label;
  return button;
}
