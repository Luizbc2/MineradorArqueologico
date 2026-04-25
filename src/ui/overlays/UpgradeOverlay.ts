import Phaser from "phaser";
import pickMetalUrl from "../../assets/pickaxes/pick-metal.png";
import pickStoneUrl from "../../assets/pickaxes/pick-stone.png";
import pickWoodUrl from "../../assets/pickaxes/pick-wood.png";
import type { PickaxeDefinition, PickaxeId } from "../../game/progression/pickaxeCatalog";
import { createHudElement, createHudScope } from "../hud/domHud";

type PickaxeShopLine = {
  pickaxe: PickaxeDefinition;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  canBuy: boolean;
};

type OverlaySnapshot = {
  coins: number;
  maxDepthReached: number;
  pickaxes: PickaxeShopLine[];
  onBuy: (id: PickaxeId) => void;
  onEquip: (id: PickaxeId) => void;
  onClose: () => void;
};

const CARDS_PER_PAGE = 3;

export class UpgradeOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scope: HTMLDivElement;
  private readonly overlay: HTMLElement;
  private readonly coinsValue: HTMLSpanElement;
  private readonly depthValue: HTMLSpanElement;
  private readonly carouselBody: HTMLDivElement;
  private readonly pageText: HTMLDivElement;
  private readonly previousButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private pageIndex = 0;
  private snapshot?: OverlaySnapshot;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-modal-scope--workshop", "modal");
    this.overlay = createHudElement("section", "game-modal-overlay");

    const card = createHudElement("div", "game-modal-card game-modal-card--workshop");
    const accent = createHudElement("div", "game-modal-card__accent");
    const title = createHudElement("h2", "game-modal-card__title", "CATÁLOGO DE PICARETAS");

    const meta = createHudElement("div", "game-modal-workshop-meta");
    const coins = createHudElement("div", "game-modal-workshop-meta__item");
    coins.append(createHudElement("span", "", "MOEDAS"));
    this.coinsValue = createHudElement("strong", "", "0");
    coins.append(this.coinsValue);

    const depth = createHudElement("div", "game-modal-workshop-meta__item");
    depth.append(createHudElement("span", "", "PROFUNDIDADE"));
    this.depthValue = createHudElement("strong", "", "0m");
    depth.append(this.depthValue);
    meta.append(coins, depth);

    const carousel = createHudElement("div", "game-modal-workshop-carousel");
    this.previousButton = createArrowButton("<");
    this.carouselBody = createHudElement("div", "game-modal-workshop-carousel__body") as HTMLDivElement;
    this.nextButton = createArrowButton(">");
    carousel.append(this.previousButton, this.carouselBody, this.nextButton);

    this.pageText = createHudElement("div", "game-modal-workshop-page", "1/1");

    const actions = createHudElement("div", "game-modal-actions game-modal-actions--center");
    this.closeButton = createWorkshopButton("FECHAR", "secondary");
    actions.append(this.closeButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint game-modal-hint--center",
      "Use E ou ESC para sair da oficina",
    );

    card.append(accent, title, meta, carousel, this.pageText, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);

    this.previousButton.onclick = () => this.changePage(-1);
    this.nextButton.onclick = () => this.changePage(1);
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: OverlaySnapshot) {
    this.snapshot = snapshot;
    this.pageIndex = Phaser.Math.Clamp(this.pageIndex, 0, this.getLastPage(snapshot));
    this.renderSnapshot(snapshot);
    this.closeButton.onclick = snapshot.onClose;
    this.overlay.classList.add("is-open");
  }

  hide() {
    this.closeButton.onclick = null;
    this.overlay.classList.remove("is-open");
  }

  get isVisible() {
    return this.overlay.classList.contains("is-open");
  }

  private changePage(direction: -1 | 1) {
    if (!this.snapshot) {
      return;
    }

    this.pageIndex = Phaser.Math.Clamp(
      this.pageIndex + direction,
      0,
      this.getLastPage(this.snapshot),
    );
    this.renderSnapshot(this.snapshot);
  }

  private renderSnapshot(snapshot: OverlaySnapshot) {
    this.coinsValue.textContent = formatNumber(snapshot.coins);
    this.depthValue.textContent = `${formatNumber(snapshot.maxDepthReached)}m`;
    this.carouselBody.replaceChildren();

    const pageStart = this.pageIndex * CARDS_PER_PAGE;
    const visibleLines = snapshot.pickaxes.slice(pageStart, pageStart + CARDS_PER_PAGE);

    for (const line of visibleLines) {
      this.carouselBody.append(createPickaxeCard(line, snapshot));
    }

    const totalPages = this.getLastPage(snapshot) + 1;
    this.pageText.textContent = `${this.pageIndex + 1}/${totalPages}`;
    this.previousButton.disabled = this.pageIndex <= 0;
    this.nextButton.disabled = this.pageIndex >= totalPages - 1;
  }

  private getLastPage(snapshot: OverlaySnapshot) {
    return Math.max(0, Math.ceil(snapshot.pickaxes.length / CARDS_PER_PAGE) - 1);
  }
}

