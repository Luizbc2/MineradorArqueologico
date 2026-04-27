import Phaser from "phaser";

export const gameTheme = {
  fonts: {
    display: '"Sora", "Segoe UI", sans-serif',
    body: '"Sora", "Segoe UI", sans-serif',
  },
  colors: {
    bgTop: 0x060a12,
    bgMid: 0x0c1323,
    bgBottom: 0x130d0a,
    caveGlow: 0x2b6cb0,
    ember: 0xff8b4d,
    accent: 0xe7bd63,
    accentSoft: 0xf7d78d,
    accentCool: 0x8eced0,
    success: 0x7ac98f,
    warning: 0xe59f52,
    danger: 0xff7a7a,
    panel: 0x221b15,
    panelRaised: 0x31261d,
    panelDeep: 0x14100c,
    border: 0x8b734f,
    borderSoft: 0x564633,
    coal: 0x99a5b3,
    iron: 0xd49a63,
    gold: 0xf3c55d,
    diamond: 0x89dff5,
    obsidian: 0xb7a3f2,
    crystal: 0xd9c5ff,
    text: "#f5efdf",
    textMuted: "#d3c4ad",
    textSoft: "#ab987c",
    textDark: "#15110d",
  },
} as const;

export const uiSpace = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export function snapUi(value: number) {
  return Math.round(value);
}

export function getDevicePixelRatio() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Phaser.Math.Clamp(window.devicePixelRatio || 1, 1, 4);
}

export function getGameCanvasResolution() {
  return getDevicePixelRatio();
}

export function getGameTextResolution() {
  return 4;
}

type PanelChromeOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor?: number;
  alpha?: number;
};

export function createPanelChrome(
  scene: Phaser.Scene,
  options: PanelChromeOptions,
) {
  const accentColor = options.accentColor ?? gameTheme.colors.accent;
  const alpha = options.alpha ?? 0.96;

  const shadow = scene.add.rectangle(
    options.x + 8,
    options.y + 10,
    options.width,
    options.height,
    0x02050a,
    0.42,
  );
  shadow.setOrigin(0);

  const body = scene.add.rectangle(
    options.x,
    options.y,
    options.width,
    options.height,
    gameTheme.colors.panel,
    alpha,
  );
  body.setOrigin(0);
  body.setStrokeStyle(2, gameTheme.colors.border, 1);

  const inset = scene.add.rectangle(
    options.x + 6,
    options.y + 6,
    options.width - 12,
    options.height - 12,
    gameTheme.colors.panelRaised,
    0.25,
  );
  inset.setOrigin(0);
  inset.setStrokeStyle(1, gameTheme.colors.borderSoft, 0.7);

  const topLine = scene.add.rectangle(
    options.x + 12,
    options.y + 10,
    options.width - 24,
    5,
    accentColor,
    0.95,
  );
  topLine.setOrigin(0);

  const glow = scene.add.rectangle(
    options.x + 12,
    options.y + 15,
    options.width - 24,
    14,
    accentColor,
    0.08,
  );
  glow.setOrigin(0);

  return [shadow, body, inset, topLine, glow];
}

type GameTextStyleOptions = {
  color?: string;
  fontSize?: string;
  fontStyle?: string;
  align?: "left" | "center" | "right";
  wordWrapWidth?: number;
  strokeThickness?: number;
  family?: "display" | "body";
  letterSpacing?: number;
  resolution?: number;
};

export function makeGameTextStyle(options: GameTextStyleOptions = {}): Phaser.Types.GameObjects.Text.TextStyle {
  const strokeThickness = options.strokeThickness ?? 0;

  return {
    color: options.color ?? gameTheme.colors.text,
    fontFamily:
      options.family === "display"
        ? gameTheme.fonts.display
        : gameTheme.fonts.body,
    fontSize: options.fontSize ?? "18px",
    fontStyle: options.fontStyle,
    align: options.align,
    wordWrap: options.wordWrapWidth
      ? { width: snapUi(options.wordWrapWidth), useAdvancedWrap: true }
      : undefined,
    stroke: strokeThickness > 0 ? "#120d09" : undefined,
    strokeThickness,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    letterSpacing: options.letterSpacing,
    resolution: options.resolution ?? getGameTextResolution(),
  };
}
