import Phaser from "phaser";
import { getInventorySaleSummary } from "../../game/economy/resourceSellValues";
import {
  getResourceLabel,
  resourceKinds,
} from "../../game/inventory/resourceInventory";
import type {
  ResourceInventory,
  ResourceKind,
} from "../../game/inventory/resourceInventory";
import { getHudLayout } from "./hudLayout";
import {
  createHudElement,
  createHudIcon,
  createHudScope,
  setHudRect,
} from "./domHud";

type HudSnapshot = {
  depth: number;
  coins: number;
  energy: number;
  pickaxeLevel: number;
  cardsFound: number;
  cardsTotal: number;
  comboCount: number;
  comboWindowRatio: number;
  comboColor: string;
  inventory: ResourceInventory;
  backpackLoad: number;
  backpackCapacity: number;
  saleValueMultiplier: number;
  saleBonusPercent: number;
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
  private readonly coinsValue: HTMLDivElement;
  private readonly codexChip: HTMLDivElement;
  private readonly codexValue: HTMLDivElement;
  private readonly comboChip: HTMLDivElement;
  private readonly comboValue: HTMLDivElement;
  private readonly backpackButton: HTMLButtonElement;
  private readonly backpackPanel: HTMLElement;
  private readonly backpackSummary: HTMLDivElement;
  private readonly backpackSummaryLabel: HTMLDivElement;
  private readonly backpackValue: HTMLDivElement;
  private readonly backpackHint: HTMLDivElement;
  private readonly backpackFill: HTMLDivElement;
  private readonly resourceValues: Record<ResourceKind, HTMLDivElement>;
  private readonly resourceTotals: Record<ResourceKind, HTMLDivElement>;
  private readonly resourceRoots: Record<ResourceKind, HTMLDivElement>;
  private readonly handleKeyDown: (event: KeyboardEvent) => void;

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
    depthChip.root.title = "Profundidade atual";
    setHudRect(depthChip.root, layout.statusDepth);
    this.depthValue = depthChip.value;

    const pickaxeChip = createHudStatChip("PICARETA", "LV 1", "pickaxe");
    pickaxeChip.root.title = "Picareta equipada";
    setHudRect(pickaxeChip.root, layout.statusPickaxe);
    this.pickaxeValue = pickaxeChip.value;

    const coinsChip = createHudStatChip("MOEDAS", "0", "coins");
    coinsChip.root.classList.add("game-hud-chip--coins");
    coinsChip.root.title = "Moedas disponíveis";
    setHudRect(coinsChip.root, layout.statusCoins);
    this.coinsValue = coinsChip.value;

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
    this.backpackButton.title = "Abrir mochila (B)";
    this.backpackButton.setAttribute("aria-label", "Abrir mochila");
    setHudRect(this.backpackButton, layout.backpackButton);
    this.backpackButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setBackpackOpen(!this.isBackpackOpen);
    });
    this.handleKeyDown = (event) => {
      const target = event.target;

      if (
        event.key.toLowerCase() !== "b" ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      event.preventDefault();
      this.setBackpackOpen(!this.isBackpackOpen);
    };
    window.addEventListener("keydown", this.handleKeyDown);

    this.backpackPanel = createHudPanel("MOCHILA", "up", "cool");
    this.backpackPanel.classList.add("game-hud-panel--backpack");
    setHudRect(this.backpackPanel, layout.backpackPanel);

    const backpackClose = createHudIconButton("close");
    backpackClose.title = "Fechar mochila";
    backpackClose.setAttribute("aria-label", "Fechar mochila");
    backpackClose.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setBackpackOpen(false);
    });

    const backpackBody = createHudElement("div", "game-hud-panel__body");
    const backpackSummary = createHudElement("div", "game-hud-backpack-summary") as HTMLDivElement;
    this.backpackSummary = backpackSummary;
    this.backpackSummaryLabel = createHudElement("div", "game-hud-backpack-summary__label", "VALOR ESTIMADO") as HTMLDivElement;
    backpackSummary.append(
      this.backpackSummaryLabel,
      this.backpackValue = createHudElement("div", "game-hud-backpack-summary__value", "0 moedas"),
    );
    this.backpackHint = createHudElement(
      "div",
      "game-hud-backpack-hint",
      "MOCHILA VAZIA",
    ) as HTMLDivElement;
    const backpackMeter = createHudElement("div", "game-hud-backpack-meter");
    this.backpackFill = createHudElement("div", "game-hud-backpack-meter__fill") as HTMLDivElement;
    backpackMeter.append(this.backpackFill);
    const resourceGrid = createHudElement("div", "game-hud-resource-grid");

    const resourceSlots = resourceKinds.map((resource) => ({
      resource,
      slot: createHudResourceSlot(getResourceLabel(resource), `resource-${resource}`),
    }));

    this.resourceValues = resourceSlots.reduce(
      (values, { resource, slot }) => ({
        ...values,
        [resource]: slot.value,
      }),
      {} as Record<ResourceKind, HTMLDivElement>,
    );
    this.resourceTotals = resourceSlots.reduce(
      (values, { resource, slot }) => ({
        ...values,
        [resource]: slot.total,
      }),
      {} as Record<ResourceKind, HTMLDivElement>,
    );
    this.resourceRoots = resourceSlots.reduce(
      (values, { resource, slot }) => ({
        ...values,
        [resource]: slot.root,
      }),
      {} as Record<ResourceKind, HTMLDivElement>,
    );

    resourceGrid.append(...resourceSlots.map(({ slot }) => slot.root));
    backpackBody.append(backpackSummary, this.backpackHint, backpackMeter, resourceGrid);
    this.backpackPanel.append(backpackClose, backpackBody);

    this.scope.append(
      depthChip.root,
      pickaxeChip.root,
      coinsChip.root,
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
      snapshot.coins,
      snapshot.pickaxeLevel,
      snapshot.cardsFound,
      snapshot.cardsTotal,
      snapshot.backpackLoad,
      snapshot.backpackCapacity,
      snapshot.saleValueMultiplier.toFixed(3),
      snapshot.saleBonusPercent,
      ...resourceKinds.map((resource) => snapshot.inventory[resource]),
    ].join("|");

    if (infoKey !== this.lastInfoKey) {
      this.lastInfoKey = infoKey;
      const sale = getInventorySaleSummary(snapshot.inventory, snapshot.saleValueMultiplier);

      this.depthValue.textContent = `${snapshot.depth}m`;
      this.coinsValue.textContent = formatHudNumber(snapshot.coins);
      this.depthValue.closest(".game-hud-chip")?.setAttribute("title", `Profundidade atual: ${snapshot.depth}m`);
      this.coinsValue.closest(".game-hud-chip")?.setAttribute("title", `Moedas disponíveis: ${formatHudNumber(snapshot.coins)}`);
      setCompactValueState(this.coinsValue, snapshot.coins);
      this.pickaxeValue.textContent = `LV ${snapshot.pickaxeLevel}`;
      this.pickaxeValue.closest(".game-hud-chip")?.setAttribute("title", `Picareta equipada: nível ${snapshot.pickaxeLevel}`);
      this.codexValue.textContent = `${snapshot.cardsFound}/${snapshot.cardsTotal}`;
      this.codexChip.title = `Coleção arqueológica: ${snapshot.cardsFound}/${snapshot.cardsTotal}`;
      this.backpackSummaryLabel.textContent = snapshot.saleBonusPercent > 0
        ? `VALOR +${snapshot.saleBonusPercent}%`
        : "VALOR ESTIMADO";
      this.backpackSummary.classList.toggle("has-bonus", snapshot.saleBonusPercent > 0);
      this.backpackValue.textContent = `${formatHudNumber(sale.totalCoins)} moedas`;
      this.backpackValue.title = `Valor estimado da mochila: ${formatHudNumber(sale.totalCoins)} moedas`;
      setCompactValueState(this.backpackValue, sale.totalCoins);
      const backpackFull = snapshot.backpackLoad >= snapshot.backpackCapacity;
      const backpackRatio = snapshot.backpackCapacity > 0
        ? Math.min(1, snapshot.backpackLoad / snapshot.backpackCapacity)
        : 0;
      const backpackPercent = Math.round(backpackRatio * 100);
      const backpackNearFull = !backpackFull && backpackRatio >= 0.8;
      this.backpackHint.textContent =
        backpackFull
          ? `MOCHILA CHEIA ${snapshot.backpackLoad}/${snapshot.backpackCapacity}`
          : backpackNearFull
            ? `QUASE CHEIA ${snapshot.backpackLoad}/${snapshot.backpackCapacity}`
            : `${snapshot.backpackLoad}/${snapshot.backpackCapacity} ESPAÇOS`;
      this.backpackHint.title = `Mochila: ${snapshot.backpackLoad}/${snapshot.backpackCapacity} espaços`;
      this.backpackHint.classList.toggle("has-value", sale.totalCoins > 0);
      this.backpackHint.classList.toggle("is-warning", backpackNearFull);
      this.backpackHint.classList.toggle("is-full", backpackFull);
      this.backpackFill.style.width = `${backpackPercent}%`;
      this.backpackFill.title = `${backpackPercent}% da mochila ocupada`;
      this.backpackFill.classList.toggle("is-warning", backpackNearFull);
      this.backpackFill.classList.toggle("is-full", backpackFull);
      const bestResource = sale.lines[0]?.resource;
      for (const resource of resourceKinds) {
        this.updateResourceSlot(resource, snapshot.inventory[resource], sale, resource === bestResource);
      }
      this.codexChip.hidden = snapshot.cardsFound <= 0;
    }

    const comboVisible = snapshot.comboCount > 0;
    const comboKey = `${snapshot.comboCount}|${snapshot.comboWindowRatio.toFixed(3)}|${snapshot.comboColor}`;

    if (comboKey !== this.lastComboKey) {
      this.lastComboKey = comboKey;
      this.comboChip.hidden = !comboVisible;
      this.comboValue.textContent = `x${snapshot.comboCount}`;
      this.comboChip.title = comboVisible
        ? `Combo atual: x${snapshot.comboCount} · ${Math.ceil(snapshot.comboWindowRatio * 100)}% restante`
        : "Combo inativo";
      this.comboChip.style.borderColor = comboVisible ? snapshot.comboColor : "rgba(139, 115, 79, 0.95)";
      this.comboChip.style.color = comboVisible ? snapshot.comboColor : "#f5efdf";
      this.comboChip.style.backgroundImage = comboVisible
        ? `linear-gradient(90deg, ${snapshot.comboColor}33 ${Math.round(snapshot.comboWindowRatio * 100)}%, transparent 0)`
        : "";
    }
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.scope.remove();
    this.container.destroy();
  }

  private setBackpackOpen(value: boolean) {
    this.isBackpackOpen = value;
    this.backpackButton.classList.toggle("is-open", value);
    this.backpackButton.setAttribute("aria-expanded", String(value));
    this.backpackButton.title = value ? "Fechar mochila (B)" : "Abrir mochila (B)";
    this.backpackButton.setAttribute("aria-label", value ? "Fechar mochila" : "Abrir mochila");
    this.backpackPanel.classList.toggle("is-open", value);
  }

  private updateResourceSlot(
    resource: ResourceKind,
    quantity: number,
    sale: ReturnType<typeof getInventorySaleSummary>,
    bestResource: boolean,
  ) {
    const line = sale.lines.find((item) => item.resource === resource);
    const slot = this.resourceRoots[resource];
    const label = getResourceLabel(resource);
    const totalPrice = line?.totalPrice ?? 0;

    slot.classList.toggle("has-value", quantity > 0);
    slot.classList.toggle("is-best", bestResource);
    slot.setAttribute("title", `${label}: ${quantity} · ${formatHudNumber(totalPrice)} moedas`);
    this.resourceValues[resource].textContent = `x${quantity}`;
    this.resourceTotals[resource].textContent = `${formatHudNumber(totalPrice)} moedas`;
    setCompactValueState(this.resourceTotals[resource], totalPrice);
  }
}

