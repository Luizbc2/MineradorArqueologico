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
  private readonly pickaxeCollectionValue: HTMLSpanElement;
  private readonly upgradeInvestmentValue: HTMLSpanElement;
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
  private readonly handleKeyDown: (event: KeyboardEvent) => void;
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

    const collection = createHudElement("div", "game-modal-workshop-meta__item");
    collection.append(createHudElement("span", "", "COLEÇÃO"));
    this.pickaxeCollectionValue = createHudElement("strong", "", "1/1");
    collection.append(this.pickaxeCollectionValue);

    const investment = createHudElement("div", "game-modal-workshop-meta__item");
    investment.append(createHudElement("span", "", "UPGRADES"));
    this.upgradeInvestmentValue = createHudElement("strong", "", "0");
    investment.append(this.upgradeInvestmentValue);
    meta.append(coins, collection, investment, depth);

    const tabs = createHudElement("div", "game-modal-workshop-tabs");
    tabs.setAttribute("role", "tablist");
    this.pickaxesTab = createWorkshopTabButton("PICARETAS");
    this.upgradesTab = createWorkshopTabButton("UPGRADES");
    tabs.append(this.pickaxesTab, this.upgradesTab);

    this.pickaxesPanel = createHudElement("div", "game-modal-workshop-panel") as HTMLDivElement;
    this.pickaxesPanel.setAttribute("role", "tabpanel");
    const carousel = createHudElement("div", "game-modal-workshop-carousel");
    this.previousButton = createArrowButton("<");
    this.carouselBody = createHudElement("div", "game-modal-workshop-carousel__body") as HTMLDivElement;
    this.nextButton = createArrowButton(">");
    carousel.append(this.previousButton, this.carouselBody, this.nextButton);

    this.pageText = createHudElement("div", "game-modal-workshop-page", "1/1");
    this.pageText.setAttribute("role", "status");
    this.pageText.setAttribute("aria-live", "polite");
    this.pickaxesPanel.append(carousel, this.pageText);

    this.upgradesPanel = createHudElement("div", "game-modal-workshop-panel") as HTMLDivElement;
    this.upgradesPanel.setAttribute("role", "tabpanel");
    this.upgradesBody = createHudElement("div", "game-modal-upgrade-list") as HTMLDivElement;
    this.upgradesPanel.append(this.upgradesBody);

    const actions = createHudElement("div", "game-modal-actions game-modal-actions--center");
    this.closeButton = createWorkshopButton("FECHAR", "secondary");
    actions.append(this.closeButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint game-modal-hint--center",
      "Use setas para trocar página, TAB para trocar aba e E ou ESC para sair",
    );

    card.append(accent, title, meta, tabs, this.pickaxesPanel, this.upgradesPanel, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);

    this.pickaxesTab.onclick = () => this.setActiveTab("pickaxes");
    this.upgradesTab.onclick = () => this.setActiveTab("upgrades");
    this.previousButton.onclick = () => this.changePage(-1);
    this.nextButton.onclick = () => this.changePage(1);
    this.handleKeyDown = (event) => {
      if (!this.isVisible) {
        return;
      }

      if (event.key === "ArrowLeft" && this.activeTab === "pickaxes") {
        event.preventDefault();
        this.changePage(-1);
      } else if (event.key === "ArrowRight" && this.activeTab === "pickaxes") {
        event.preventDefault();
        this.changePage(1);
      } else if (event.key === "Home" && this.activeTab === "pickaxes") {
        event.preventDefault();
        this.goToPage(0);
      } else if (event.key === "End" && this.activeTab === "pickaxes") {
        event.preventDefault();
        if (this.snapshot) {
          this.goToPage(this.getLastPage(this.snapshot));
        }
      } else if (event.key === "Tab") {
        event.preventDefault();
        this.setActiveTab(this.activeTab === "pickaxes" ? "upgrades" : "pickaxes");
      }
    };
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
    window.addEventListener("keydown", this.handleKeyDown);
    this.overlay.classList.add("is-open");
  }

  hide() {
    this.closeButton.onclick = null;
    window.removeEventListener("keydown", this.handleKeyDown);
    this.overlay.classList.remove("is-open");
  }

  get isVisible() {
    return this.overlay.classList.contains("is-open");
  }

  private changePage(direction: -1 | 1) {
    if (!this.snapshot) {
      return;
    }

    this.goToPage(this.pageIndex + direction);
  }

  private goToPage(pageIndex: number) {
    if (!this.snapshot) {
      return;
    }

    this.pageIndex = Phaser.Math.Clamp(pageIndex, 0, this.getLastPage(this.snapshot));
    this.renderSnapshot(this.snapshot);
  }

  private renderSnapshot(snapshot: OverlaySnapshot) {
    const ownedPickaxes = snapshot.pickaxes.filter((line) => line.owned).length;
    const upgradeLevels = snapshot.upgrades.reduce((total, line) => total + line.level, 0);

    this.coinsValue.textContent = formatNumber(snapshot.coins);
    this.pickaxeCollectionValue.textContent = `${ownedPickaxes}/${snapshot.pickaxes.length}`;
    this.upgradeInvestmentValue.textContent = formatNumber(upgradeLevels);
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
    this.pageText.title = `Página ${this.pageIndex + 1} de ${totalPages}`;
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
    this.pickaxesTab.setAttribute("aria-selected", String(this.activeTab === "pickaxes"));
    this.upgradesTab.setAttribute("aria-selected", String(this.activeTab === "upgrades"));
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
  image.alt = line.pickaxe.name;
  image.draggable = false;
  artWrap.append(image);

  const stats = createHudElement("div", "game-modal-pickaxe-card__stats");
  stats.append(
    createStat("FORÇA", formatCompactCardNumber(line.pickaxe.power)),
    createStat("VEL.", formatSpeedMultiplier(line.pickaxe.baseSpeed)),
    createStat("PREÇO", formatCompactCardNumber(line.pickaxe.cost)),
  );

  const action = createWorkshopButton(getActionLabel(line, snapshot), line.canBuy || line.owned ? "primary" : "secondary");
  action.disabled = line.locked || line.equipped || (!line.owned && !line.canBuy);
  action.title = action.textContent ?? line.pickaxe.name;
  action.setAttribute(
    "aria-label",
    line.equipped
      ? `${line.pickaxe.name} equipada`
      : line.owned
        ? `Equipar ${line.pickaxe.name}`
        : `Comprar ${line.pickaxe.name}`,
  );
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
  const actionLabel = label === "<" ? "Página anterior" : "Próxima página";
  button.title = actionLabel;
  button.setAttribute("aria-label", actionLabel);
  return button;
}

