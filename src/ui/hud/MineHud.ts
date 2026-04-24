import Phaser from "phaser";
import type { ResourceInventory } from "../../game/inventory/resourceInventory";
import { getHudLayout } from "./hudLayout";
import {
  createHudElement,
  createHudIcon,
  createHudScope,
  setHudRect,
} from "./domHud";

type HudSnapshot = {
  depth: number;
  energy: number;
  pickaxeLevel: number;
  cardsFound: number;
  cardsTotal: number;
  comboCount: number;
  comboWindowRatio: number;
  comboColor: string;
  inventory: ResourceInventory;
  atSurface: boolean;
  surfaceReturnLocked: boolean;
};

type MineHudOptions = {
  onPauseToggle?: () => void;
  onSurfaceReturn?: () => void;
};

export class MineHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scope: HTMLDivElement;
  private readonly depthValue: HTMLDivElement;
  private readonly pickaxeValue: HTMLDivElement;
  private readonly codexChip: HTMLDivElement;
  private readonly codexValue: HTMLDivElement;
  private readonly comboChip: HTMLDivElement;
  private readonly comboValue: HTMLDivElement;
  private readonly backpackButton: HTMLButtonElement;
  private readonly backpackPanel: HTMLElement;
  private readonly resourceValues: Record<keyof ResourceInventory, HTMLDivElement>;

  private isBackpackOpen = false;
  private lastInfoKey = "";
  private lastComboKey = "";

  constructor(scene: Phaser.Scene, _options: MineHudOptions = {}) {
    const viewportWidth = scene.scale.width || scene.cameras.main.width || 1280;
    const viewportHeight = scene.scale.height || scene.cameras.main.height || 720;
    const layout = getHudLayout(viewportWidth, viewportHeight);

    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-hud-scope--mine");

    const depthChip = createHudStatChip("PROF.", "0m");
    depthChip.root.classList.add("game-hud-chip--priority");
    setHudRect(depthChip.root, layout.statusDepth);
    this.depthValue = depthChip.value;

    const pickaxeChip = createHudStatChip("PICARETA", "LV 1", "pickaxe");
    setHudRect(pickaxeChip.root, layout.statusPickaxe);
    this.pickaxeValue = pickaxeChip.value;

    const rail = createHudElement("div", "game-hud-rail");
    rail.style.left = `${layout.statusRail.x}px`;
    rail.style.top = `${layout.statusRail.y}px`;
    rail.style.width = `${layout.statusRail.width}px`;
    rail.style.minHeight = `${layout.statusRail.height}px`;

    const codexChip = createHudStatChip("CODEX", "0/0", "codex");
    codexChip.root.classList.add("game-hud-chip--small");
    codexChip.root.hidden = true;
    this.codexChip = codexChip.root;
    this.codexValue = codexChip.value;

    const comboChip = createHudStatChip("COMBO", "x0", "combo");
    comboChip.root.classList.add("game-hud-chip--small");
    comboChip.root.hidden = true;
    this.comboChip = comboChip.root;
    this.comboValue = comboChip.value;

    rail.append(codexChip.root, comboChip.root);

    this.backpackButton = createHudButton("MOCHILA", "backpack", "cool");
    setHudRect(this.backpackButton, layout.backpackButton);
    this.backpackButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setBackpackOpen(!this.isBackpackOpen);
    });

    this.backpackPanel = createHudPanel("MOCHILA", "up", "cool");
    setHudRect(this.backpackPanel, layout.backpackPanel);

    const backpackClose = createHudIconButton("close");
    backpackClose.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setBackpackOpen(false);
    });

    const backpackBody = createHudElement("div", "game-hud-panel__body");
    const resourceGrid = createHudElement("div", "game-hud-resource-grid");

    const coal = createHudResourceSlot("Carvão", "resource-coal");
    const iron = createHudResourceSlot("Ferro", "resource-iron");
    const gold = createHudResourceSlot("Ouro", "resource-gold");
    const diamond = createHudResourceSlot("Diamante", "resource-diamond");

    this.resourceValues = {
      coal: coal.value,
      iron: iron.value,
      gold: gold.value,
      diamond: diamond.value,
    };

    resourceGrid.append(coal.root, iron.root, gold.root, diamond.root);
    backpackBody.append(resourceGrid);
    this.backpackPanel.append(backpackClose, backpackBody);

    this.scope.append(
      depthChip.root,
      pickaxeChip.root,
      rail,
      this.backpackButton,
      this.backpackPanel,
    );
  }

  getRoot() {
    return this.container;
  }

  update(snapshot: HudSnapshot) {
    const infoKey = [
      snapshot.depth,
      snapshot.pickaxeLevel,
      snapshot.cardsFound,
      snapshot.cardsTotal,
      snapshot.inventory.coal,
      snapshot.inventory.iron,
      snapshot.inventory.gold,
      snapshot.inventory.diamond,
    ].join("|");

    if (infoKey !== this.lastInfoKey) {
      this.lastInfoKey = infoKey;
      this.depthValue.textContent = `${snapshot.depth}m`;
      this.pickaxeValue.textContent = `LV ${snapshot.pickaxeLevel}`;
      this.codexValue.textContent = `${snapshot.cardsFound}/${snapshot.cardsTotal}`;
      this.resourceValues.coal.textContent = `${snapshot.inventory.coal}`;
      this.resourceValues.iron.textContent = `${snapshot.inventory.iron}`;
      this.resourceValues.gold.textContent = `${snapshot.inventory.gold}`;
      this.resourceValues.diamond.textContent = `${snapshot.inventory.diamond}`;
      this.codexChip.hidden = snapshot.cardsFound <= 0;
    }

    const comboVisible = snapshot.comboCount > 0;
    const comboKey = `${snapshot.comboCount}|${snapshot.comboWindowRatio.toFixed(3)}|${snapshot.comboColor}`;

    if (comboKey !== this.lastComboKey) {
      this.lastComboKey = comboKey;
      this.comboChip.hidden = !comboVisible;
      this.comboValue.textContent = `x${snapshot.comboCount}`;
      this.comboChip.style.borderColor = comboVisible ? snapshot.comboColor : "rgba(139, 115, 79, 0.95)";
      this.comboChip.style.color = comboVisible ? snapshot.comboColor : "#f5efdf";
    }
  }

  destroy() {
    this.scope.remove();
    this.container.destroy();
  }

  private setBackpackOpen(value: boolean) {
    this.isBackpackOpen = value;
    this.backpackButton.classList.toggle("is-open", value);
    this.backpackPanel.classList.toggle("is-open", value);
  }
}

function createHudStatChip(label: string, value: string, icon?: "pickaxe" | "codex" | "combo") {
  const root = createHudElement("div", "game-hud-chip");
  const content = createHudElement("div", "game-hud-chip__content");

  if (icon) {
    const iconWrap = createHudElement("div", "game-hud-chip__icon");
    iconWrap.append(createHudIcon(icon));
    root.append(iconWrap);
  }

  const labelEl = createHudElement("div", "game-hud-chip__label", label);
  const valueEl = createHudElement("div", "game-hud-chip__value", value);
  content.append(labelEl, valueEl);
  root.append(content);

  return { root, value: valueEl };
}

function createHudButton(label: string, icon: "missions" | "backpack", tone: "accent" | "cool") {
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

function createHudResourceSlot(label: string, toneClass: string) {
  const root = createHudElement("div", `game-hud-resource ${toneClass}`);
  const icon = createHudElement("div", "game-hud-resource__icon");
  const meta = createHudElement("div", "game-hud-resource__meta");
  const labelEl = createHudElement("div", "game-hud-resource__label", label);
  const valueEl = createHudElement("div", "game-hud-resource__value", "0");

  meta.append(labelEl, valueEl);
  root.append(icon, meta);

  return { root, value: valueEl };
}