function createPickaxeCard(line: PickaxeShopLine, snapshot: OverlaySnapshot) {
  const card = createHudElement("article", "game-modal-pickaxe-card");
  card.classList.toggle("is-equipped", line.equipped);
  card.classList.toggle("is-locked", line.locked);

  const title = createHudElement("h3", "game-modal-pickaxe-card__title", line.pickaxe.name);
  const tier = createHudElement("div", "game-modal-pickaxe-card__tier", `TIER ${line.pickaxe.tier}`);

  const artWrap = createHudElement("div", "game-modal-pickaxe-card__art");
  const image = createHudElement("img", `game-modal-pickaxe-card__image ${getPickaxeImageClass(line.pickaxe.id)}`) as HTMLImageElement;
  image.src = getPickaxeImageUrl(line.pickaxe.id);
  image.alt = "";
  image.draggable = false;
  artWrap.append(image);

  const stats = createHudElement("div", "game-modal-pickaxe-card__stats");
  stats.append(
    createStat("FORÇA", formatNumber(line.pickaxe.power)),
    createStat("PREÇO", formatNumber(line.pickaxe.cost)),
  );

  const action = createWorkshopButton(getActionLabel(line), line.canBuy || line.owned ? "primary" : "secondary");
  action.disabled = line.locked || line.equipped || (!line.owned && !line.canBuy);
  action.onclick = () => {
    if (line.owned) {
      snapshot.onEquip(line.pickaxe.id);
      return;
    }

    snapshot.onBuy(line.pickaxe.id);
  };

  card.append(title, tier, artWrap, stats, action);
  return card;
}

function createStat(label: string, value: string) {
  const stat = createHudElement("div", "game-modal-pickaxe-card__stat");
  stat.append(
    createHudElement("span", "", label),
    createHudElement("strong", "", value),
  );
  return stat;
}

function createArrowButton(label: string) {
  const button = createHudElement("button", "game-modal-workshop-arrow") as HTMLButtonElement;
  button.type = "button";
  button.textContent = label;
  return button;
}

function createWorkshopButton(label: string, tone: "primary" | "secondary") {
  const button = createHudElement(
    "button",
    `game-modal-button game-modal-button--${tone}`,
  ) as HTMLButtonElement;
  button.type = "button";
  button.textContent = label;
  return button;
}

function getActionLabel(line: PickaxeShopLine) {
  if (line.equipped) {
    return "EQUIPADA";
  }

  if (line.owned) {
    return "EQUIPAR";
  }

  if (line.locked) {
    return `${line.pickaxe.unlockDepth}m`;
  }

  return line.canBuy ? "COMPRAR" : "SEM MOEDAS";
}

function getPickaxeImageUrl(id: PickaxeId) {
  if (id === "wood") {
    return pickWoodUrl;
  }

  if (id === "stone") {
    return pickStoneUrl;
  }

  return pickMetalUrl;
}

function getPickaxeImageClass(id: PickaxeId) {
  return `pickaxe-image--${id}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}
