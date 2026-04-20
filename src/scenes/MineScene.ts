import Phaser from "phaser";
import {
  createArchaeologyDeck,
} from "../game/archaeology/archaeologyCards";
import {
  canAffordPickaxeUpgrade,
  getPickaxeUpgradeCost,
} from "../game/progression/pickaxeUpgrade";
import {
  createResourceInventory,
  getResourceFromTile,
  getResourceLabel,
} from "../game/inventory/resourceInventory";
import { PlayerMiner } from "../game/player/PlayerMiner";
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

export class MineScene extends Phaser.Scene {
  private worldGrid: WorldGrid = [];
  private readonly archaeologyDeck = createArchaeologyDeck();
  private inventory: ResourceInventory = createResourceInventory();
  private energy = 100;
  private pickaxeLevel = 1;
  private groundLayer?: Phaser.GameObjects.Graphics;
  private atmosphereLayer?: Phaser.GameObjects.Graphics;
  private effectLayer?: Phaser.GameObjects.Graphics;
  private darknessLayer?: Phaser.GameObjects.Graphics;
  private lightLayer?: Phaser.GameObjects.Graphics;
  private screenFlash?: Phaser.GameObjects.Rectangle;
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
  private player?: PlayerMiner;
  private miningTarget?: MiningTarget;

  constructor() {
    super("mine");
  }

  create() {
    this.worldGrid = generateWorld();
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);
    this.cameras.main.setBackgroundColor("#06080f");

    this.drawBackdrop();
    this.drawWorldGrid();
    this.drawAtmosphere();
    this.drawDepthGuides();
    this.createPlayer();
    this.createScreenFlash();
    this.createHud();
    this.createArchaeologyOverlay();
    this.createUpgradeOverlay();

    if (this.player) {
      this.cameras.main.startFollow(this.player.sprite, true, 0.14, 0.18);
      this.cameras.main.setDeadzone(120, 90);
      this.cameras.main.centerOn(this.player.sprite.x, this.player.sprite.y);
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

    this.hideLegacyViewport();
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
      this.player.moveCooldown = 0.08;
      this.finalizeFrame(deltaSeconds);
      return;
    }

    this.player.facing = nextDirection;
    this.player.snapToTile({ x: nextX, y: nextY });
    this.player.moveCooldown = 0.11;
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
    this.updateLighting();
    this.updateHud();
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

