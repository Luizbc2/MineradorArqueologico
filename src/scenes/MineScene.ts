import Phaser from "phaser";
import {
  createArchaeologyDeck,
} from "../game/archaeology/archaeologyCards";
import {
  canAffordPickaxeUpgrade,
  getPickaxeUpgradeCost,
} from "../game/progression/pickaxeUpgrade";
import {
  createExpeditionProgression,
} from "../game/progression/expeditionGoals";
import type { ExpeditionProgressionSnapshot } from "../game/progression/expeditionGoals";
import {
  createResourceInventory,
  getResourceFromTile,
  getResourceMeta,
  getResourceTierLabel,
} from "../game/inventory/resourceInventory";
import { MineAudioDirector } from "../game/audio/MineAudioDirector";
import { PlayerMiner } from "../game/player/PlayerMiner";
import { ExpeditionGoalsPanel } from "../ui/hud/ExpeditionGoalsPanel";
import { MineHud } from "../ui/hud/MineHud";
import { ArchaeologyCardOverlay } from "../ui/overlays/ArchaeologyCardOverlay";
import { UpgradeOverlay } from "../ui/overlays/UpgradeOverlay";
import { generateWorld } from "../game/world/generateWorld";
import {
  PLAYER_SPAWN_TILE,
  SURFACE_ROW,
  TILE_SIZE,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_HEIGHT_PX,
  WORLD_HEIGHT_TILES,
  WORLD_WIDTH_PX,
} from "../game/world/constants";
import { tilePalette } from "../game/world/tilePalette";
import { tileDefinitions } from "../game/world/tileDefinitions";
import type { TileKind, WorldGrid } from "../game/world/types";
import type { ResourceInventory, ResourceKind } from "../game/inventory/resourceInventory";
import { gameTheme, makeGameTextStyle } from "../ui/theme/gameTheme";

type MiningTarget = {
  x: number;
  y: number;
  progress: number;
  required: number;
  impacts: number;
};

type FixedUiElement =
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Text;

const SURFACE_RETURN_TILE = {
  x: PLAYER_SPAWN_TILE.x,
  y: SURFACE_ROW - 1,
} as const;

export class MineScene extends Phaser.Scene {
  private worldGrid: WorldGrid = [];
  private readonly archaeologyDeck = createArchaeologyDeck();
  private readonly expeditionProgression = createExpeditionProgression();
  private progressionSnapshot: ExpeditionProgressionSnapshot = this.expeditionProgression.getSnapshot();
  private inventory: ResourceInventory = createResourceInventory();
  private energy = 100;
  private pickaxeLevel = 1;
  private groundLayer?: Phaser.GameObjects.Graphics;
  private groundDirty = true;
  private lastGroundWindow?: {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
  };
  private atmosphereLayer?: Phaser.GameObjects.Graphics;
  private effectLayer?: Phaser.GameObjects.Graphics;
  private screenFlash?: Phaser.GameObjects.Rectangle;
  private surfacePadLayer?: Phaser.GameObjects.Graphics;
  private surfaceButton?: Phaser.GameObjects.Rectangle;
  private surfaceButtonLabel?: Phaser.GameObjects.Text;
  private surfaceStatusText?: Phaser.GameObjects.Text;
  private audioDirector?: MineAudioDirector;
  private goalsPanel?: ExpeditionGoalsPanel;
  private hud?: MineHud;
  private archaeologyOverlay?: ArchaeologyCardOverlay;
  private upgradeOverlay?: UpgradeOverlay;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private digKeys?: {
    down: Phaser.Input.Keyboard.Key;
    dig: Phaser.Input.Keyboard.Key;
  };
  private interactKey?: Phaser.Input.Keyboard.Key;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private upgradeKey?: Phaser.Input.Keyboard.Key;
  private surfaceKey?: Phaser.Input.Keyboard.Key;
  private player?: PlayerMiner;
  private miningTarget?: MiningTarget;
  private rewardComboCount = 0;
  private rewardComboTimer = 0;
  private rewardComboWindow = 2.6;
  private rewardLabel = "Mina fria";
  private rewardColor: string = gameTheme.colors.textSoft;
  private manualZoomOffset = 0;
  private readonly zoomStep = 0.04;
  private readonly minCameraZoom = 1.05;
  private readonly maxCameraZoom = 1.38;
  private readonly zoomSmoothing = 10;
  private surfaceReturnLocked = false;
  private lastAppliedDepth = -1;
  private readonly fixedUiElements = new Map<
    FixedUiElement,
    {
      x: number;
      y: number;
      scaleX: number;
      scaleY: number;
    }
  >();

  constructor() {
    super("mine");
  }

  private get viewportWidth() {
    return this.scale.width || this.cameras.main.width || VIEWPORT_WIDTH;
  }

  private get viewportHeight() {
    return this.scale.height || this.cameras.main.height || VIEWPORT_HEIGHT;
  }

  private getGameplayZoom() {
    const widthProgress = Phaser.Math.Clamp((this.viewportWidth - VIEWPORT_WIDTH) / 1280, 0, 1);
    const heightProgress = Phaser.Math.Clamp((this.viewportHeight - VIEWPORT_HEIGHT) / 720, 0, 1);
    const zoomProgress = Math.max(widthProgress, heightProgress);

    return Phaser.Math.Linear(1, 1.05, zoomProgress);
  }

  private getTargetCameraZoom() {
    return Phaser.Math.Clamp(
      this.getGameplayZoom() + this.manualZoomOffset,
      this.getMinimumCameraZoom(),
      this.maxCameraZoom,
    );
  }

  private getMinimumCameraZoom() {
    const widthBoundZoom = this.viewportWidth / WORLD_WIDTH_PX;
    const heightBoundZoom = this.viewportHeight / WORLD_HEIGHT_PX;

    return Math.max(this.minCameraZoom, widthBoundZoom, heightBoundZoom);
  }

  create() {
    this.worldGrid = generateWorld();
    this.prepareSurfaceSafeZone();
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);
    this.cameras.main.setBackgroundColor("#06080f");

    this.drawBackdrop();
    this.drawWorldGrid(true);
    this.drawAtmosphere();
    this.drawSurfaceSafeZone();
    this.drawDepthGuides();
    this.createPlayer();
    this.createScreenFlash();
    this.createSurfaceReturnUi();
    this.createHud();
    this.createGoalsPanel();
    this.createArchaeologyOverlay();
    this.createUpgradeOverlay();
    this.createAudioDirector();
    this.progressionSnapshot = this.expeditionProgression.getSnapshot();

