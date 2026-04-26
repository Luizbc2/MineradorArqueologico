import Phaser from "phaser";
import type { InventorySaleSummary } from "../../game/economy/resourceSellValues";
import { createHudElement, createHudScope } from "../hud/domHud";

type VendorOverlaySnapshot = {
  coins: number;
  sale: InventorySaleSummary;
  onSellAll: () => void;
  onClose: () => void;
};

export class VendorOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private readonly scope: HTMLDivElement;
  private readonly overlay: HTMLElement;
  private readonly walletValue: HTMLSpanElement;
  private readonly inventoryBody: HTMLDivElement;
  private readonly totalValue: HTMLDivElement;
  private readonly sellButton: HTMLButtonElement;
  private readonly closeButton: HTMLButtonElement;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setVisible(false);

    this.scope = createHudScope("game-modal-scope--vendor", "modal");
    this.overlay = createHudElement("section", "game-modal-overlay");

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
    totalSection.append(
      createHudElement("div", "game-modal-vendor-total__label", "TOTAL DA VENDA"),
    );
    this.totalValue = createHudElement("div", "game-modal-vendor-total__value", "0 moedas");
    totalSection.append(this.totalValue);

    const note = createHudElement(
      "div",
      "game-modal-note",
      "O vendedor compra o carregamento inteiro de uma vez. Melhor voltar sempre com a mochila cheia.",
    );

    const actions = createHudElement("div", "game-modal-actions");
    this.sellButton = createVendorButton("VENDER TUDO", "primary");
    this.closeButton = createVendorButton("FECHAR", "secondary");
    actions.append(this.sellButton, this.closeButton);

    const hint = createHudElement(
      "div",
      "game-modal-hint",
      "Pressione ESC para fechar o posto de venda",
    );

    card.append(accent, title, subtitle, wallet, inventorySection, totalSection, note, actions, hint);
    this.overlay.append(card);
    this.scope.append(this.overlay);
  }

  getRoot() {
    return this.container;
  }

  show(snapshot: VendorOverlaySnapshot) {
    this.renderSnapshot(snapshot);
    this.sellButton.onclick = snapshot.onSellAll;
    this.closeButton.onclick = snapshot.onClose;
    this.overlay.classList.add("is-open");
  }

  hide() {
    this.sellButton.onclick = null;
    this.closeButton.onclick = null;
    this.overlay.classList.remove("is-open");
  }

  get isVisible() {
    return this.overlay.classList.contains("is-open");
  }

  private renderSnapshot(snapshot: VendorOverlaySnapshot) {
    this.walletValue.textContent = `${formatCoins(snapshot.coins)} moedas`;
    this.totalValue.textContent = `${formatCoins(snapshot.sale.totalCoins)} moedas`;
    this.sellButton.disabled = snapshot.sale.totalCoins <= 0;
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

    for (const line of snapshot.sale.lines) {
      const row = createHudElement("div", "game-modal-vendor-row");
      const label = createHudElement("div", "game-modal-vendor-row__label", line.label);
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
      row.append(label, unit, quantity, total);
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
  return button;
}

function formatCoins(value: number) {
  return value.toLocaleString("pt-BR");
}
