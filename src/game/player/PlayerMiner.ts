import Phaser from "phaser";
import { TILE_SIZE } from "../world/constants";

export type PlayerTilePosition = {
  x: number;
  y: number;
};

export class PlayerMiner {
  readonly sprite: Phaser.GameObjects.Container;
  private readonly standingOffsetY = 0;

  private readonly dustShadow: Phaser.GameObjects.Ellipse;
  private readonly rig: Phaser.GameObjects.Container;
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly lampGlow: Phaser.GameObjects.Ellipse;
  private readonly helmetGlow: Phaser.GameObjects.Ellipse;
  private targetX: number;
  private targetY: number;
  private animationTime = 0;
  private mining = false;
  private falling = false;
  private jumpPoseTimer = 0;
  private landingSquashTimer = 0;
  private stepKick = 0;

  position: PlayerTilePosition;
  facing: -1 | 1 = 1;
  moveCooldown = 0;
  fallCooldown = 0;

  constructor(scene: Phaser.Scene, startPosition: PlayerTilePosition) {
    this.position = { ...startPosition };
    this.targetX = this.toWorldX(startPosition.x);
    this.targetY = this.toWorldY(startPosition.y);

    this.dustShadow = scene.add.ellipse(0, 18, 26, 8, 0x03070d, 0.46);

    this.lampGlow = scene.add.ellipse(12, -17, 18, 11, 0xffdf85, 0.12);
    this.lampGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.helmetGlow = scene.add.ellipse(12, -17, 6, 4, 0xfff2b6, 0.56);
    this.helmetGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.body = scene.add.sprite(0, 16, "player-miner", 0);
    this.body.setOrigin(0.5, 1);
    this.body.setScale(0.62);

    this.rig = scene.add.container(0, 0, [
      this.lampGlow,
      this.helmetGlow,
      this.body,
    ]);

    this.sprite = scene.add.container(this.targetX, this.targetY, [
      this.dustShadow,
      this.rig,
    ]);
    this.sprite.setSize(30, 42);
  }

  setMining(active: boolean) {
    this.mining = active;
  }

  setFalling(active: boolean) {
    if (this.falling && !active) {
      this.landingSquashTimer = 0.14;
    }

    this.falling = active;
  }

  playJump() {
    this.jumpPoseTimer = 0.24;
    this.stepKick = 1.15;
  }

  update(deltaSeconds: number) {
    this.animationTime += deltaSeconds;
    this.moveCooldown = Math.max(0, this.moveCooldown - deltaSeconds);
    this.fallCooldown = Math.max(0, this.fallCooldown - deltaSeconds);
    this.jumpPoseTimer = Math.max(0, this.jumpPoseTimer - deltaSeconds);
    this.landingSquashTimer = Math.max(0, this.landingSquashTimer - deltaSeconds);
    this.stepKick = Phaser.Math.Linear(this.stepKick, 0, 0.18);

    this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.targetX, 0.28);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.targetY, 0.34);
    this.sprite.scaleX = this.facing;

    const xDelta = Math.abs(this.targetX - this.sprite.x);
    const yDelta = Math.abs(this.targetY - this.sprite.y);
    const locomotion = Phaser.Math.Clamp((xDelta + yDelta) / 10, 0, 1);
    const moving = locomotion > 0.04;
    const jumpRatio = Phaser.Math.Clamp(this.jumpPoseTimer / 0.24, 0, 1);
    const landingRatio = Phaser.Math.Clamp(this.landingSquashTimer / 0.14, 0, 1);
    const airborne = this.falling || jumpRatio > 0;
    const idleBob = airborne ? 0 : -Math.abs(Math.sin(this.animationTime * 4.8)) * 0.9;
    const runSwing = Math.sin(this.animationTime * 16) * (moving ? 1 : 0);
    const runPower = moving ? 1 + this.stepKick * 0.3 : 0;
    const fallLean = this.falling
      ? Phaser.Math.Linear(this.rig.rotation, -0.16, 0.28)
      : Phaser.Math.Linear(this.rig.rotation, 0, 0.22);
    const jumpLift = jumpRatio * 4;
    const miningLift = this.mining ? Math.abs(Math.sin(this.animationTime * 22)) * 2.5 : 0;
    const runFrame = 1 + (Math.floor(this.animationTime * 12) % 6);
    const miningFrame = 7 + (Math.floor(this.animationTime * 16) % 5);

    this.rig.y = this.standingOffsetY + idleBob - miningLift - jumpLift + landingRatio * 2;
    this.rig.rotation = this.falling ? fallLean : (moving ? (runFrame % 2 === 0 ? -0.045 : 0.045) : 0) - jumpRatio * 0.08;
    this.rig.scaleX = 1 + landingRatio * 0.08;
    this.rig.scaleY = 1 - landingRatio * 0.1;
    this.dustShadow.scaleX = 1 + locomotion * 0.18 + landingRatio * 0.28;
    this.dustShadow.scaleY = 1 - locomotion * 0.1 - landingRatio * 0.1;
    this.dustShadow.alpha = 0.34 + locomotion * 0.14 + landingRatio * 0.16;

    this.body.setFrame(this.mining ? miningFrame : moving && !airborne ? runFrame : 0);
    this.body.y = 16 + Math.abs(runSwing) * 0.45 - jumpRatio * 1.4;
    this.body.angle = moving ? runSwing * 1.6 * runPower : 0;
    this.body.scaleX = 0.62 + landingRatio * 0.03;
    this.body.scaleY = 0.62 - landingRatio * 0.04;

    this.lampGlow.x = 12 + runSwing * 0.45;
    this.lampGlow.y = -17 + idleBob * 0.35;
    this.lampGlow.alpha = 0.12 + Math.sin(this.animationTime * 8.5) * 0.04;
    this.lampGlow.scaleX = 1 + Math.sin(this.animationTime * 7.8) * 0.07;
    this.lampGlow.scaleY = 1 + Math.cos(this.animationTime * 7.8) * 0.07;
    this.helmetGlow.x = 12 + runSwing * 0.35;
    this.helmetGlow.y = -17 + idleBob * 0.28;
    this.helmetGlow.alpha = 0.62 + Math.sin(this.animationTime * 10) * 0.1;
  }

  snapToTile(nextPosition: PlayerTilePosition) {
    if (nextPosition.x !== this.position.x) {
      this.stepKick = 1;
    }
    this.position = { ...nextPosition };
    this.targetX = this.toWorldX(nextPosition.x);
    this.targetY = this.toWorldY(nextPosition.y);
  }

  warpToTile(nextPosition: PlayerTilePosition) {
    this.position = { ...nextPosition };
    this.targetX = this.toWorldX(nextPosition.x);
    this.targetY = this.toWorldY(nextPosition.y);
    this.sprite.x = this.targetX;
    this.sprite.y = this.targetY;
    this.stepKick = 0;
  }

  private toWorldX(tileX: number) {
    return tileX * TILE_SIZE + TILE_SIZE / 2;
  }

  private toWorldY(tileY: number) {
    return tileY * TILE_SIZE + TILE_SIZE / 2;
  }
}
