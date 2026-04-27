import { snapUi, uiSpace } from "../theme/gameTheme";

export type HudRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type HudLayout = {
  mode: "wide" | "tight";
  margin: number;
  gap: number;
  panelPadding: number;
  compact: boolean;
  tight: boolean;
  statusDepth: HudRect;
  statusPickaxe: HudRect;
  statusCoins: HudRect;
  statusRail: HudRect;
  missionButton: HudRect;
  missionPanel: HudRect;
  backpackButton: HudRect;
  backpackPanel: HudRect;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getHudLayout(viewportWidth: number, viewportHeight: number): HudLayout {
  const width = Math.max(360, snapUi(viewportWidth));
  const height = Math.max(420, snapUi(viewportHeight));
  const tight = width < 880 || height < 660;
  const compact = width < 1280 || height < 860;
  const margin = width < 560 ? uiSpace.md : 20;
  const gap = tight ? uiSpace.xs : uiSpace.sm;
  const panelPadding = tight ? uiSpace.md : 20;

  const statusCardWidth = width < 520 ? 128 : 144;
  const statusCardHeight = 64;
  const statusCoinsInline = width >= 700;
  const railHeight = statusCardHeight;
  const railWidth = statusCardWidth * 2 + gap;
  const statusCoinsX = statusCoinsInline ? margin + (statusCardWidth + gap) * 2 : margin;
  const statusCoinsY = statusCoinsInline ? margin : margin + statusCardHeight + gap;

  const buttonWidth = width < 560 ? 140 : 156;
  const buttonHeight = 48;
  const availablePanelWidth = width - margin * 2;
  const missionPanelWidth = snapUi(clamp(availablePanelWidth * 0.32, width < 600 ? 320 : 420, 480));
  const backpackPanelWidth = snapUi(clamp(availablePanelWidth * 0.28, width < 600 ? 320 : 360, 440));
  const missionPanelHeight = tight ? 360 : compact ? 392 : 408;
  const backpackPanelHeight = tight ? 320 : compact ? 344 : 368;

  const missionButton = {
    x: width - margin - buttonWidth,
    y: margin,
    width: buttonWidth,
    height: buttonHeight,
  };

  const missionPanel = {
    x: width - margin - missionPanelWidth,
    y: missionButton.y + missionButton.height + gap,
    width: Math.min(missionPanelWidth, availablePanelWidth),
    height: Math.min(missionPanelHeight, height - margin * 2 - buttonHeight - gap),
  };

  const backpackButton = {
    x: width - margin - buttonWidth,
    y: height - margin - buttonHeight,
    width: buttonWidth,
    height: buttonHeight,
  };

  const backpackPanel = {
    x: width - margin - backpackPanelWidth,
    y: backpackButton.y - gap - backpackPanelHeight,
    width: Math.min(backpackPanelWidth, availablePanelWidth),
    height: Math.min(backpackPanelHeight, height - margin * 2 - buttonHeight - gap),
  };

  return {
    mode: tight ? "tight" : "wide",
    margin,
    gap,
    panelPadding,
    compact,
    tight,
    statusDepth: {
      x: margin,
      y: margin,
      width: statusCardWidth,
      height: statusCardHeight,
    },
    statusPickaxe: {
      x: margin + statusCardWidth + gap,
      y: margin,
      width: statusCardWidth,
      height: statusCardHeight,
    },
    statusCoins: {
      x: statusCoinsX,
      y: statusCoinsY,
      width: statusCardWidth,
      height: statusCardHeight,
    },
    statusRail: {
      x: margin,
      y: height - margin - railHeight,
      width: railWidth,
      height: railHeight,
    },
    missionButton,
    missionPanel,
    backpackButton,
    backpackPanel,
  };
}
