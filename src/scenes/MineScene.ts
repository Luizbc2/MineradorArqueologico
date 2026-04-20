import Phaser from "phaser";
import { PlayerMiner } from "../game/player/PlayerMiner";
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
import type { TileKind, WorldGrid } from "../game/world/types";

export class MineScene extends Phaser.Scene {
  private worldGrid: WorldGrid = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys?: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private player?: PlayerMiner;

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

    this.hideLegacyViewport();
    this.game.events.emit("phaser:mine-ready");
  }

  update(_: number, delta: number) {
    if (!this.player) {
      return;
    }

    const deltaSeconds = delta / 1000;
    this.player.update(deltaSeconds);

    if (this.player.fallCooldown === 0 && this.canOccupy(this.player.position.x, this.player.position.y + 1)) {
      this.player.snapToTile({
        x: this.player.position.x,
        y: this.player.position.y + 1,
      });
      this.player.fallCooldown = 0.08;
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

    background.fillGradientStyle(0x111827, 0x111827, 0x05070d, 0x05070d, 1);
    background.fillRect(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);

    background.fillStyle(0x1d3557, 0.2);
    background.fillRect(0, 0, WORLD_WIDTH_PX, SURFACE_ROW * TILE_SIZE);
  }

  private drawWorldGrid() {
    const ground = this.add.graphics();

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
      guides.lineStyle(2, 0xffd166, 0.08);
      guides.lineBetween(0, y, WORLD_WIDTH_PX, y);

      const label = this.add.text(12, y + 6, `${row}m`, {
        color: "#d9b76a",
        fontFamily: "monospace",
        fontSize: "16px",
      });

      label.setAlpha(0.55);
      label.setScrollFactor(1);
    }

    const frame = this.add.rectangle(
      VIEWPORT_WIDTH / 2,
      VIEWPORT_HEIGHT / 2,
      VIEWPORT_WIDTH - 8,
      VIEWPORT_HEIGHT - 8,
    );
    frame.setStrokeStyle(2, 0x9bb0d1, 0.12);
    frame.setScrollFactor(0);
  }

  private createPlayer() {
    this.player = new PlayerMiner(this, PLAYER_SPAWN_TILE);
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

  private hideLegacyViewport() {
    const legacyCanvas = document.getElementById("game");
    const instructions = document.getElementById("instructions");
    const archCard = document.getElementById("arch-card");
    const pauseOverlay = document.getElementById("pause");
    const upgradeOverlay = document.getElementById("upgrade");
    const confetti = document.getElementById("confetti-global");

    legacyCanvas?.setAttribute("hidden", "true");
    instructions?.setAttribute("hidden", "true");
    archCard?.setAttribute("hidden", "true");
    pauseOverlay?.setAttribute("hidden", "true");
    upgradeOverlay?.setAttribute("hidden", "true");
    confetti?.setAttribute("hidden", "true");
  }
}
