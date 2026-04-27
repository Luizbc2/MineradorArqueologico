import Phaser from "phaser";
import pickAncientCrystalUrl from "../../assets/pickaxes/pick-ancient-crystal.png";
import pickCopperUrl from "../../assets/pickaxes/pick-copper.png";
import pickDiamondUrl from "../../assets/pickaxes/pick-diamond.png";
import pickGoldUrl from "../../assets/pickaxes/pick-gold.png";
import pickIronUrl from "../../assets/pickaxes/pick-iron.png";
import pickMetalUrl from "../../assets/pickaxes/pick-metal.png";
import pickObsidianUrl from "../../assets/pickaxes/pick-obsidian.png";
import pickStoneUrl from "../../assets/pickaxes/pick-stone.png";
import pickWoodUrl from "../../assets/pickaxes/pick-wood.png";
import type { PickaxeDefinition, PickaxeId } from "../../game/progression/pickaxeCatalog";
import type { UpgradeDefinition, UpgradeId } from "../../game/progression/upgradeCatalog";
import { createHudElement, createHudScope } from "../hud/domHud";

type PickaxeShopLine = {
  pickaxe: PickaxeDefinition;
  owned: boolean;
  equipped: boolean;
  locked: boolean;
  canBuy: boolean;
};

type UpgradeShopLine = {
  upgrade: UpgradeDefinition;
  level: number;
  cost: number | null;
  canBuy: boolean;
};

type OverlaySnapshot = {
  coins: number;
  maxDepthReached: number;
  pickaxes: PickaxeShopLine[];
  upgrades: UpgradeShopLine[];
  onBuy: (id: PickaxeId) => void;
  onEquip: (id: PickaxeId) => void;
  onUpgradeBuy: (id: UpgradeId) => void;
  onClose: () => void;
};

