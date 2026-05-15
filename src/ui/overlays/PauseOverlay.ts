import Phaser from "phaser";
import { createHudElement, createHudScope } from "../hud/domHud";

type PauseOverlaySnapshot = {
  audioMuted: boolean;
  onAdminCodeSubmit: (code: string) => {
    ok: boolean;
    message: string;
  };
  onAudioToggle: () => void;
  onResume: () => void;
};

export class PauseOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scope: HTMLDivElement;
  private readonly overlay: HTMLElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly audioButton: HTMLButtonElement;
  private readonly adminCodeInput: HTMLInputElement;
  private readonly adminCodeButton: HTMLButtonElement;
  private readonly adminCodeStatus: HTMLDivElement;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-modal-scope--pause", "modal");
    this.overlay = createHudElement("section", "game-modal-overlay");
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-label", "Pausa da expedição");

    const card = createHudElement("div", "game-modal-card game-modal-card--pause");
    const accent = createHudElement("div", "game-modal-card__accent");
    const title = createHudElement("h2", "game-modal-card__title", "PAUSA DA EXPEDIÇÃO");
    const subtitle = createHudElement(
      "p",
      "game-modal-card__subtitle",
      "Respire, confira a rota e volte para o túnel quando quiser.",
    );

    const controls = createHudElement("section", "game-modal-section");
    controls.append(createHudElement("div", "game-modal-section__title", "ATALHOS RÁPIDOS"));

    const controlsList = createHudElement("div", "game-modal-controls");
    controlsList.append(
      createPauseShortcut("ESC", "Pausa ou retoma a expedição"),
      createPauseShortcut("E", "Interage com baú ou registro"),
      createPauseShortcut("U", "Abre a forja na superfície"),
      createPauseShortcut("B", "Abre ou fecha a mochila"),
      createPauseShortcut("V", "Vende a mochila perto do vendedor"),
      createPauseShortcut("R", "Retorna para a base segura"),
    );
    controls.append(controlsList);

    const adminSection = createHudElement("section", "game-modal-section game-modal-section--admin");
    adminSection.append(createHudElement("div", "game-modal-section__title", "TESTE LOCAL"));
    const adminCodeRow = createHudElement("div", "game-modal-admin-code");
    this.adminCodeInput = createHudElement("input", "game-modal-admin-code__input") as HTMLInputElement;
    this.adminCodeInput.type = "password";
    this.adminCodeInput.placeholder = "Código local";
    this.adminCodeInput.setAttribute("aria-label", "Código local de teste");
    this.adminCodeInput.maxLength = 40;
    this.adminCodeInput.autocomplete = "off";
    this.adminCodeButton = createPauseButton("APLICAR", "secondary");
    this.adminCodeButton.disabled = true;
    this.adminCodeStatus = createHudElement("div", "game-modal-admin-code__status") as HTMLDivElement;
    this.adminCodeStatus.setAttribute("role", "status");
    this.adminCodeStatus.setAttribute("aria-live", "polite");
    adminCodeRow.append(this.adminCodeInput, this.adminCodeButton);
    adminSection.append(adminCodeRow, this.adminCodeStatus);

    const roadmap = createHudElement(
      "div",
      "game-modal-note",
      "Use o controle de som para ajustar a expedição sem sair da mina.",
    );

    const actions = createHudElement("div", "game-modal-actions");
    this.resumeButton = createPauseButton("CONTINUAR", "primary");
    this.audioButton = createPauseButton("SOM LIGADO", "secondary");
    actions.append(this.resumeButton, this.audioButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint",
      "Pressione ESC para voltar para a expedição",
    );

    card.append(accent, title, subtitle, controls, adminSection, roadmap, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: PauseOverlaySnapshot) {
    this.setAudioMuted(snapshot.audioMuted);
    this.resumeButton.onclick = snapshot.onResume;
    this.audioButton.onclick = snapshot.onAudioToggle;
    this.adminCodeButton.onclick = () => {
      const result = snapshot.onAdminCodeSubmit(this.adminCodeInput.value.trim());

      this.adminCodeStatus.textContent = result.message;
      this.adminCodeStatus.classList.toggle("is-ok", result.ok);
      this.adminCodeStatus.classList.toggle("is-error", !result.ok);

      if (result.ok) {
        this.adminCodeInput.value = "";
        this.adminCodeButton.disabled = true;
      }
    };
    this.adminCodeInput.onkeydown = (event) => {
      event.stopPropagation();

      if (event.key === "Enter") {
        this.adminCodeButton.click();
      }
    };
    this.adminCodeInput.oninput = () => {
      this.adminCodeStatus.textContent = "";
      this.adminCodeStatus.classList.remove("is-ok", "is-error");
      this.adminCodeButton.disabled = this.adminCodeInput.value.trim().length === 0;
    };
    this.adminCodeStatus.textContent = "";
    this.adminCodeStatus.classList.remove("is-ok", "is-error");
    this.overlay.classList.add("is-open");
    window.requestAnimationFrame(() => this.resumeButton.focus({ preventScroll: true }));
  }

  hide() {
    this.resumeButton.onclick = null;
    this.audioButton.onclick = null;
    this.adminCodeButton.onclick = null;
    this.adminCodeInput.onkeydown = null;
    this.adminCodeInput.oninput = null;
    this.adminCodeInput.value = "";
    this.adminCodeButton.disabled = true;
    this.adminCodeStatus.textContent = "";
    this.adminCodeStatus.classList.remove("is-ok", "is-error");
    this.overlay.classList.remove("is-open");
  }

  get isVisible() {
    return this.overlay.classList.contains("is-open");
  }

  setAudioMuted(muted: boolean) {
    this.audioButton.textContent = muted ? "SOM DESLIGADO" : "SOM LIGADO";
    this.audioButton.title = muted ? "Ativar som" : "Desativar som";
    this.audioButton.setAttribute("aria-label", muted ? "Ativar som" : "Desativar som");
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
  button.title = label;
  button.setAttribute("aria-label", label);
  return button;
}