function createHudStatChip(label: string, value: string, icon?: "pickaxe" | "codex" | "combo" | "coins") {
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

function formatHudNumber(value: number) {
  const rounded = Math.max(0, Math.floor(value));

  if (rounded >= 1_000_000) {
    return `${formatCompactDecimal(rounded / 1_000_000)}m`;
  }

  if (rounded >= 10_000) {
    return `${formatCompactDecimal(rounded / 1_000)}k`;
  }

  return rounded.toLocaleString("pt-BR");
}

function formatCompactDecimal(value: number) {
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  });
}

function setCompactValueState(element: HTMLElement, value: number) {
  element.classList.toggle("is-compact", value >= 10_000);
  element.classList.toggle("is-dense", value >= 100_000_000);
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
  const root = createHudElement("div", `game-hud-resource ${toneClass}`) as HTMLDivElement;
  const icon = createHudElement("div", "game-hud-resource__icon");
  const meta = createHudElement("div", "game-hud-resource__meta");
  const labelEl = createHudElement("div", "game-hud-resource__label", label);
  const valueEl = createHudElement("div", "game-hud-resource__value", "0");
  const totalEl = createHudElement("div", "game-hud-resource__total", "0 moedas");

  meta.append(labelEl, valueEl, totalEl);
  root.append(icon, meta);
  root.setAttribute("title", `${label}: 0 · 0 moedas`);

  return { root, value: valueEl, total: totalEl };
}