function createWorkshopTabButton(label: string) {
  const button = createHudElement("button", "game-modal-workshop-tab") as HTMLButtonElement;
  button.type = "button";
  button.setAttribute("role", "tab");
  button.textContent = label;
  button.setAttribute("aria-label", `Abrir aba ${label.toLowerCase()}`);
  return button;
}

function createWorkshopButton(label: string, tone: "primary" | "secondary") {
  const button = createHudElement(
    "button",
    `game-modal-button game-modal-button--${tone}`,
  ) as HTMLButtonElement;
  button.type = "button";
  button.textContent = label;
  button.title = label;
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
  action.title = action.textContent ?? line.upgrade.name;
  action.setAttribute(
    "aria-label",
    line.cost === null
      ? `${line.upgrade.name} completo`
      : `Comprar upgrade ${line.upgrade.name}`,
  );
  action.onclick = () => snapshot.onUpgradeBuy(line.upgrade.id);

  row.append(copy, meta, action);
  return row;
}

function formatUpgradeCurrentEffect(line: UpgradeShopLine) {
  const total = line.upgrade.effectPerLevel * line.level;

  if (line.upgrade.effectKind === "flatPower") {
    return `Atual: +${formatNumber(total)} força`;
  }

  if (line.upgrade.effectKind === "backpackCapacity") {
    return `Atual: +${formatNumber(total)} espaços`;
  }

  if (line.upgrade.effectKind === "saleMultiplier") {
    return `Atual: +${Math.round(total * 100)}% venda`;
  }

  if (line.upgrade.effectKind === "chestCoinMultiplier") {
    return `Atual: +${Math.round(total * 100)}% moedas de baú`;
  }

  if (line.upgrade.effectKind === "extraDropChance") {
    return `Atual: ${Math.round(total * 100)}% minério extra`;
  }

  if (line.upgrade.effectKind === "comboWindowBonus") {
    return `Atual: +${total.toFixed(1).replace(".", ",")}s combo`;
  }

  if (line.upgrade.effectKind === "moveTempoBonus") {
    return `Atual: +${Math.round(total * 100)}% passo`;
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

  if (line.upgrade.effectKind === "backpackCapacity") {
    return `Próximo: +${formatNumber(line.upgrade.effectPerLevel)} espaços por nível`;
  }

  if (line.upgrade.effectKind === "saleMultiplier") {
    return `Próximo: +${Math.round(line.upgrade.effectPerLevel * 100)}% venda por nível`;
  }

  if (line.upgrade.effectKind === "chestCoinMultiplier") {
    return `Próximo: +${Math.round(line.upgrade.effectPerLevel * 100)}% moedas de baú por nível`;
  }

  if (line.upgrade.effectKind === "extraDropChance") {
    return `Próximo: +${Math.round(line.upgrade.effectPerLevel * 100)}% chance por nível`;
  }

  if (line.upgrade.effectKind === "comboWindowBonus") {
    return `Próximo: +${line.upgrade.effectPerLevel.toFixed(1).replace(".", ",")}s combo por nível`;
  }

  if (line.upgrade.effectKind === "moveTempoBonus") {
    return `Próximo: +${Math.round(line.upgrade.effectPerLevel * 100)}% passo por nível`;
  }

  return `Próximo: +${Math.round(line.upgrade.effectPerLevel * 100)}% velocidade por nível`;
}

function getUpgradeActionLabel(line: UpgradeShopLine, coins: number) {
  if (line.cost === null) {
    return "MÁXIMO";
  }

  return line.canBuy ? "COMPRAR" : `FALTAM ${formatNumber(line.cost - coins)} MOEDAS`;
}

function getActionLabel(line: PickaxeShopLine, snapshot: OverlaySnapshot) {
  if (line.equipped) {
    return "EQUIPADA";
  }

  if (line.owned) {
    return "EQUIPAR";
  }

  if (line.locked) {
    return `FALTAM ${formatNumber(line.pickaxe.unlockDepth - snapshot.maxDepthReached)}m`;
  }

  return line.canBuy ? "COMPRAR" : `FALTAM ${formatNumber(line.pickaxe.cost - snapshot.coins)} MOEDAS`;
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
    case "fossil":
      return pickAncientCrystalUrl;
    case "prismatic":
      return pickDiamondUrl;
    case "galactic":
      return pickAncientCrystalUrl;
  }

  return pickMetalUrl;
}

function getPickaxeImageClass(id: PickaxeId) {
  return `pickaxe-image--${id}`;
}

function formatNumber(value: number) {
  const rounded = Math.max(0, Math.floor(value));

  if (rounded >= 1_000_000) {
    return `${formatCompactDecimal(rounded / 1_000_000)}m`;
  }

  if (rounded >= 10_000) {
    return `${formatCompactDecimal(rounded / 1_000)}k`;
  }

  return rounded.toLocaleString("pt-BR");
}

function formatSpeedMultiplier(value: number) {
  return `${value.toFixed(2).replace(".", ",")}x`;
}

function formatCompactCardNumber(value: number) {
  return value.toLocaleString("pt-BR", { useGrouping: false });
}

function formatCompactDecimal(value: number) {
  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  });
}