  private drawWorldGrid() {
    if (!this.groundLayer) {
      this.groundLayer = this.add.graphics();
    }

    this.groundLayer.clear();
    const ground = this.groundLayer;

    for (let y = 0; y < WORLD_HEIGHT_TILES; y += 1) {
      for (let x = 0; x < this.worldGrid[y].length; x += 1) {
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

    for (let row = SURFACE_ROW + 6; row < WORLD_HEIGHT_TILES; row += 12) {
      const y = row * TILE_SIZE + 16;
      const ratio = row / WORLD_HEIGHT_TILES;

      layer.fillStyle(gameTheme.colors.caveGlow, 0.03 + ratio * 0.04);
      layer.fillEllipse(104, y, 220, 96);
      layer.fillEllipse(WORLD_WIDTH_PX - 104, y + 18, 240, 108);

      if (row % 24 === 0) {
        layer.fillStyle(gameTheme.colors.ember, 0.02 + ratio * 0.03);
        layer.fillEllipse(WORLD_WIDTH_PX / 2, y + 26, 180, 72);
      }
    }

    for (let index = 0; index < 16; index += 1) {
      const x = 48 + ((index * 41) % (WORLD_WIDTH_PX - 96));
      const y = SURFACE_ROW * TILE_SIZE + 80 + ((index * 137) % (WORLD_HEIGHT_PX - SURFACE_ROW * TILE_SIZE - 140));
      const mote = this.add.circle(x, y, 2 + (index % 3), gameTheme.colors.accentCool, 0.08 + (index % 4) * 0.02);

      mote.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: mote,
        x: x + Phaser.Math.Between(-24, 24),
        y: y + Phaser.Math.Between(-54, 36),
        alpha: 0.02,
        duration: 2400 + index * 220,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    this.darknessLayer = this.add.graphics();
    this.darknessLayer.setScrollFactor(0);
    this.darknessLayer.setDepth(900);

    this.lightLayer = this.add.graphics();
    this.lightLayer.setScrollFactor(0);
    this.lightLayer.setDepth(910);
    this.lightLayer.setBlendMode(Phaser.BlendModes.ADD);
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
    const inset = kind === "chest" ? 2 : 1;
    const width = TILE_SIZE - inset * 2;

    ground.fillStyle(material.base, depthTint);
    ground.fillRoundedRect(tileX + inset, tileY + inset, width, width, 5);

    ground.fillStyle(material.top, depthTint * 0.92);
    ground.fillRect(tileX + inset + 1, tileY + inset + 1, width - 2, 5);

    ground.fillStyle(material.edge, depthTint * 0.9);
    ground.fillRect(tileX + inset, tileY + TILE_SIZE - 7, width, 5);
    ground.fillRect(tileX + TILE_SIZE - 7, tileY + inset + 3, 4, width - 7);

    ground.lineStyle(1, material.edge, 0.45);
    ground.strokeRoundedRect(tileX + inset, tileY + inset, width, width, 5);

    if (kind === "dirt" || kind === "stone" || kind === "bedrock") {
      for (let dot = 0; dot < 5; dot += 1) {
        const px = tileX + 5 + ((variant + dot * 7) % 20);
        const py = tileY + 6 + ((variant * 3 + dot * 5) % 18);
        ground.fillStyle(material.detail, 0.12 + dot * 0.03);
        ground.fillRect(px, py, dot % 2 === 0 ? 2 : 1, 1);
      }
    }

    if (kind === "coal" || kind === "iron" || kind === "gold" || kind === "diamond") {
      for (let cluster = 0; cluster < 4; cluster += 1) {
        const px = tileX + 6 + ((variant + cluster * 5) % 16);
        const py = tileY + 7 + ((variant * 2 + cluster * 7) % 14);
        ground.fillStyle(material.detail, 0.85);
        ground.fillRect(px, py, 3, 2);
        ground.fillStyle(material.top, 0.4);
        ground.fillRect(px + 1, py, 1, 1);
      }
    }

    if (kind === "gold" || kind === "diamond") {
      ground.fillStyle(material.glow ?? material.detail, 0.12 + ((variant % 5) * 0.02));
      ground.fillCircle(tileX + 16, tileY + 16, 10);
      ground.fillStyle(0xffffff, 0.18);
      ground.fillRect(tileX + 8, tileY + 8, 3, 3);
    }

    if (kind === "chest") {
      ground.fillStyle(material.top, 1);
      ground.fillRoundedRect(tileX + 4, tileY + 6, 24, 16, 4);
      ground.fillStyle(material.edge, 1);
      ground.fillRect(tileX + 4, tileY + 14, 24, 3);
      ground.fillRect(tileX + 14, tileY + 8, 4, 12);
      ground.fillStyle(material.detail, 1);
      ground.fillRect(tileX + 14, tileY + 14, 4, 4);
      ground.fillStyle(material.glow ?? material.detail, 0.16);
      ground.fillCircle(tileX + 16, tileY + 16, 11);
    }
  }

  private sampleTileVariant(gridX: number, gridY: number) {
    const hash = Math.imul(gridX + 17, 374761393) ^ Math.imul(gridY + 23, 668265263);
    return (hash ^ (hash >>> 13)) >>> 0;
  }

  private drawDepthGuides() {
    const guides = this.add.graphics();

    for (let row = SURFACE_ROW; row < WORLD_HEIGHT_TILES; row += 10) {
      const y = row * TILE_SIZE;
      guides.lineStyle(2, gameTheme.colors.accent, 0.09);
      guides.lineBetween(0, y, WORLD_WIDTH_PX, y);

      const label = this.add.text(
        12,
        y + 6,
        `${row}m`,
        makeGameTextStyle({
          family: "display",
          color: "#e7c98b",
          fontSize: "16px",
          fontStyle: "700",
          strokeThickness: 3,
        }),
      );

      label.setAlpha(0.55);
      label.setScrollFactor(1);
    }

    const frame = this.add.rectangle(
      VIEWPORT_WIDTH / 2,
      VIEWPORT_HEIGHT / 2,
      VIEWPORT_WIDTH - 8,
      VIEWPORT_HEIGHT - 8,
    );
    frame.setStrokeStyle(1, gameTheme.colors.accentSoft, 0.07);
    frame.setScrollFactor(0);
  }

  private createPlayer() {
    this.player = new PlayerMiner(this, PLAYER_SPAWN_TILE);
  }

  private createHud() {
    this.hud = new MineHud(this);
    this.updateHud();
  }

  private createScreenFlash() {
    this.screenFlash = this.add.rectangle(
      VIEWPORT_WIDTH / 2,
      VIEWPORT_HEIGHT / 2,
      VIEWPORT_WIDTH,
      VIEWPORT_HEIGHT,
      gameTheme.colors.accentSoft,
      0,
    );
    this.screenFlash.setScrollFactor(0);
    this.screenFlash.setDepth(2000);
    this.screenFlash.setBlendMode(Phaser.BlendModes.ADD);
    this.screenFlash.setAlpha(0);
  }

  private createArchaeologyOverlay() {
    this.archaeologyOverlay = new ArchaeologyCardOverlay(this);
  }

  private createUpgradeOverlay() {
    this.upgradeOverlay = new UpgradeOverlay(this);
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
      (1 + (this.pickaxeLevel - 1) * 0.25);

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
    }

    if (this.miningTarget.progress >= this.miningTarget.required) {
      const brokenKind = this.worldGrid[target.y][target.x].kind;
      this.worldGrid[target.y][target.x] = { kind: "empty" };
      this.drawWorldGrid();
      this.spawnMiningImpact(target.x, target.y, brokenKind, true, 1);
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

    this.effectLayer.fillStyle(material.glow ?? material.detail, 0.1 + completion * 0.08);
    this.effectLayer.fillRoundedRect(tileX + 4, tileY + 4, TILE_SIZE - 8, TILE_SIZE - 8, 5);

    this.effectLayer.lineStyle(2, material.edge, 0.5);
    this.effectLayer.lineBetween(tileX + 6, tileY + 8, tileX + 16, tileY + 18);
    this.effectLayer.lineBetween(tileX + 14, tileY + 18, tileX + 24, tileY + 10);
    this.effectLayer.lineBetween(tileX + 10, tileY + 22, tileX + 20, tileY + 24);

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
    this.game.events.emit("inventory:changed", { ...this.inventory });
    this.updateHud();
    this.spawnPickupFeedback(resource, tileX, tileY, this.inventory[resource]);
  }

  private spawnPickupFeedback(resource: ResourceKind, tileX: number, tileY: number, total: number) {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
    const color = resource === "diamond" ? "#b8f7fa" : resource === "gold" ? "#ffe28a" : resource === "iron" ? "#f4c69a" : "#cfd9e2";
    const colorValue = Phaser.Display.Color.HexStringToColor(color).color;

    const text = this.add.text(
      worldX,
      worldY - 10,
      `+1 ${getResourceLabel(resource).toUpperCase()}`,
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
      `TOTAL ${total}`,
      makeGameTextStyle({
        family: "body",
        color: "#d9e4f2",
        fontSize: "14px",
        fontStyle: "700",
        strokeThickness: 3,
      }),
    );
    badge.setOrigin(0.5);
    badge.setAlpha(0);

    const ring = this.add.circle(worldX, worldY, 10, colorValue, 0);
    ring.setStrokeStyle(2, colorValue, 0.65);
    ring.setScale(0.4);

    const burst = this.add.circle(worldX, worldY, 8, colorValue, 0.32);
    burst.setScale(0.7);

    this.tweens.add({
      targets: text,
      scale: 1.12,
      alpha: 1,
      y: worldY - 36,
      duration: 180,
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
      scale: { from: 1, to: 1.24 },
      delay: 220,
      duration: 420,
      ease: "cubic.out",
      onComplete: () => {
        text.destroy();
        badge.destroy();
        burst.destroy();
        ring.destroy();
      },
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

  private updateLighting() {
    if (!this.player || !this.darknessLayer || !this.lightLayer) {
      return;
    }

    const camera = this.cameras.main;
    const viewport = camera.worldView;
    const playerX = this.player.sprite.x - viewport.x;
    const playerY = this.player.sprite.y - viewport.y;
    const depthRatio = Phaser.Math.Clamp(this.player.position.y / WORLD_HEIGHT_TILES, 0, 1);
    const darknessAlpha = 0.12 + depthRatio * 0.4;
    const lampX = playerX + this.player.facing * 8;
    const lampY = playerY - 12;
    const outerRadius = 82 - depthRatio * 8;
    const coneWidth = 146 - depthRatio * 18;

    this.darknessLayer.clear();
    this.darknessLayer.fillStyle(0x02050a, darknessAlpha);
    this.darknessLayer.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    this.darknessLayer.fillStyle(0x08111b, 0.14 + depthRatio * 0.12);
    this.darknessLayer.fillEllipse(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, VIEWPORT_WIDTH + 120, VIEWPORT_HEIGHT + 90);
    this.darknessLayer.fillStyle(0x02050a, 0.18 + depthRatio * 0.08);
    this.darknessLayer.fillRect(0, 0, VIEWPORT_WIDTH, 38);
    this.darknessLayer.fillRect(0, VIEWPORT_HEIGHT - 44, VIEWPORT_WIDTH, 44);

    this.lightLayer.clear();
    this.lightLayer.fillStyle(gameTheme.colors.accentCool, 0.12 + depthRatio * 0.03);
    this.lightLayer.fillCircle(lampX, lampY, outerRadius + 28);
    this.lightLayer.fillStyle(gameTheme.colors.accentSoft, 0.11);
    this.lightLayer.fillCircle(lampX, lampY, outerRadius);
    this.lightLayer.fillStyle(0xffffff, 0.12);
    this.lightLayer.fillCircle(lampX, lampY, 24);
    this.lightLayer.fillStyle(gameTheme.colors.warning, 0.07 + depthRatio * 0.02);
    this.lightLayer.fillEllipse(
      lampX + this.player.facing * (36 + depthRatio * 8),
      lampY + 4,
      coneWidth,
      82 - depthRatio * 10,
    );

    if (this.miningTarget) {
      const miningX = this.miningTarget.x * TILE_SIZE + TILE_SIZE / 2 - viewport.x;
      const miningY = this.miningTarget.y * TILE_SIZE + TILE_SIZE / 2 - viewport.y;
      const pulse = 0.08 + Math.sin(this.time.now / 80) * 0.025;

      this.lightLayer.fillStyle(gameTheme.colors.accent, pulse);
      this.lightLayer.fillCircle(miningX, miningY, 22);
    }

    this.drawVisibleOreGlows(viewport);
  }

  private drawVisibleOreGlows(viewport: Phaser.Geom.Rectangle) {
    if (!this.lightLayer) {
      return;
    }

    const startX = Math.max(0, Math.floor(viewport.x / TILE_SIZE) - 1);
    const endX = Math.min(this.worldGrid[0].length - 1, Math.ceil((viewport.x + viewport.width) / TILE_SIZE) + 1);
    const startY = Math.max(0, Math.floor(viewport.y / TILE_SIZE) - 1);
    const endY = Math.min(this.worldGrid.length - 1, Math.ceil((viewport.y + viewport.height) / TILE_SIZE) + 1);

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        const tile = this.worldGrid[y]?.[x];

        if (!tile || tile.kind === "empty") {
          continue;
        }

        const material = tilePalette[tile.kind];

        if (!material.glow) {
          continue;
        }

        const screenX = x * TILE_SIZE + TILE_SIZE / 2 - viewport.x;
        const screenY = y * TILE_SIZE + TILE_SIZE / 2 - viewport.y;
        const shimmer = 0.04 + ((x + y) % 3) * 0.015 + Math.sin((this.time.now + x * 37 + y * 61) / 280) * 0.012;
        const radius = tile.kind === "chest" ? 18 : tile.kind === "diamond" ? 16 : 14;

        this.lightLayer.fillStyle(material.glow, shimmer);
        this.lightLayer.fillCircle(screenX, screenY, radius);
      }
    }
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
      inventory: this.inventory,
    });
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
      this.drawWorldGrid();
      this.spawnMiningImpact(candidate.x, candidate.y, "chest", true, 1);
      this.openArchaeologyCard();
      return true;
    }

    return false;
  }

  private openArchaeologyCard() {
    const cardBody = this.archaeologyDeck.drawNextCard();
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
}
