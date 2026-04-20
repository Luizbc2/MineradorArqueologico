import Phaser from "phaser";

export const gameTheme = {
  fonts: {
    display: '"Oxanium", "Segoe UI", sans-serif',
    body: '"Rajdhani", "Segoe UI", sans-serif',
  },
  colors: {
    bgTop: 0x060a12,
    bgMid: 0x0c1323,
    bgBottom: 0x130d0a,
    caveGlow: 0x2b6cb0,
    ember: 0xff8b4d,
    accent: 0xffd166,
    accentSoft: 0xffe6a8,
    accentCool: 0x7be0d6,
    panel: 0x101a2a,
    panelRaised: 0x172437,
    panelDeep: 0x0a111b,
    border: 0x315072,
    borderSoft: 0x243a55,
    text: "#f4f7fb",
    textMuted: "#b6c4d8",
    textSoft: "#8ea2bc",
    textDark: "#08101a",
  },
} as const;

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
};

export function makeGameTextStyle(options: GameTextStyleOptions = {}): Phaser.Types.GameObjects.Text.TextStyle {
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
      ? { width: options.wordWrapWidth, useAdvancedWrap: true }
      : undefined,
    stroke: "#08111b",
    strokeThickness: options.strokeThickness ?? 3,
  };
}