    if (this.player) {
      this.cameras.main.startFollow(this.player.sprite, true, 0.14, 0.18);
      this.applyCameraFraming();
    }

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.moveKeys = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as { left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key } | undefined;
    this.digKeys = this.input.keyboard?.addKeys({
      down: Phaser.Input.Keyboard.KeyCodes.S,
      dig: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as { down: Phaser.Input.Keyboard.Key; dig: Phaser.Input.Keyboard.Key } | undefined;
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.escapeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.upgradeKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.surfaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.input.keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.PLUS,
      Phaser.Input.Keyboard.KeyCodes.MINUS,
      Phaser.Input.Keyboard.KeyCodes.ZERO,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT,
      Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO,
    ]);
    this.input.keyboard?.on("keydown", this.handleSceneKeyDown, this);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
      this.input.keyboard?.off("keydown", this.handleSceneKeyDown, this);
    });
    this.handleResize(this.scale.gameSize);

    this.hideLegacyViewport();
    this.drawWorldGrid(true);
    this.game.events.emit("phaser:mine-ready");
  }

  update(_: number, delta: number) {
    if (!this.player) {
      return;
    }

    const deltaSeconds = delta / 1000;

    if (this.archaeologyOverlay?.isVisible) {
      if (Phaser.Input.Keyboard.JustDown(this.escapeKey!) || Phaser.Input.Keyboard.JustDown(this.interactKey!)) {
        this.closeArchaeologyOverlay();
      }
      this.finalizeFrame(deltaSeconds);
      return;
    }

    if (this.upgradeOverlay?.isVisible) {
      if (Phaser.Input.Keyboard.JustDown(this.escapeKey!) || Phaser.Input.Keyboard.JustDown(this.upgradeKey!)) {
        this.closeUpgradeOverlay();
      }
      this.finalizeFrame(deltaSeconds);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.surfaceKey!)) {
      if (this.tryReturnToSurface()) {
        this.finalizeFrame(deltaSeconds);
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.upgradeKey!)) {
      this.toggleUpgradeOverlay();
      this.finalizeFrame(deltaSeconds);
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey!)) {
      if (this.tryOpenNearbyChest()) {
        this.finalizeFrame(deltaSeconds);
        return;
      }
    }

    if (this.handleMining(deltaSeconds)) {
      this.finalizeFrame(deltaSeconds, { mining: true });
      return;
    }

    if (this.player.fallCooldown === 0 && this.canOccupy(this.player.position.x, this.player.position.y + 1)) {
      this.player.snapToTile({
        x: this.player.position.x,
        y: this.player.position.y + 1,
      });
      this.player.fallCooldown = 0.08;
      this.clearMiningTarget();
      this.finalizeFrame(deltaSeconds, { falling: true });
      return;
    }

    if (this.player.moveCooldown > 0) {
      this.finalizeFrame(deltaSeconds);
      return;
    }

    const moveTempoScale = 1 - this.progressionSnapshot.perks.moveTempoBonus;

    const leftPressed =
      this.cursors?.left.isDown || this.moveKeys?.left.isDown;
    const rightPressed =
      this.cursors?.right.isDown || this.moveKeys?.right.isDown;

    const nextDirection = leftPressed ? -1 : rightPressed ? 1 : 0;

    if (nextDirection === 0) {
      this.finalizeFrame(deltaSeconds);
      return;
    }

    const nextX = this.player.position.x + nextDirection;
    const nextY = this.player.position.y;

    if (!this.canOccupy(nextX, nextY)) {
      this.player.facing = nextDirection;
      this.player.moveCooldown = 0.08 * moveTempoScale;
      this.finalizeFrame(deltaSeconds);
      return;
    }

    this.player.facing = nextDirection;
    this.player.snapToTile({ x: nextX, y: nextY });
    this.player.moveCooldown = 0.11 * moveTempoScale;
    this.audioDirector?.playStep(this.player.position.y / WORLD_HEIGHT_TILES);
    this.finalizeFrame(deltaSeconds);
  }

  private finalizeFrame(
    deltaSeconds: number,
    state?: {
      mining?: boolean;
      falling?: boolean;
    },
  ) {
    if (!this.player) {
      return;
    }

    this.player.setMining(Boolean(state?.mining));
    this.player.setFalling(Boolean(state?.falling));
    this.player.update(deltaSeconds);
    this.updateCameraZoom(deltaSeconds);

    if (this.player.position.y !== this.lastAppliedDepth) {
      this.lastAppliedDepth = this.player.position.y;
      this.syncExpeditionProgress(this.expeditionProgression.applyDepth(this.player.position.y));
    }

    this.updateRewardLoop(deltaSeconds);
    this.audioDirector?.update(deltaSeconds, {
      depthRatio: this.player.position.y / WORLD_HEIGHT_TILES,
      atSurface: this.isAtSurface(),
      comboCount: this.rewardComboCount,
    });
    this.drawWorldGrid();
    this.updateSurfaceUi();
    this.updateHud();
  }

  private prepareSurfaceSafeZone() {
    const chamberTop = Math.max(1, PLAYER_SPAWN_TILE.y - 1);

    for (let y = chamberTop; y <= SURFACE_ROW - 1; y += 1) {
      const widthOffset = y <= PLAYER_SPAWN_TILE.y ? 2 : 4;
      const startX = SURFACE_RETURN_TILE.x - widthOffset;
      const endX = SURFACE_RETURN_TILE.x + widthOffset;

      for (let x = startX; x <= endX; x += 1) {
        if (this.worldGrid[y]?.[x]) {
          this.worldGrid[y][x] = { kind: "empty" };
        }
      }
    }

    for (let x = SURFACE_RETURN_TILE.x - 4; x <= SURFACE_RETURN_TILE.x + 4; x += 1) {
      if (this.worldGrid[SURFACE_ROW]?.[x]) {
        this.worldGrid[SURFACE_ROW][x] = { kind: "stone" };
      }
    }
  }

  private drawBackdrop() {
    const background = this.add.graphics();

    background.fillGradientStyle(
      gameTheme.colors.bgMid,
      gameTheme.colors.bgMid,
      gameTheme.colors.bgBottom,
      gameTheme.colors.bgBottom,
      1,
    );
    background.fillRect(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);

    background.fillStyle(gameTheme.colors.caveGlow, 0.08);
    background.fillCircle(120, 140, 220);
    background.fillStyle(gameTheme.colors.ember, 0.06);
    background.fillCircle(540, WORLD_HEIGHT_PX - 260, 260);

    background.fillStyle(0x1d3557, 0.16);
    background.fillRect(0, 0, WORLD_WIDTH_PX, SURFACE_ROW * TILE_SIZE);
  }

  private drawWorldGrid(force = false) {
    if (!this.groundLayer) {
      this.groundLayer = this.add.graphics();
    }

    const view = this.cameras.main.worldView;
    const nextWindow = {
      startX: Math.max(0, Math.floor(view.x / TILE_SIZE) - 1),
      endX: Math.min(this.worldGrid[0].length - 1, Math.ceil((view.x + view.width) / TILE_SIZE) + 1),
      startY: Math.max(0, Math.floor(view.y / TILE_SIZE) - 1),
      endY: Math.min(this.worldGrid.length - 1, Math.ceil((view.y + view.height) / TILE_SIZE) + 1),
    };

    if (
      !force &&
      !this.groundDirty &&
      this.lastGroundWindow &&
      this.lastGroundWindow.startX === nextWindow.startX &&
      this.lastGroundWindow.endX === nextWindow.endX &&
      this.lastGroundWindow.startY === nextWindow.startY &&
      this.lastGroundWindow.endY === nextWindow.endY
    ) {
      return;
    }

    this.lastGroundWindow = nextWindow;
    this.groundDirty = false;
    this.groundLayer.clear();
    const ground = this.groundLayer;

    for (let y = nextWindow.startY; y <= nextWindow.endY; y += 1) {
      for (let x = nextWindow.startX; x <= nextWindow.endX; x += 1) {
        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;
        const tile = this.worldGrid[y][x];

        if (tile.kind === "empty") {
          continue;
        }

        const depthTint =
          y < SURFACE_ROW ? 0.08 : Math.min(0.92, 0.3 + y / WORLD_HEIGHT_TILES / 1.8);
        this.drawTileMaterial(ground, tile.kind, tileX, tileY, x, y, depthTint);
      }
    }
  }

  private drawAtmosphere() {
    if (!this.atmosphereLayer) {
      this.atmosphereLayer = this.add.graphics();
    }

    this.atmosphereLayer.clear();
    const layer = this.atmosphereLayer;

    for (let row = SURFACE_ROW + 10; row < WORLD_HEIGHT_TILES; row += 24) {
      const y = row * TILE_SIZE + 16;
      const ratio = row / WORLD_HEIGHT_TILES;

      layer.fillStyle(gameTheme.colors.caveGlow, 0.02 + ratio * 0.03);
      layer.fillRect(44, y, WORLD_WIDTH_PX - 88, 40);

      if (row % 48 === 0) {
        layer.fillStyle(gameTheme.colors.ember, 0.015 + ratio * 0.02);
        layer.fillRect(88, y + 12, WORLD_WIDTH_PX - 176, 20);
      }
    }

  }

  private drawSurfaceSafeZone() {
    if (!this.surfacePadLayer) {
      this.surfacePadLayer = this.add.graphics();
    }

    this.surfacePadLayer.clear();
    const layer = this.surfacePadLayer;
    const startX = (SURFACE_RETURN_TILE.x - 4) * TILE_SIZE;
    const topY = SURFACE_ROW * TILE_SIZE - 10;
    const width = TILE_SIZE * 9;

    layer.fillStyle(0x113048, 0.38);
    layer.fillRoundedRect(startX - 10, topY - 16, width + 20, 44, 14);
    layer.fillStyle(gameTheme.colors.accentCool, 0.14);
    layer.fillRoundedRect(startX - 6, topY - 12, width + 12, 36, 12);
    layer.fillStyle(gameTheme.colors.accentSoft, 0.8);
    layer.fillRect(startX + 14, topY + 8, width - 28, 3);

    for (let index = 0; index < 3; index += 1) {
      const lightX = startX + 38 + index * 104;
      layer.fillStyle(gameTheme.colors.accentCool, 0.2);
      layer.fillCircle(lightX, topY + 10, 11);
      layer.fillStyle(0xdffffa, 0.95);
      layer.fillCircle(lightX, topY + 10, 4);
    }

    const label = this.add.text(
      startX + width / 2,
      topY - 30,
      "BASE SEGURA",
      makeGameTextStyle({
        family: "display",
        color: "#d9fff8",
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );
    label.setOrigin(0.5, 0);
    label.setAlpha(0.72);
  }

  private drawTileMaterial(
    ground: Phaser.GameObjects.Graphics,
    kind: TileKind,
    tileX: number,
    tileY: number,
    gridX: number,
    gridY: number,
    depthTint: number,
  ) {
    const material = tilePalette[kind];
    const variant = this.sampleTileVariant(gridX, gridY);
    const inset = kind === "chest" ? 3 : 1;
    const width = TILE_SIZE - inset * 2;

    ground.fillStyle(material.base, depthTint);
    ground.fillRect(tileX + inset, tileY + inset, width, width);

    ground.fillStyle(material.top, depthTint * 0.86);
    ground.fillRect(tileX + inset, tileY + inset, width, 4);

    ground.fillStyle(material.edge, depthTint * 0.84);
    ground.fillRect(tileX + inset, tileY + TILE_SIZE - 5, width, 4);

    if (kind === "dirt" || kind === "stone" || kind === "bedrock") {
      for (let dot = 0; dot < 3; dot += 1) {
        const px = tileX + 5 + ((variant + dot * 9) % 18);
        const py = tileY + 6 + ((variant * 3 + dot * 7) % 16);
        ground.fillStyle(material.detail, 0.12 + dot * 0.04);
        ground.fillRect(px, py, dot % 2 === 0 ? 2 : 1, 1);
      }
    }

    if (kind === "coal" || kind === "iron" || kind === "gold" || kind === "diamond") {
      for (let cluster = 0; cluster < 2; cluster += 1) {
        const px = tileX + 7 + ((variant + cluster * 7) % 14);
        const py = tileY + 8 + ((variant * 2 + cluster * 9) % 12);
        ground.fillStyle(material.detail, 0.85);
        ground.fillRect(px, py, 4, 3);
      }
    }

    if (kind === "gold" || kind === "diamond") {
      ground.fillStyle(material.top, 0.22);
      ground.fillRect(tileX + 6, tileY + 6, 20, 20);
    }

    if (kind === "chest") {
      ground.fillStyle(material.top, 1);
      ground.fillRect(tileX + 4, tileY + 6, 24, 16);
      ground.fillStyle(material.edge, 1);
      ground.fillRect(tileX + 4, tileY + 14, 24, 3);
      ground.fillRect(tileX + 14, tileY + 8, 4, 12);
      ground.fillStyle(material.detail, 1);
      ground.fillRect(tileX + 14, tileY + 14, 4, 4);
    }
  }

  private sampleTileVariant(gridX: number, gridY: number) {
    const hash = Math.imul(gridX + 17, 374761393) ^ Math.imul(gridY + 23, 668265263);
    return (hash ^ (hash >>> 13)) >>> 0;
  }

  private drawDepthGuides() {
    const guides = this.add.graphics();

    for (let row = SURFACE_ROW + 20; row < WORLD_HEIGHT_TILES; row += 40) {
      const y = row * TILE_SIZE;
      guides.lineStyle(1, gameTheme.colors.accent, 0.06);
      guides.lineBetween(0, y, WORLD_WIDTH_PX, y);
    }
  }

  private createPlayer() {
    this.player = new PlayerMiner(this, PLAYER_SPAWN_TILE);
  }

  private createHud() {
    this.hud?.destroy();
    this.hud = new MineHud(this);
    this.registerFixedUiElement(this.hud.getRoot());
    this.updateHud();
  }

  private createGoalsPanel() {
    this.goalsPanel?.destroy();
    this.goalsPanel = new ExpeditionGoalsPanel(this);
    this.registerFixedUiElement(this.goalsPanel.getRoot());
    this.updateGoalsPanel();
  }

  private createSurfaceReturnUi() {
    const buttonX = 78;
    const buttonY = this.viewportHeight - 54;

    this.surfaceButton = this.add.rectangle(buttonX, buttonY, 116, 30, gameTheme.colors.panelDeep, 0.98);
    this.surfaceButton.setScrollFactor(0);
    this.surfaceButton.setStrokeStyle(2, gameTheme.colors.border, 0.95);
    this.surfaceButton.setDepth(1100);
    this.surfaceButton.setInteractive({ useHandCursor: true });
    this.registerFixedUiElement(this.surfaceButton);
    this.surfaceButton.on("pointerdown", () => {
      this.tryReturnToSurface();
    });
    this.surfaceButton.on("pointerover", () => {
      this.surfaceButton?.setFillStyle(gameTheme.colors.panelRaised, 1);
    });
    this.surfaceButton.on("pointerout", () => {
      this.updateSurfaceUi();
    });

    this.surfaceButtonLabel = this.add.text(
      buttonX,
      buttonY - 10,
      "BASE [R]",
      makeGameTextStyle({
        family: "display",
        color: "#dbfdfa",
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );
    this.surfaceButtonLabel.setOrigin(0.5, 0);
    this.surfaceButtonLabel.setScrollFactor(0);
    this.surfaceButtonLabel.setDepth(1110);
    this.registerFixedUiElement(this.surfaceButtonLabel);

    this.surfaceStatusText = this.add.text(
      buttonX,
      buttonY + 5,
      "",
      makeGameTextStyle({
        color: gameTheme.colors.textSoft,
        fontSize: "10px",
        fontStyle: "700",
        strokeThickness: 2,
      }),
    );
    this.surfaceStatusText.setOrigin(0.5, 0);
    this.surfaceStatusText.setScrollFactor(0);
    this.surfaceStatusText.setDepth(1110);
    this.registerFixedUiElement(this.surfaceStatusText);

    this.updateSurfaceUi();
  }

  private destroySurfaceReturnUi() {
    this.surfaceButton?.destroy();
    this.surfaceButton = undefined;
    this.surfaceButtonLabel?.destroy();
    this.surfaceButtonLabel = undefined;
    this.surfaceStatusText?.destroy();
    this.surfaceStatusText = undefined;
  }

  private applyCameraFraming() {
    if (!this.player) {
      return;
    }

    const camera = this.cameras.main;
    camera.setDeadzone(
      Math.min(this.viewportWidth * 0.12, 160),
      Math.min(this.viewportHeight * 0.1, 96),
    );
    camera.setFollowOffset(0, -52);
    this.updateCameraZoom(0, true);
    camera.centerOn(this.player.sprite.x, this.player.sprite.y - 52);
  }

  private updateCameraZoom(deltaSeconds: number, snap = false) {
    const camera = this.cameras.main;
    const targetZoom = this.getTargetCameraZoom();
    const currentZoom = camera.zoom || targetZoom;

    if (snap) {
      camera.setZoom(targetZoom);
      if (this.player) {
        camera.centerOn(this.player.sprite.x, this.player.sprite.y - 52);
      }
      this.applyFixedUiZoomCompensation();
      return;
    }

    const blend = 1 - Math.exp(-this.zoomSmoothing * deltaSeconds);
    const nextZoom = Phaser.Math.Linear(currentZoom, targetZoom, blend);

    if (Math.abs(nextZoom - currentZoom) < 0.0005) {
      if (Math.abs(targetZoom - currentZoom) >= 0.0005) {
        camera.setZoom(targetZoom);
        if (this.player) {
          camera.centerOn(this.player.sprite.x, this.player.sprite.y - 52);
        }
        this.applyFixedUiZoomCompensation();
      }
      return;
    }

    camera.setZoom(nextZoom);
    if (this.player) {
      camera.centerOn(this.player.sprite.x, this.player.sprite.y - 52);
    }
    this.applyFixedUiZoomCompensation();
  }

  private adjustManualZoom(step: number) {
    const baseZoom = this.getGameplayZoom();
    const minOffset = this.getMinimumCameraZoom() - baseZoom;
    const maxOffset = this.maxCameraZoom - baseZoom;

    this.manualZoomOffset = Phaser.Math.Clamp(
      this.manualZoomOffset + step,
      minOffset,
      maxOffset,
    );
  }

  private resetManualZoom() {
    this.manualZoomOffset = 0;
  }

  private handleSceneKeyDown(event: KeyboardEvent) {
    this.audioDirector?.unlock();
    this.handleZoomShortcut(event);
  }

  private handleZoomShortcut(event: KeyboardEvent) {
    const modifierPressed = event.ctrlKey || event.metaKey;

    if (!modifierPressed || event.altKey) {
      return;
    }

    const key = event.key;

    if (key === "+" || key === "=" || key === "Add") {
      this.adjustManualZoom(this.zoomStep);
      event.preventDefault();
      return;
    }

    if (key === "-" || key === "_" || key === "Subtract") {
      this.adjustManualZoom(-this.zoomStep);
      event.preventDefault();
      return;
    }

    if (key === "0") {
      this.resetManualZoom();
      event.preventDefault();
    }
  }

  private createAudioDirector() {
    this.audioDirector = new MineAudioDirector(this);

    this.input.on("pointerdown", () => {
      this.audioDirector?.unlock();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioDirector?.destroy();
    });
  }

  private createScreenFlash() {
    this.screenFlash = this.add.rectangle(
      this.viewportWidth / 2,
      this.viewportHeight / 2,
      this.viewportWidth,
      this.viewportHeight,
      gameTheme.colors.accentSoft,
      0,
    );
    this.screenFlash.setScrollFactor(0);
    this.screenFlash.setDepth(2000);
    this.screenFlash.setBlendMode(Phaser.BlendModes.ADD);
    this.screenFlash.setAlpha(0);
    this.registerFixedUiElement(this.screenFlash);
  }

  private createArchaeologyOverlay() {
    this.archaeologyOverlay = new ArchaeologyCardOverlay(this);
    this.registerFixedUiElement(this.archaeologyOverlay.getRoot());
  }

  private createUpgradeOverlay() {
    this.upgradeOverlay = new UpgradeOverlay(this);
    this.registerFixedUiElement(this.upgradeOverlay.getRoot());
  }

  private handleMining(deltaSeconds: number) {
    if (!this.player) {
      return false;
    }

    const leftPressed = this.cursors?.left.isDown || this.moveKeys?.left.isDown;
    const rightPressed = this.cursors?.right.isDown || this.moveKeys?.right.isDown;
    const downPressed = this.cursors?.down.isDown || this.digKeys?.down.isDown;
    const digPressed = this.digKeys?.dig.isDown;

    const target = this.resolveMiningTarget({
      leftPressed: Boolean(leftPressed),
      rightPressed: Boolean(rightPressed),
      downPressed: Boolean(downPressed),
      digPressed: Boolean(digPressed),
    });

    if (!target) {
      this.clearMiningTarget();
      return false;
    }

    const tile = this.worldGrid[target.y]?.[target.x];

    if (!tile || !this.isMineable(tile.kind)) {
      this.clearMiningTarget();
      return false;
    }

    const required =
      (tileDefinitions[tile.kind].hardness * 0.35) /
      (1 +
        (this.pickaxeLevel - 1) * 0.25 +
        this.progressionSnapshot.perks.miningSpeedBonus);

    if (
      !this.miningTarget ||
      this.miningTarget.x !== target.x ||
      this.miningTarget.y !== target.y
    ) {
      this.miningTarget = {
        ...target,
        progress: 0,
        required,
        impacts: 0,
      };
      this.spawnMiningImpact(target.x, target.y, tile.kind, false, 0.18);
      this.audioDirector?.playMiningTick(tile.kind, 0.24);
    }

    this.player.facing = target.x < this.player.position.x ? -1 : target.x > this.player.position.x ? 1 : this.player.facing;
    this.miningTarget.progress += deltaSeconds;
    this.player.moveCooldown = 0.05;

    const completion = Phaser.Math.Clamp(
      this.miningTarget.progress / this.miningTarget.required,
      0,
      1,
    );
    const impactThreshold = Math.floor(completion * 4);

    if (impactThreshold > this.miningTarget.impacts) {
      this.miningTarget.impacts = impactThreshold;
      this.spawnMiningImpact(target.x, target.y, tile.kind, false, completion);
      this.audioDirector?.playMiningTick(tile.kind, completion);
    }

    if (this.miningTarget.progress >= this.miningTarget.required) {
      const brokenKind = this.worldGrid[target.y][target.x].kind;
      this.worldGrid[target.y][target.x] = { kind: "empty" };
      this.groundDirty = true;
      this.drawWorldGrid(true);
      this.spawnMiningImpact(target.x, target.y, brokenKind, true, 1);
      this.audioDirector?.playBlockBreak(brokenKind);
      this.collectTileDrop(brokenKind, target.x, target.y);
      this.clearMiningTarget();
      this.player.moveCooldown = 0.08;
      return true;
    }

    this.drawMiningOverlay();
    return true;
  }

  private resolveMiningTarget(input: {
    leftPressed: boolean;
    rightPressed: boolean;
    downPressed: boolean;
    digPressed: boolean;
  }) {
    if (!this.player) {
      return null;
    }

    if (input.digPressed && input.leftPressed) {
      return {
        x: this.player.position.x - 1,
        y: this.player.position.y,
      };
    }

    if (input.digPressed && input.rightPressed) {
      return {
        x: this.player.position.x + 1,
        y: this.player.position.y,
      };
    }

    if (input.downPressed || input.digPressed) {
      return {
        x: this.player.position.x,
        y: this.player.position.y + 1,
      };
    }

    return null;
  }

  private drawMiningOverlay() {
    if (!this.miningTarget) {
      return;
    }

    if (!this.effectLayer) {
      this.effectLayer = this.add.graphics();
    }

    this.effectLayer.clear();

    const tileX = this.miningTarget.x * TILE_SIZE;
    const tileY = this.miningTarget.y * TILE_SIZE;
    const completion = Phaser.Math.Clamp(
      this.miningTarget.progress / this.miningTarget.required,
      0,
      1,
    );
    const pulse = 0.52 + Math.sin(this.time.now / 60) * 0.16;
    const material = tilePalette[this.worldGrid[this.miningTarget.y]?.[this.miningTarget.x]?.kind ?? "stone"];

    this.effectLayer.lineStyle(2, material.detail, pulse + completion * 0.18);
    this.effectLayer.strokeRect(tileX + 2, tileY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    this.effectLayer.fillStyle(material.glow ?? material.detail, 0.08 + completion * 0.06);
    this.effectLayer.fillRect(tileX + 4, tileY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

    this.effectLayer.fillStyle(0x0d1118, 0.75);
    this.effectLayer.fillRect(tileX + 4, tileY - 10, TILE_SIZE - 8, 6);
    this.effectLayer.fillStyle(material.glow ?? gameTheme.colors.accent, 0.95);
    this.effectLayer.fillRect(tileX + 4, tileY - 10, (TILE_SIZE - 8) * completion, 6);
  }

  private clearMiningTarget() {
    this.miningTarget = undefined;
    this.effectLayer?.clear();
  }

  private collectTileDrop(kind: TileKind, tileX: number, tileY: number) {
    const resource = getResourceFromTile(kind);

    if (!resource) {
      this.updateHud();
      return;
    }

    this.inventory[resource] += 1;
    const rewardState = this.registerReward(resource);
    this.syncExpeditionProgress(this.expeditionProgression.applyResource(resource));
    this.game.events.emit("inventory:changed", { ...this.inventory });
    this.updateHud();
    this.audioDirector?.playPickup(resource, rewardState.streak);
    this.spawnPickupFeedback(tileX, tileY, this.inventory[resource], rewardState);
  }

  private registerReward(resource: ResourceKind) {
    const meta = getResourceMeta(resource);
    const chainActive = this.rewardComboTimer > 0;
    const comboBonus = this.progressionSnapshot.perks.comboWindowBonus;

    this.rewardComboCount = chainActive ? this.rewardComboCount + 1 : 1;
    this.rewardComboWindow =
      2.5 +
      comboBonus +
      Math.min(1.2, this.rewardComboCount * 0.08) +
      meta.value * 0.06;
    this.rewardComboTimer = this.rewardComboWindow;
    this.rewardColor = meta.accent;
    this.rewardLabel = `${getResourceTierLabel(meta.tier).toUpperCase()} ${meta.label.toUpperCase()}`;

    return {
      streak: this.rewardComboCount,
      tierLabel: getResourceTierLabel(meta.tier).toUpperCase(),
      accent: meta.accent,
      lootLabel: meta.label.toUpperCase(),
      momentum: Math.min(1, (this.rewardComboCount * 0.12) + meta.value * 0.1),
    };
  }

  private spawnPickupFeedback(
    tileX: number,
    tileY: number,
    total: number,
    rewardState: {
      streak: number;
      tierLabel: string;
      accent: string;
      lootLabel: string;
      momentum: number;
    },
  ) {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const color = rewardState.accent;
    const colorValue = Phaser.Display.Color.HexStringToColor(color).color;

    const text = this.add.text(
      worldX,
      worldY - 10,
      `+1 ${rewardState.lootLabel}`,
      makeGameTextStyle({
        family: "display",
        color,
        fontSize: "18px",
        fontStyle: "700",
        strokeThickness: 4,
      }),
    );
    text.setOrigin(0.5);
    text.setScale(0.78);
    text.setAlpha(0);

    const badge = this.add.text(
      worldX,
      worldY + 12,
      rewardState.streak > 1 ? `STREAK x${rewardState.streak}` : `TOTAL ${total}`,
      makeGameTextStyle({
        family: "body",
        color: rewardState.streak > 1 ? color : "#d9e4f2",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 3,
      }),
    );
    badge.setOrigin(0.5);
    badge.setAlpha(0);

    const rarity = this.add.text(
      worldX,
      worldY - 28,
      rewardState.tierLabel,
      makeGameTextStyle({
        family: "body",
        color,
        fontSize: "12px",
        fontStyle: "800",
        strokeThickness: 3,
      }),
    );
    rarity.setOrigin(0.5);
    rarity.setAlpha(0);
    rarity.setScale(0.72);

    const ring = this.add.circle(worldX, worldY, 10, colorValue, 0);
    ring.setStrokeStyle(2, colorValue, 0.65);
    ring.setScale(0.4);

    const burst = this.add.circle(worldX, worldY, 8, colorValue, 0.28 + rewardState.momentum * 0.12);
    burst.setScale(0.7);

    this.tweens.add({
      targets: text,
      scale: 1.1 + rewardState.momentum * 0.1,
      alpha: 1,
      y: worldY - 36,
      duration: 180,
      ease: "back.out",
    });
    this.tweens.add({
      targets: rarity,
      scale: 1,
      alpha: 0.95,
      y: worldY - 50,
      duration: 220,
      ease: "back.out",
    });
    this.tweens.add({
      targets: badge,
      alpha: 0.96,
      y: worldY - 8,
      duration: 200,
      ease: "quad.out",
    });
    this.tweens.add({
      targets: ring,
      scale: 1.7,
      alpha: 0,
      duration: 420,
      ease: "cubic.out",
    });

    this.tweens.add({
      targets: [text, badge, burst],
      y: "-=18",
      alpha: 0,
      scale: { from: 1, to: 1.24 + rewardState.momentum * 0.12 },
      delay: 220,
      duration: 420,
      ease: "cubic.out",
      onComplete: () => {
        text.destroy();
        badge.destroy();
        burst.destroy();
        ring.destroy();
        rarity.destroy();
      },
    });

    this.tweens.add({
      targets: rarity,
      y: "-=14",
      alpha: 0,
      delay: 240,
      duration: 360,
      ease: "cubic.out",
    });

    if (rewardState.streak >= 3) {
      this.spawnComboToast(worldX, worldY - 56, rewardState);
    }
  }

  private spawnComboToast(
    worldX: number,
    worldY: number,
    rewardState: {
      streak: number;
      tierLabel: string;
      accent: string;
    },
  ) {
    const toast = this.add.text(
      worldX,
      worldY,
      rewardState.streak >= 6 ? `FRENESI x${rewardState.streak}` : `RITMO x${rewardState.streak}`,
      makeGameTextStyle({
        family: "display",
        color: rewardState.accent,
        fontSize: "18px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );
    toast.setOrigin(0.5);
    toast.setScale(0.74);
    toast.setAlpha(0);

    this.tweens.add({
      targets: toast,
      scale: 1.08,
      alpha: 1,
      y: worldY - 12,
      duration: 160,
      ease: "back.out",
    });

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: worldY - 30,
      delay: 180,
      duration: 320,
      ease: "quad.out",
      onComplete: () => toast.destroy(),
    });
  }

  private spawnMiningImpact(
    tileX: number,
    tileY: number,
    kind: TileKind,
    burst: boolean,
    intensity: number,
  ) {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const material = tilePalette[kind];
    const particleCount = burst ? 12 : 5;
    const cameraIntensity = burst ? 0.0036 : 0.0015 + intensity * 0.0008;
    const flashColor = material.glow ?? material.detail;

    this.cameras.main.shake(burst ? 90 : 42, cameraIntensity);
    this.pulseScreenFlash(flashColor, burst ? 0.1 : 0.045 + intensity * 0.02, burst ? 180 : 120);

    const shock = this.add.circle(worldX, worldY, burst ? 10 : 6, flashColor, burst ? 0.22 : 0.14);
    shock.setScale(0.75);

    this.tweens.add({
      targets: shock,
      scale: burst ? 2.2 : 1.45,
      alpha: 0,
      duration: burst ? 260 : 170,
      ease: "quad.out",
      onComplete: () => shock.destroy(),
    });

    for (let index = 0; index < particleCount; index += 1) {
      const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
      const speed = burst ? Phaser.Math.FloatBetween(34, 78) : Phaser.Math.FloatBetween(18, 42);
      const distanceX = Math.cos(angle) * speed;
      const distanceY = Math.sin(angle) * speed - (burst ? 8 : 2);
      const size = burst ? Phaser.Math.Between(3, 7) : Phaser.Math.Between(2, 4);

      const shard = this.add.rectangle(worldX, worldY, size, size, material.detail, 0.95);
      shard.setAngle(Phaser.Math.Between(-35, 35));

      this.tweens.add({
        targets: shard,
        x: worldX + distanceX,
        y: worldY + distanceY,
        alpha: 0,
        angle: shard.angle + Phaser.Math.Between(-90, 90),
        scaleX: 0.35,
        scaleY: 0.35,
        duration: burst ? 360 : 220,
        ease: "cubic.out",
        onComplete: () => shard.destroy(),
      });
    }

    const dust = this.add.circle(worldX, worldY + 2, burst ? 9 : 6, material.base, burst ? 0.16 : 0.11);

    this.tweens.add({
      targets: dust,
      y: worldY - (burst ? 8 : 4),
      scale: burst ? 2.4 : 1.8,
      alpha: 0,
      duration: burst ? 300 : 180,
      ease: "sine.out",
      onComplete: () => dust.destroy(),
    });
  }

  private pulseScreenFlash(color: number, alpha: number, duration: number) {
    if (!this.screenFlash) {
      return;
    }

    this.tweens.killTweensOf(this.screenFlash);
    this.screenFlash.setFillStyle(color, alpha);
    this.screenFlash.setAlpha(alpha);

    this.tweens.add({
      targets: this.screenFlash,
      alpha: 0,
      duration,
      ease: "quad.out",
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const width = gameSize.width || this.viewportWidth;
    const height = gameSize.height || this.viewportHeight;

    if (!width || !height) {
      return;
    }

    this.screenFlash?.setPosition(width / 2, height / 2);
    this.screenFlash?.setSize(width, height);
    this.updateFixedUiElementLayout(this.screenFlash);

    this.destroySurfaceReturnUi();
    this.createSurfaceReturnUi();
    this.createHud();
    this.createGoalsPanel();

    if (this.player) {
      this.applyCameraFraming();
    }

    this.drawWorldGrid(true);
    this.updateSurfaceUi();
  }

  private updateSurfaceUi() {
    const atSurface = this.isAtSurface();
    const locked = this.surfaceReturnLocked;
    const fillColor = atSurface ? 0x173420 : gameTheme.colors.panelDeep;
    const borderColor = atSurface ? gameTheme.colors.success : gameTheme.colors.border;

    this.surfaceButton?.setFillStyle(fillColor, locked ? 0.55 : 0.98);
    this.surfaceButton?.setStrokeStyle(2, borderColor, locked ? 0.55 : 0.95);
    this.surfaceButton?.setAlpha(locked ? 0.7 : 1);

    this.surfaceButtonLabel?.setColor(atSurface ? "#b8ffd4" : "#dbfdfa");
    this.surfaceStatusText?.setColor(atSurface ? "#90f0b8" : gameTheme.colors.textSoft);
    this.surfaceStatusText?.setText(
      locked
        ? "subindo..."
        : atSurface
          ? "abrigo"
          : `${Math.max(0, this.player?.position.y ?? 0)}m`,
    );
  }

  private canOccupy(tileX: number, tileY: number) {
    if (tileX < 0 || tileY < 0 || tileY >= this.worldGrid.length) {
      return false;
    }

    const tile = this.worldGrid[tileY]?.[tileX];
    return tile ? this.isPassable(tile.kind) : false;
  }

  private isPassable(kind: TileKind) {
    return kind === "empty";
  }

  private isMineable(kind: TileKind) {
    return tileDefinitions[kind].breakable;
  }

  private updateHud() {
    if (!this.player || !this.hud) {
      return;
    }

    this.hud.update({
      depth: this.player.position.y,
      energy: this.energy,
      pickaxeLevel: this.pickaxeLevel,
      cardsFound: this.archaeologyDeck.collectedCount,
      cardsTotal: this.archaeologyDeck.totalCount,
      comboCount: this.rewardComboCount,
      comboWindowRatio:
        this.rewardComboWindow > 0
          ? Phaser.Math.Clamp(this.rewardComboTimer / this.rewardComboWindow, 0, 1)
          : 0,
      comboLabel: this.rewardLabel,
      comboColor: this.rewardColor,
      inventory: this.inventory,
    });
  }

  private updateGoalsPanel(
    snapshot = this.progressionSnapshot,
  ) {
    this.goalsPanel?.update({
      rank: snapshot.rank,
      progressLabel: snapshot.progressLabel,
      perkSummary: snapshot.perkSummary,
      activeGoal: snapshot.activeGoal,
      nextGoal: snapshot.nextGoal,
    });
  }

  private syncExpeditionProgress(
    snapshot: ExpeditionProgressionSnapshot,
  ) {
    this.progressionSnapshot = snapshot;
    this.updateGoalsPanel(snapshot);

    for (const completed of snapshot.newlyCompleted) {
      this.audioDirector?.playUpgrade();
      this.showMissionToast(completed.title, completed.rewardLabel);
    }
  }

  private isAtSurface() {
    return Boolean(this.player && this.player.position.y <= SURFACE_RETURN_TILE.y);
  }

  private tryReturnToSurface() {
    if (!this.player || this.surfaceReturnLocked || this.archaeologyOverlay?.isVisible || this.upgradeOverlay?.isVisible) {
      return false;
    }

    if (this.isAtSurface()) {
      this.showSurfaceToast("Voce ja esta na base.");
      return false;
    }

    this.surfaceReturnLocked = true;
    const departureDepth = this.player.position.y;
    this.clearMiningTarget();
    this.rewardComboCount = 0;
    this.rewardComboTimer = 0;
    this.rewardComboWindow = 2.6;
    this.rewardLabel = "Retorno seguro";
    this.rewardColor = "#d2fff7";
    this.updateSurfaceUi();

    const camera = this.cameras.main;

    camera.stopFollow();
    this.audioDirector?.playSurfaceReturn();
    this.pulseScreenFlash(gameTheme.colors.accentCool, 0.16, 220);
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player?.warpToTile(SURFACE_RETURN_TILE);
      if (this.player) {
        this.player.moveCooldown = 0.2;
        this.player.fallCooldown = 0.2;
      }
      this.energy = 100;
      this.syncExpeditionProgress(this.expeditionProgression.applySurfaceReturn(departureDepth));
      this.spawnSurfaceArrivalEffect();
      this.audioDirector?.playSurfaceArrive();
      camera.startFollow(this.player!.sprite, true, 0.16, 0.2);
      camera.centerOn(this.player!.sprite.x, this.player!.sprite.y);
      camera.fadeIn(220, 7, 14, 22);
      this.surfaceReturnLocked = false;
      this.showSurfaceToast("Base segura alcancada.");
      this.updateSurfaceUi();
    });
    camera.fadeOut(180, 7, 14, 22);

    return true;
  }

  private spawnSurfaceArrivalEffect() {
    const worldX = SURFACE_RETURN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const worldY = SURFACE_RETURN_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    this.spawnMiningImpact(SURFACE_RETURN_TILE.x, SURFACE_ROW, "diamond", false, 0.45);

    const text = this.add.text(
      worldX,
      worldY - 34,
      "BASE SEGURA",
      makeGameTextStyle({
        family: "display",
        color: "#d2fff7",
        fontSize: "20px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );
    text.setOrigin(0.5);
    text.setAlpha(0);
    text.setScale(0.82);

    const halo = this.add.circle(worldX, worldY + 10, 14, gameTheme.colors.accentCool, 0.2);

    this.tweens.add({
      targets: text,
      y: worldY - 50,
      alpha: 1,
      scale: 1.04,
      duration: 220,
      ease: "back.out",
    });

    this.tweens.add({
      targets: [text, halo],
      alpha: 0,
      scale: { from: 1, to: 1.8 },
      delay: 260,
      duration: 360,
      ease: "quad.out",
      onComplete: () => {
        text.destroy();
        halo.destroy();
      },
    });
  }

  private showSurfaceToast(message: string) {
    const startPoint = this.getFixedUiPosition(this.viewportWidth / 2, 180);
    const midPoint = this.getFixedUiPosition(this.viewportWidth / 2, 168);
    const endPoint = this.getFixedUiPosition(this.viewportWidth / 2, 152);
    const baseScale = this.getFixedUiScale(1);
    const toast = this.add.text(
      startPoint.x,
      startPoint.y,
      message,
      makeGameTextStyle({
        family: "display",
        color: "#d8fff7",
        fontSize: "16px",
        fontStyle: "800",
        strokeThickness: 4,
      }),
    );
    toast.setOrigin(0.5);
    toast.setScrollFactor(0);
    toast.setDepth(1400);
    toast.setAlpha(0);
    toast.setScale(this.getFixedUiScale(0.82));

    this.tweens.add({
      targets: toast,
      x: midPoint.x,
      y: midPoint.y,
      alpha: 1,
      scale: baseScale,
      duration: 180,
      ease: "back.out",
    });

    this.tweens.add({
      targets: toast,
      x: endPoint.x,
      y: endPoint.y,
      alpha: 0,
      delay: 300,
      duration: 260,
      ease: "quad.out",
      onComplete: () => toast.destroy(),
    });
  }

  private showMissionToast(title: string, rewardLabel: string) {
    const startPoint = this.getFixedUiPosition(this.viewportWidth / 2, 214);
    const midPoint = this.getFixedUiPosition(this.viewportWidth / 2, 198);
    const endPoint = this.getFixedUiPosition(this.viewportWidth / 2, 176);
    const baseScale = this.getFixedUiScale(1);
    const toast = this.add.text(
      startPoint.x,
      startPoint.y,
      `META CONCLUIDA: ${title}\n${rewardLabel}`,
      makeGameTextStyle({
        family: "display",
        color: "#fff0bc",
        fontSize: "15px",
        fontStyle: "800",
        strokeThickness: 4,
        align: "center",
      }),
    );
    toast.setOrigin(0.5);
    toast.setScrollFactor(0);
    toast.setDepth(1420);
    toast.setAlpha(0);
    toast.setScale(this.getFixedUiScale(0.82));

    this.tweens.add({
      targets: toast,
      x: midPoint.x,
      y: midPoint.y,
      alpha: 1,
      scale: baseScale,
      duration: 200,
      ease: "back.out",
    });

    this.tweens.add({
      targets: toast,
      x: endPoint.x,
      y: endPoint.y,
      alpha: 0,
      delay: 700,
      duration: 320,
      ease: "quad.out",
      onComplete: () => toast.destroy(),
    });
  }

  private updateRewardLoop(deltaSeconds: number) {
    if (this.rewardComboTimer <= 0) {
      return;
    }

    this.rewardComboTimer = Math.max(0, this.rewardComboTimer - deltaSeconds);

    if (this.rewardComboTimer > 0) {
      return;
    }

    this.rewardComboCount = 0;
    this.rewardComboWindow = 2.6;
    this.rewardLabel = "Mina fria";
    this.rewardColor = gameTheme.colors.textSoft;
  }

  private tryOpenNearbyChest() {
    if (!this.player) {
      return false;
    }

    const candidates = [
      { x: this.player.position.x, y: this.player.position.y + 1 },
      { x: this.player.position.x + this.player.facing, y: this.player.position.y },
      { x: this.player.position.x, y: this.player.position.y },
      { x: this.player.position.x - 1, y: this.player.position.y },
      { x: this.player.position.x + 1, y: this.player.position.y },
    ];

    for (const candidate of candidates) {
      const tile = this.worldGrid[candidate.y]?.[candidate.x];

      if (tile?.kind !== "chest") {
        continue;
      }

      this.worldGrid[candidate.y][candidate.x] = { kind: "empty" };
      this.groundDirty = true;
      this.drawWorldGrid(true);
      this.spawnMiningImpact(candidate.x, candidate.y, "chest", true, 1);
      this.syncExpeditionProgress(this.expeditionProgression.applyChestOpened());
      this.audioDirector?.playChestOpen();
      this.openArchaeologyCard();
      return true;
    }

    return false;
  }

  private openArchaeologyCard() {
    const cardBody = this.archaeologyDeck.drawNextCard();
    this.syncExpeditionProgress(this.expeditionProgression.applyCardFound());
    this.archaeologyOverlay?.show({
      body: cardBody,
      collectedCount: this.archaeologyDeck.collectedCount,
      totalCount: this.archaeologyDeck.totalCount,
      onClose: () => this.closeArchaeologyOverlay(),
    });
    this.updateHud();
  }

  private closeArchaeologyOverlay() {
    this.archaeologyOverlay?.hide();
  }

  private toggleUpgradeOverlay() {
    if (this.upgradeOverlay?.isVisible) {
      this.closeUpgradeOverlay();
      return;
    }

    if (!this.player || this.player.position.y > 5) {
      return;
    }

    const nextLevel = this.pickaxeLevel + 1;
    const cost = getPickaxeUpgradeCost(nextLevel);
    const canUpgrade = canAffordPickaxeUpgrade(this.inventory, cost);

    this.upgradeOverlay?.show({
      level: this.pickaxeLevel,
      cost,
      canUpgrade,
      onUpgrade: () => this.applyPickaxeUpgrade(),
      onClose: () => this.closeUpgradeOverlay(),
    });
  }

  private applyPickaxeUpgrade() {
    const nextLevel = this.pickaxeLevel + 1;
    const cost = getPickaxeUpgradeCost(nextLevel);

    if (!canAffordPickaxeUpgrade(this.inventory, cost)) {
      this.toggleUpgradeOverlay();
      return;
    }

    this.inventory.iron -= cost.iron;
    this.inventory.gold -= cost.gold;
    this.inventory.diamond -= cost.diamond;
    this.pickaxeLevel = nextLevel;
    this.syncExpeditionProgress(this.expeditionProgression.applyPickaxeLevel(this.pickaxeLevel));
    this.audioDirector?.playUpgrade();
    this.updateHud();
    this.toggleUpgradeOverlay();
  }

  private closeUpgradeOverlay() {
    this.upgradeOverlay?.hide();
  }

  private hideLegacyViewport() {
    const legacyHud = document.querySelector(".hud");
    const legacyCanvas = document.getElementById("game");
    const instructions = document.getElementById("instructions");
    const archCard = document.getElementById("arch-card");
    const pauseOverlay = document.getElementById("pause");
    const upgradeOverlay = document.getElementById("upgrade");
    const confetti = document.getElementById("confetti-global");
    const legacyFooter = document.querySelector(".footer");

    legacyHud?.setAttribute("hidden", "true");
    legacyCanvas?.setAttribute("hidden", "true");
    instructions?.setAttribute("hidden", "true");
    archCard?.setAttribute("hidden", "true");
    pauseOverlay?.setAttribute("hidden", "true");
    upgradeOverlay?.setAttribute("hidden", "true");
    confetti?.setAttribute("hidden", "true");
    legacyFooter?.setAttribute("hidden", "true");
  }

  private registerFixedUiElement<T extends FixedUiElement>(element: T) {
    this.fixedUiElements.set(element, {
      x: element.x,
      y: element.y,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
    });
    element.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.fixedUiElements.delete(element);
    });
    this.applyFixedUiElementZoomCompensation(element);
    return element;
  }

  private applyFixedUiZoomCompensation() {
    for (const element of this.fixedUiElements.keys()) {
      this.applyFixedUiElementZoomCompensation(element);
    }
  }

  private updateFixedUiElementLayout(element?: FixedUiElement) {
    if (!element || !this.fixedUiElements.has(element)) {
      return;
    }

    this.fixedUiElements.set(element, {
      x: element.x,
      y: element.y,
      scaleX: element.scaleX,
      scaleY: element.scaleY,
    });
  }

  private applyFixedUiElementZoomCompensation(element: FixedUiElement) {
    const layout = this.fixedUiElements.get(element);

    if (!layout || !element.scene) {
      return;
    }

    const position = this.getFixedUiPosition(layout.x, layout.y);
    element.setPosition(position.x, position.y);
    element.setScale(this.getFixedUiScale(layout.scaleX), this.getFixedUiScale(layout.scaleY));
  }

  private getFixedUiPosition(screenX: number, screenY: number) {
    const camera = this.cameras.main;
    const zoom = camera.zoom || 1;
    const centerX = camera.width / 2;
    const centerY = camera.height / 2;

    return {
      x: centerX + (screenX - centerX) / zoom,
      y: centerY + (screenY - centerY) / zoom,
    };
  }

  private getFixedUiScale(scale: number) {
    const zoom = this.cameras.main.zoom || 1;
    return scale / zoom;
  }
}
