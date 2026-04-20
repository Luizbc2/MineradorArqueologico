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
};

export class MineScene extends Phaser.Scene {
  private worldGrid: WorldGrid = [];
  private readonly archaeologyDeck = createArchaeologyDeck();
  private inventory: ResourceInventory = createResourceInventory();
  private energy = 100;
  private pickaxeLevel = 1;
  private groundLayer?: Phaser.GameObjects.Graphics;
  private effectLayer?: Phaser.GameObjects.Graphics;
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
    this.drawDepthGuides();
    this.createPlayer();
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

    if (this.archaeologyOverlay?.isVisible) {
      if (Phaser.Input.Keyboard.JustDown(this.escapeKey!) || Phaser.Input.Keyboard.JustDown(this.interactKey!)) {
        this.closeArchaeologyOverlay();
      }
      return;
    }

    if (this.upgradeOverlay?.isVisible) {
      if (Phaser.Input.Keyboard.JustDown(this.escapeKey!) || Phaser.Input.Keyboard.JustDown(this.upgradeKey!)) {
        this.closeUpgradeOverlay();
      }
      return;
    }

    const deltaSeconds = delta / 1000;
    this.player.update(deltaSeconds);
    this.updateHud();

    if (Phaser.Input.Keyboard.JustDown(this.upgradeKey!)) {
      this.toggleUpgradeOverlay();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.interactKey!)) {
      if (this.tryOpenNearbyChest()) {
        return;
      }
    }

    if (this.handleMining(deltaSeconds)) {
      return;
    }

    if (this.player.fallCooldown === 0 && this.canOccupy(this.player.position.x, this.player.position.y + 1)) {
      this.player.snapToTile({
        x: this.player.position.x,
        y: this.player.position.y + 1,
      });
      this.player.fallCooldown = 0.08;
      this.clearMiningTarget();
      return;
    }

    if (this.player.moveCooldown > 0) {
      return;
    }

    const leftPressed =
      this.cursors?.left.isDown || this.moveKeys?.left.isDown;
    const rightPressed =
      this.cursors?.right.isDown || this.moveKeys?.right.isDown;

    const nextDirection = leftPressed ? -1 : rightPressed ? 1 : 0;

    if (nextDirection === 0) {
      return;
    }

    const nextX = this.player.position.x + nextDirection;
    const nextY = this.player.position.y;

    if (!this.canOccupy(nextX, nextY)) {
      this.player.facing = nextDirection;
      this.player.moveCooldown = 0.08;
      return;
    }

    this.player.facing = nextDirection;
    this.player.snapToTile({ x: nextX, y: nextY });
    this.player.moveCooldown = 0.11;
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

        ground.fillStyle(tilePalette[tile.kind], depthTint);
        ground.fillRect(tileX, tileY, TILE_SIZE - 1, TILE_SIZE - 1);

        if (tile.kind === "gold" || tile.kind === "diamond") {
          ground.fillStyle(0xffffff, 0.18);
          ground.fillRect(tileX + 6, tileY + 6, 4, 4);
        }

        if (tile.kind === "chest") {
          ground.fillStyle(0xffe08a, 0.22);
          ground.fillRect(tileX + 8, tileY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        }
      }
    }
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
      };
    }

    this.player.facing = target.x < this.player.position.x ? -1 : target.x > this.player.position.x ? 1 : this.player.facing;
    this.miningTarget.progress += deltaSeconds;
    this.player.moveCooldown = 0.05;

    if (this.miningTarget.progress >= this.miningTarget.required) {
      const brokenKind = this.worldGrid[target.y][target.x].kind;
      this.worldGrid[target.y][target.x] = { kind: "empty" };
      this.drawWorldGrid();
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

    this.effectLayer.lineStyle(2, 0xffffff, 0.35 + completion * 0.4);
    this.effectLayer.strokeRect(tileX + 2, tileY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

    this.effectLayer.lineStyle(2, 0x111111, 0.45);
    this.effectLayer.lineBetween(tileX + 6, tileY + 8, tileX + 16, tileY + 18);
    this.effectLayer.lineBetween(tileX + 14, tileY + 18, tileX + 24, tileY + 10);
    this.effectLayer.lineBetween(tileX + 10, tileY + 22, tileX + 20, tileY + 24);

    this.effectLayer.fillStyle(0x0d1118, 0.75);
    this.effectLayer.fillRect(tileX + 4, tileY - 10, TILE_SIZE - 8, 6);
    this.effectLayer.fillStyle(0xffd166, 0.95);
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

    const text = this.add.text(worldX, worldY - 10, `+1 ${getResourceLabel(resource)}`, {
      color,
      fontFamily: "monospace",
      fontSize: "18px",
      stroke: "#091018",
      strokeThickness: 4,
    });
    text.setOrigin(0.5);

    const badge = this.add.text(worldX, worldY + 12, `total ${total}`, {
      color: "#d9e4f2",
      fontFamily: "monospace",
      fontSize: "13px",
      stroke: "#091018",
      strokeThickness: 3,
    });
    badge.setOrigin(0.5);
    badge.setAlpha(0.88);

    const burst = this.add.circle(worldX, worldY, 8, Phaser.Display.Color.HexStringToColor(color).color, 0.32);

    this.tweens.add({
      targets: [text, badge, burst],
      y: "-=26",
      alpha: 0,
      scale: { from: 1, to: 1.18 },
      duration: 600,
      ease: "cubic.out",
      onComplete: () => {
        text.destroy();
        badge.destroy();
        burst.destroy();
      },
    });
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
