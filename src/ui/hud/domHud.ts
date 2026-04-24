import { PHASER_ROOT_ID } from "../../app/phaser/gameConfig";

export type HudDomIconKind = "missions" | "backpack" | "close" | "pickaxe" | "codex" | "combo";
export type HudDomLayer = "hud" | "modal";

const HUD_ROOT_ID = "game-hud-root";
const MODAL_ROOT_ID = "game-modal-root";

function ensureLayerRoot(rootId: string) {
  let root = document.getElementById(rootId) as HTMLDivElement | null;

  if (root) {
    return root;
  }

  const phaserRoot = document.getElementById(PHASER_ROOT_ID) ?? document.body;
  root = document.createElement("div");
  root.id = rootId;
  phaserRoot.append(root);
  return root;
}

export function ensureHudDomRoot() {
  return ensureLayerRoot(HUD_ROOT_ID);
}

export function ensureHudModalRoot() {
  return ensureLayerRoot(MODAL_ROOT_ID);
}

export function createHudScope(className: string, layer: HudDomLayer = "hud") {
  const scope = document.createElement("div");
  scope.className = `game-hud-scope ${className}`;
  (layer === "modal" ? ensureHudModalRoot() : ensureHudDomRoot()).append(scope);
  return scope;
}

export function createHudElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (typeof text === "string") {
    element.textContent = text;
  }

  return element;
}

export function setHudRect(
  element: HTMLElement,
  rect: { x: number; y: number; width: number; height: number },
) {
  element.style.left = `${Math.round(rect.x)}px`;
  element.style.top = `${Math.round(rect.y)}px`;
  element.style.width = `${Math.round(rect.width)}px`;
  element.style.height = `${Math.round(rect.height)}px`;
}

export function createHudIcon(kind: HudDomIconKind, extraClass = "") {
  const icon = document.createElement("span");
  icon.className = `game-hud-icon game-hud-icon--${kind} ${extraClass}`.trim();
  icon.innerHTML = getHudIconSvg(kind);
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function getHudIconSvg(kind: HudDomIconKind) {
  switch (kind) {
    case "missions":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <rect x="4" y="3.5" width="16" height="17" rx="1.5"></rect>
          <path d="M8 8h8M8 12h8M8 16h6"></path>
        </svg>
      `;
    case "backpack":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <path d="M8 8V6a4 4 0 0 1 8 0v2"></path>
          <path d="M6 8h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Z"></path>
          <path d="M9 12h6"></path>
        </svg>
      `;
    case "close":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square">
          <path d="M6 6l12 12M18 6 6 18"></path>
        </svg>
      `;
    case "pickaxe":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path
            d="M13 8l-9.383 9.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l9.407 -9.385"
            stroke="#8c5c35"
            stroke-width="3.2"
          ></path>
          <path
            d="M9 3h4.586a1 1 0 0 1 .707 .293l6.414 6.414a1 1 0 0 1 .293 .707v4.586a2 2 0 1 1 -4 0v-3l-5 -5h-3a2 2 0 1 1 0 -4"
            stroke="#d8dfeb"
            stroke-width="2.7"
          ></path>
          <path d="M11 4h2.5" stroke="#f7f9ff" stroke-width="1"></path>
        </svg>
      `;
    case "codex":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 0-2 2V4Z"></path>
          <path d="M8 8h7M8 12h7"></path>
        </svg>
      `;
    case "combo":
      return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <circle cx="12" cy="12" r="6"></circle>
          <path d="M12 2v4M22 12h-4M12 22v-4M2 12h4"></path>
        </svg>
      `;
  }
}
