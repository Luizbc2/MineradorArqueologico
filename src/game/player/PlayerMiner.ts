import Phaser from "phaser";
import { TILE_SIZE } from "../world/constants";

export type PlayerTilePosition = {
  x: number;
  y: number;
};

export class PlayerMiner {
  readonly sprite: Phaser.GameObjects.Container;

  private targetX: number;
  private targetY: number;

  position: PlayerTilePosition;
  facing: -1 | 1 = 1;
  moveCooldown = 0;
  fallCooldown = 0;

  constructor(scene: Phaser.Scene, startPosition: PlayerTilePosition) {
    this.position = { ...startPosition };
    this.targetX = this.toWorldX(startPosition.x);
    this.targetY = this.toWorldY(startPosition.y);

    const glow = scene.add.circle(0, 4, 16, 0x58d7c4, 0.18);
    const body = scene.add.rectangle(0, 2, 18, 22, 0xffd166, 1);
    body.setStrokeStyle(2, 0x3b2b0e, 0.9);
    const visor = scene.add.rectangle(0, -2, 12, 5, 0x2c405e, 0.95);
    const lamp = scene.add.circle(8, -6, 3, 0xcafff4, 1);

    this.sprite = scene.add.container(this.targetX, this.targetY, [glow, body, visor, lamp]);
    this.sprite.setSize(20, 24);

    scene.tweens.add({
      targets: lamp,
      alpha: 0.45,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  update(deltaSeconds: number) {
    this.moveCooldown = Math.max(0, this.moveCooldown - deltaSeconds);
    this.fallCooldown = Math.max(0, this.fallCooldown - deltaSeconds);

    this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.targetX, 0.28);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.targetY, 0.34);
    this.sprite.scaleX = this.facing;
  }

  snapToTile(nextPosition: PlayerTilePosition) {
    this.position = { ...nextPosition };
    this.targetX = this.toWorldX(nextPosition.x);
    this.targetY = this.toWorldY(nextPosition.y);
  }

  private toWorldX(tileX: number) {
    return tileX * TILE_SIZE + TILE_SIZE / 2;
  }

  private toWorldY(tileY: number) {
    return tileY * TILE_SIZE + TILE_SIZE / 2;
  }
}
