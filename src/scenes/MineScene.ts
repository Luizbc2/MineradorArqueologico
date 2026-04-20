import Phaser from "phaser";
import {
  PLAYER_SPAWN_TILE,
  SURFACE_ROW,
  TILE_SIZE,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTH,
  WORLD_HEIGHT_PX,
  WORLD_HEIGHT_TILES,
  WORLD_WIDTH_PX,
  WORLD_WIDTH_TILES,
} from "../game/world/constants";

export class MineScene extends Phaser.Scene {
  constructor() {
    super("mine");
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);
    this.physics.world.setBounds(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);
    this.cameras.main.setBackgroundColor("#06080f");

    this.drawBackdrop();
    this.drawSurfaceLayer();
    this.drawDepthGuides();
    this.drawSpawnMarker();

    const spawnX = PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    this.cameras.main.centerOn(spawnX, spawnY);
    this.game.events.emit("phaser:mine-ready");
  }

  private drawBackdrop() {
    const background = this.add.graphics();

    background.fillGradientStyle(0x111827, 0x111827, 0x05070d, 0x05070d, 1);
    background.fillRect(0, 0, WORLD_WIDTH_PX, WORLD_HEIGHT_PX);

    background.fillStyle(0x1d3557, 0.2);
    background.fillRect(0, 0, WORLD_WIDTH_PX, SURFACE_ROW * TILE_SIZE);
  }

  private drawSurfaceLayer() {
    const ground = this.add.graphics();

    for (let y = 0; y < WORLD_HEIGHT_TILES; y += 1) {
      for (let x = 0; x < WORLD_WIDTH_TILES; x += 1) {
        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;

        if (y < SURFACE_ROW) {
          ground.fillStyle(0x141c2a, 0.08);
          ground.fillRect(tileX, tileY, TILE_SIZE - 1, TILE_SIZE - 1);
          continue;
        }

        const depthTint = Math.min(0.9, 0.26 + y / WORLD_HEIGHT_TILES / 1.8);
        const color = y % 2 === 0 ? 0x5d4128 : 0x4d341f;

        ground.fillStyle(color, depthTint);
        ground.fillRect(tileX, tileY, TILE_SIZE - 1, TILE_SIZE - 1);
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

  private drawSpawnMarker() {
    const markerX = PLAYER_SPAWN_TILE.x * TILE_SIZE + TILE_SIZE / 2;
    const markerY = PLAYER_SPAWN_TILE.y * TILE_SIZE + TILE_SIZE / 2;

    const glow = this.add.circle(markerX, markerY, 18, 0x58d7c4, 0.2);
    const marker = this.add.rectangle(markerX, markerY, 18, 24, 0xffd166, 0.95);
    marker.setStrokeStyle(2, 0x3b2b0e, 0.8);

    this.tweens.add({
      targets: [glow, marker],
      y: "-=4",
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }
}