const CARDS_PER_PAGE = 3;
type WorkshopTab = "pickaxes" | "upgrades";

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
  private readonly pickaxesTab: HTMLButtonElement;
  private readonly upgradesTab: HTMLButtonElement;
  private readonly pickaxesPanel: HTMLDivElement;
  private readonly upgradesPanel: HTMLDivElement;
  private readonly upgradesBody: HTMLDivElement;
  private readonly closeButton: HTMLButtonElement;
  private activeTab: WorkshopTab = "pickaxes";
  private pageIndex = 0;
  private snapshot?: OverlaySnapshot;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-modal-scope--workshop", "modal");
    this.overlay = createHudElement("section", "game-modal-overlay");

    const card = createHudElement("div", "game-modal-card game-modal-card--workshop");
    const accent = createHudElement("div", "game-modal-card__accent");
    const title = createHudElement("h2", "game-modal-card__title", "OFICINA");

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

    const tabs = createHudElement("div", "game-modal-workshop-tabs");
    this.pickaxesTab = createWorkshopTabButton("PICARETAS");
    this.upgradesTab = createWorkshopTabButton("UPGRADES");
    tabs.append(this.pickaxesTab, this.upgradesTab);

    this.pickaxesPanel = createHudElement("div", "game-modal-workshop-panel") as HTMLDivElement;
    const carousel = createHudElement("div", "game-modal-workshop-carousel");
    this.previousButton = createArrowButton("<");
    this.carouselBody = createHudElement("div", "game-modal-workshop-carousel__body") as HTMLDivElement;
    this.nextButton = createArrowButton(">");
    carousel.append(this.previousButton, this.carouselBody, this.nextButton);

    this.pageText = createHudElement("div", "game-modal-workshop-page", "1/1");
    this.pickaxesPanel.append(carousel, this.pageText);

    this.upgradesPanel = createHudElement("div", "game-modal-workshop-panel") as HTMLDivElement;
    this.upgradesBody = createHudElement("div", "game-modal-upgrade-list") as HTMLDivElement;
    this.upgradesPanel.append(this.upgradesBody);

    const actions = createHudElement("div", "game-modal-actions game-modal-actions--center");
    this.closeButton = createWorkshopButton("FECHAR", "secondary");
    actions.append(this.closeButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint game-modal-hint--center",
      "Use E ou ESC para sair da oficina",
    );

    card.append(accent, title, meta, tabs, this.pickaxesPanel, this.upgradesPanel, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);

    this.pickaxesTab.onclick = () => this.setActiveTab("pickaxes");
    this.upgradesTab.onclick = () => this.setActiveTab("upgrades");
    this.previousButton.onclick = () => this.changePage(-1);
    this.nextButton.onclick = () => this.changePage(1);
    this.renderTabs();
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
    this.renderTabs();
    this.renderPickaxes(snapshot);
    this.renderUpgrades(snapshot);
  }

  private renderPickaxes(snapshot: OverlaySnapshot) {
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

  private renderUpgrades(snapshot: OverlaySnapshot) {
    this.upgradesBody.replaceChildren();

    for (const line of snapshot.upgrades) {
      this.upgradesBody.append(createUpgradeRow(line, snapshot));
    }
  }

  private setActiveTab(tab: WorkshopTab) {
    this.activeTab = tab;
    this.renderTabs();
  }

  private renderTabs() {
    this.pickaxesTab.classList.toggle("is-active", this.activeTab === "pickaxes");
    this.upgradesTab.classList.toggle("is-active", this.activeTab === "upgrades");
    this.pickaxesPanel.hidden = this.activeTab !== "pickaxes";
    this.upgradesPanel.hidden = this.activeTab !== "upgrades";
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
  const unlock = createHudElement(
    "div",
    "game-modal-pickaxe-card__unlock",
    line.pickaxe.unlockDepth > 0 ? `LIBERA EM ${formatNumber(line.pickaxe.unlockDepth)}m` : "INICIAL",
  );

  const artWrap = createHudElement("div", "game-modal-pickaxe-card__art");
  const image = createHudElement("img", `game-modal-pickaxe-card__image ${getPickaxeImageClass(line.pickaxe.id)}`) as HTMLImageElement;
  image.src = getPickaxeImageUrl(line.pickaxe.id);
  image.alt = "";
  image.draggable = false;
  artWrap.append(image);

  const stats = createHudElement("div", "game-modal-pickaxe-card__stats");
  stats.append(
    createStat("FORÇA", formatNumber(line.pickaxe.power)),
    createStat("VEL.", formatSpeedMultiplier(line.pickaxe.baseSpeed)),
    createStat("PREÇO", formatCompactCardNumber(line.pickaxe.cost)),
  );

  const action = createWorkshopButton(getActionLabel(line, snapshot.coins), line.canBuy || line.owned ? "primary" : "secondary");
  action.disabled = line.locked || line.equipped || (!line.owned && !line.canBuy);
  action.onclick = () => {
    if (line.owned) {
      snapshot.onEquip(line.pickaxe.id);
      return;
    }

    snapshot.onBuy(line.pickaxe.id);
  };

  card.append(title, tier, unlock, artWrap, stats, action);
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

function createWorkshopTabButton(label: string) {
  const button = createHudElement("button", "game-modal-workshop-tab") as HTMLButtonElement;
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

function createUpgradeRow(line: UpgradeShopLine, snapshot: OverlaySnapshot) {
  const row = createHudElement("article", "game-modal-upgrade-row");
  row.classList.toggle("is-maxed", line.cost === null);

  const copy = createHudElement("div", "game-modal-upgrade-row__copy");
  const title = createHudElement("h3", "game-modal-upgrade-row__title", line.upgrade.name);
  const description = createHudElement("p", "game-modal-upgrade-row__description", line.upgrade.description);
  const currentEffect = createHudElement("div", "game-modal-upgrade-row__effect", formatUpgradeCurrentEffect(line));
  const nextEffect = createHudElement("div", "game-modal-upgrade-row__effect game-modal-upgrade-row__effect--muted", formatUpgradeNextEffect(line));
  copy.append(title, description, currentEffect, nextEffect);

  const meta = createHudElement("div", "game-modal-upgrade-row__meta");
  meta.append(
    createHudElement("span", "", `NÍVEL ${line.level}/${line.upgrade.maxLevel}`),
    createHudElement("strong", "", line.cost === null ? "Completo" : `${formatNumber(line.cost)} moedas`),
  );

  const action = createWorkshopButton(getUpgradeActionLabel(line, snapshot.coins), line.canBuy ? "primary" : "secondary");
  action.disabled = !line.canBuy;
  action.onclick = () => snapshot.onUpgradeBuy(line.upgrade.id);

  row.append(copy, meta, action);
  return row;
}

function formatUpgradeCurrentEffect(line: UpgradeShopLine) {
  const total = line.upgrade.effectPerLevel * line.level;

  if (line.upgrade.effectKind === "flatPower") {
    return `Atual: +${formatNumber(total)} força`;
  }

  return `Atual: +${Math.round(total * 100)}% velocidade`;
}

function formatUpgradeNextEffect(line: UpgradeShopLine) {
  if (line.cost === null) {
    return "Máximo atingido";
  }

  if (line.upgrade.effectKind === "flatPower") {
    return `Próximo: +${formatNumber(line.upgrade.effectPerLevel)} força por nível`;
  }

  return `Próximo: +${Math.round(line.upgrade.effectPerLevel * 100)}% velocidade por nível`;
}

function getUpgradeActionLabel(line: UpgradeShopLine, coins: number) {
  if (line.cost === null) {
    return "MÁXIMO";
  }

  return line.canBuy ? "COMPRAR" : `FALTAM ${formatNumber(line.cost - coins)}`;
}

function getActionLabel(line: PickaxeShopLine, coins: number) {
  if (line.equipped) {
    return "EQUIPADA";
  }

  if (line.owned) {
    return "EQUIPAR";
  }

  if (line.locked) {
    return `LIBERA ${line.pickaxe.unlockDepth}m`;
  }

  return line.canBuy ? "COMPRAR" : `FALTAM ${formatNumber(line.pickaxe.cost - coins)}`;
}

function getPickaxeImageUrl(id: PickaxeId) {
  switch (id) {
    case "wood":
      return pickWoodUrl;
    case "stone":
      return pickStoneUrl;
    case "copper":
      return pickCopperUrl;
    case "iron":
      return pickIronUrl;
    case "gold":
      return pickGoldUrl;
    case "diamond":
      return pickDiamondUrl;
    case "obsidian":
      return pickObsidianUrl;
    case "ancientCrystal":
      return pickAncientCrystalUrl;
  }

  return pickMetalUrl;
}

function getPickaxeImageClass(id: PickaxeId) {
  return `pickaxe-image--${id}`;
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

function formatSpeedMultiplier(value: number) {
  return `${value.toFixed(2).replace(".", ",")}x`;
}

function formatCompactCardNumber(value: number) {
  return value.toLocaleString("pt-BR", { useGrouping: false });
}
