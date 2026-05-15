import Phaser from "phaser";
import type { InventorySaleSummary } from "../../game/economy/resourceSellValues";
import {
  getResourceMeta,
  getResourceTierLabel,
} from "../../game/inventory/resourceInventory";
import { createHudElement, createHudScope } from "../hud/domHud";

type VendorOverlaySnapshot = {
  coins: number;
  sale: InventorySaleSummary;
  saleBonusPercent: number;
  onSellAll: () => void;
  onClose: () => void;
};

export class VendorOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scope: HTMLDivElement;
  private readonly overlay: HTMLElement;
  private readonly walletValue: HTMLSpanElement;
  private readonly inventoryBody: HTMLDivElement;
  private readonly totalMeta: HTMLDivElement;
  private readonly totalValue: HTMLDivElement;
  private readonly note: HTMLDivElement;
  private readonly sellButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly handleKeyDown: (event: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-modal-scope--vendor", "modal");
    this.overlay = createHudElement("section", "game-modal-overlay");
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-label", "Posto de venda");

    const card = createHudElement("div", "game-modal-card game-modal-card--vendor");
    const accent = createHudElement("div", "game-modal-card__accent");
    const title = createHudElement("h2", "game-modal-card__title", "POSTO DE VENDA");
    const subtitle = createHudElement(
      "p",
      "game-modal-card__subtitle",
      "Troque o lote atual por moedas e volte para a mina mais preparado.",
    );

    const wallet = createHudElement("div", "game-modal-vendor-wallet");
    const walletLabel = createHudElement("span", "game-modal-vendor-wallet__label", "CARTEIRA");
    this.walletValue = createHudElement("span", "game-modal-vendor-wallet__value", "0 moedas");
    wallet.append(walletLabel, this.walletValue);

    const inventorySection = createHudElement("section", "game-modal-section");
    inventorySection.append(createHudElement("div", "game-modal-section__title", "LOTE ATUAL"));
    this.inventoryBody = createHudElement("div", "game-modal-vendor-list") as HTMLDivElement;
    inventorySection.append(this.inventoryBody);

    const totalSection = createHudElement("div", "game-modal-vendor-total");
    const totalCopy = createHudElement("div", "game-modal-vendor-total__copy");
    totalCopy.append(
      createHudElement("div", "game-modal-vendor-total__label", "TOTAL DA VENDA"),
    );
    this.totalMeta = createHudElement("div", "game-modal-vendor-total__meta", "0 itens no lote");
    totalCopy.append(this.totalMeta);
    this.totalValue = createHudElement("div", "game-modal-vendor-total__value", "0 moedas");
    totalSection.append(totalCopy, this.totalValue);

    this.note = createHudElement(
      "div",
      "game-modal-note",
      "O vendedor compra o carregamento inteiro de uma vez. Melhor voltar sempre com a mochila cheia.",
    ) as HTMLDivElement;

    const actions = createHudElement("div", "game-modal-actions");
    this.sellButton = createVendorButton("VENDER TUDO", "primary");
    this.closeButton = createVendorButton("FECHAR", "secondary");
    actions.append(this.sellButton, this.closeButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint",
      "Pressione ENTER para vender ou ESC para fechar o posto",
    );

    card.append(accent, title, subtitle, wallet, inventorySection, totalSection, this.note, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);

    this.handleKeyDown = (event) => {
      if (!this.isVisible || event.key !== "Enter" || this.sellButton.disabled) {
        return;
      }

      event.preventDefault();
      this.sellButton.click();
    };
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: VendorOverlaySnapshot) {
    this.renderSnapshot(snapshot);
    this.sellButton.onclick = snapshot.onSellAll;
    this.closeButton.onclick = snapshot.onClose;
    window.addEventListener("keydown", this.handleKeyDown);
    this.overlay.classList.add("is-open");

    if (!this.sellButton.disabled) {
      window.requestAnimationFrame(() => this.sellButton.focus({ preventScroll: true }));
    }
  }

  hide() {
    this.sellButton.onclick = null;
    this.closeButton.onclick = null;
    window.removeEventListener("keydown", this.handleKeyDown);
    this.overlay.classList.remove("is-open");
  }

  get isVisible() {
    return this.overlay.classList.contains("is-open");
  }

  private renderSnapshot(snapshot: VendorOverlaySnapshot) {
    const itemCount = snapshot.sale.lines.reduce((total, line) => total + line.quantity, 0);
    const averageValue = itemCount > 0 ? Math.round(snapshot.sale.totalCoins / itemCount) : 0;

    this.walletValue.textContent = `${formatCoins(snapshot.coins)} moedas`;
    this.totalValue.textContent = `${formatCoins(snapshot.sale.totalCoins)} moedas`;
    this.walletValue.title = `${formatCoins(snapshot.coins)} moedas na carteira`;
    this.totalValue.title = `${formatCoins(snapshot.sale.totalCoins)} moedas nesta venda`;
    const bonusLabel = snapshot.saleBonusPercent > 0
      ? ` · bônus +${formatCoins(snapshot.saleBonusPercent)}%`
      : "";
    this.note.textContent = snapshot.saleBonusPercent > 0
      ? `Bônus ativo: esta venda está rendendo +${formatCoins(snapshot.saleBonusPercent)}%.`
      : "O vendedor compra o carregamento inteiro de uma vez. Melhor voltar sempre com a mochila cheia.";
    this.totalMeta.textContent =
      itemCount > 0
        ? `${formatCoins(itemCount)} ${itemCount === 1 ? "item" : "itens"} no lote · média ${formatCoins(averageValue)}${bonusLabel}`
        : "0 itens no lote";
    this.totalMeta.title = itemCount > 0
      ? `${itemCount.toLocaleString("pt-BR")} itens no lote, média de ${formatCoins(averageValue)} moedas`
      : "Nenhum item no lote";
    this.sellButton.disabled = snapshot.sale.totalCoins <= 0;
    this.sellButton.textContent = snapshot.sale.totalCoins > 0 ? "VENDER TUDO" : "MOCHILA VAZIA";
    this.sellButton.title = snapshot.sale.totalCoins > 0
      ? `Vender todos os minérios por ${formatCoins(snapshot.sale.totalCoins)} moedas`
      : "A mochila não tem minérios para vender";
    this.sellButton.setAttribute("aria-label", this.sellButton.title);
    this.inventoryBody.replaceChildren();

    if (snapshot.sale.lines.length === 0) {
      this.inventoryBody.append(
        createHudElement(
          "div",
          "game-modal-vendor-empty",
          "Nenhum minério na mochila ainda. Desça, minere e volte para vender.",
        ),
      );
      return;
    }

    const bestResource = snapshot.sale.lines.reduce(
      (best, line) => line.totalPrice > best.totalPrice ? line : best,
      snapshot.sale.lines[0],
    ).resource;

    for (const line of snapshot.sale.lines) {
      const row = createHudElement("div", "game-modal-vendor-row");
      const meta = getResourceMeta(line.resource);
      row.classList.toggle("is-best", line.resource === bestResource);
      row.style.setProperty("--resource-accent", meta.accent);
      row.setAttribute(
        "title",
        `${line.label}: ${formatCoins(line.quantity)} itens, ${formatCoins(line.totalPrice)} moedas`,
      );
      const marker = createHudElement("div", "game-modal-vendor-row__marker");
      const label = createHudElement("div", "game-modal-vendor-row__label");
      label.append(
        createHudElement("span", "game-modal-vendor-row__name", line.label),
        createHudElement(
          "span",
          "game-modal-vendor-row__tier",
          line.resource === bestResource
            ? `${getResourceTierLabel(meta.tier)} · melhor lote`
            : getResourceTierLabel(meta.tier),
        ),
      );
      const unit = createHudElement(
        "div",
        "game-modal-vendor-row__unit",
        `${formatCoins(line.unitPrice)} cada`,
      );
      const quantity = createHudElement(
        "div",
        "game-modal-vendor-row__qty",
        `x${formatCoins(line.quantity)}`,
      );
      const total = createHudElement(
        "div",
        "game-modal-vendor-row__total",
        `${formatCoins(line.totalPrice)} moedas`,
      );
      row.append(marker, label, unit, quantity, total);
      this.inventoryBody.append(row);
    }
  }
}

function createVendorButton(label: string, tone: "primary" | "secondary") {
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

function formatCoins(value: number) {
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
