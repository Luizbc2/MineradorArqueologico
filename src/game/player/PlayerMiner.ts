import Phaser from "phaser";
import { TILE_SIZE } from "../world/constants";
import { gameTheme } from "../../ui/theme/gameTheme";

export type PlayerTilePosition = {
  x: number;
  y: number;
};

export class PlayerMiner {
  readonly sprite: Phaser.GameObjects.Container;
  private readonly standingOffsetY = -9;

  private readonly dustShadow: Phaser.GameObjects.Ellipse;
  private readonly rig: Phaser.GameObjects.Container;
  private readonly helmet: Phaser.GameObjects.Rectangle;
  private readonly visor: Phaser.GameObjects.Rectangle;
  private readonly lamp: Phaser.GameObjects.Ellipse;
  private readonly torso: Phaser.GameObjects.Rectangle;
  private readonly belt: Phaser.GameObjects.Rectangle;
  private readonly backpack: Phaser.GameObjects.Rectangle;
  private readonly leftArm: Phaser.GameObjects.Rectangle;
  private readonly rightArm: Phaser.GameObjects.Rectangle;
  private readonly leftLeg: Phaser.GameObjects.Rectangle;
  private readonly rightLeg: Phaser.GameObjects.Rectangle;
  private readonly pickaxeHandle: Phaser.GameObjects.Rectangle;
  private readonly pickaxeHead: Phaser.GameObjects.Rectangle;
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

    this.dustShadow = scene.add.ellipse(0, 16, 22, 8, 0x03070d, 0.45);

    this.backpack = scene.add.rectangle(-7, 2, 9, 14, 0x4c3725, 1);
    this.backpack.setStrokeStyle(2, 0x27180d, 0.85);

    this.leftLeg = scene.add.rectangle(-4, 14, 6, 11, 0x45382d, 1);
    this.leftLeg.setOrigin(0.5, 0);
    this.leftLeg.setStrokeStyle(2, 0x241913, 0.9);

    this.rightLeg = scene.add.rectangle(4, 14, 6, 11, 0x3c3028, 1);
    this.rightLeg.setOrigin(0.5, 0);
    this.rightLeg.setStrokeStyle(2, 0x241913, 0.9);

    this.torso = scene.add.rectangle(0, 4, 16, 18, 0xd69f57, 1);
    this.torso.setStrokeStyle(2, 0x4c2f12, 0.95);

    this.belt = scene.add.rectangle(0, 10, 16, 4, 0x5a3d23, 1);

    this.leftArm = scene.add.rectangle(-9, 5, 5, 13, 0xc3894c, 1);
    this.leftArm.setOrigin(0.5, 0);
    this.leftArm.setStrokeStyle(2, 0x513115, 0.9);

    this.rightArm = scene.add.rectangle(9, 4, 5, 14, 0xc3894c, 1);
    this.rightArm.setOrigin(0.5, 0);
    this.rightArm.setStrokeStyle(2, 0x513115, 0.9);

    this.pickaxeHandle = scene.add.rectangle(13, 11, 4, 18, 0x7c5631, 1);
    this.pickaxeHandle.setOrigin(0.5, 0.85);
    this.pickaxeHead = scene.add.rectangle(14, 4, 12, 4, 0xbfc9d8, 1);
    this.pickaxeHead.setStrokeStyle(2, 0x5c697a, 0.8);

    this.helmet = scene.add.rectangle(0, -7, 18, 10, gameTheme.colors.warning, 1);
    this.helmet.setStrokeStyle(2, 0x563a11, 0.95);
    this.visor = scene.add.rectangle(0, -5, 12, 6, 0x1a3046, 0.98);
    this.visor.setStrokeStyle(1, 0x84d4ff, 0.35);
    this.lamp = scene.add.ellipse(8, -9, 8, 8, 0xfff4d7, 1);

    this.rig = scene.add.container(0, 0, [
      this.backpack,
      this.leftLeg,
      this.rightLeg,
      this.torso,
      this.belt,
      this.leftArm,
      this.rightArm,
      this.pickaxeHandle,
      this.pickaxeHead,
      this.helmet,
      this.visor,
      this.lamp,
    ]);

    this.sprite = scene.add.container(this.targetX, this.targetY, [
      this.dustShadow,
      this.rig,
    ]);
    this.sprite.setSize(30, 34);
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
    const idleBob = airborne ? 0 : -Math.abs(Math.sin(this.animationTime * 4.8)) * 1.1;
    const runSwing = Math.sin(this.animationTime * 16) * (moving ? 1 : 0);
    const runPower = moving ? 1 + this.stepKick * 0.3 : 0;
    const walkSwing = runSwing * 13 * runPower;
    const fallLean = this.falling ? Phaser.Math.Linear(this.rig.rotation, -0.16, 0.28) : Phaser.Math.Linear(this.rig.rotation, 0, 0.22);
    const jumpLift = jumpRatio * 4;
    const miningSwing = this.mining ? Math.sin(this.animationTime * 22) * 0.95 : 0;
    const miningLift = this.mining ? Math.abs(Math.sin(this.animationTime * 22)) * 2.5 : 0;

    this.rig.y = this.standingOffsetY + idleBob - miningLift - jumpLift + landingRatio * 2;
    this.rig.rotation = this.falling ? fallLean : walkSwing * 0.003 - jumpRatio * 0.08;
    this.rig.scaleX = 1 + landingRatio * 0.08;
    this.rig.scaleY = 1 - landingRatio * 0.1;
    this.dustShadow.scaleX = 1 + locomotion * 0.18 + landingRatio * 0.28;
    this.dustShadow.scaleY = 1 - locomotion * 0.1 - landingRatio * 0.1;
    this.dustShadow.alpha = 0.34 + locomotion * 0.14 + landingRatio * 0.16;

    if (this.falling) {
      this.leftLeg.rotation = Phaser.Math.DegToRad(-8);
      this.rightLeg.rotation = Phaser.Math.DegToRad(10);
      this.leftLeg.y = 15;
      this.rightLeg.y = 15;
    } else if (jumpRatio > 0) {
      this.leftLeg.rotation = Phaser.Math.DegToRad(-26);
      this.rightLeg.rotation = Phaser.Math.DegToRad(24);
      this.leftLeg.y = 12;
      this.rightLeg.y = 12;
    } else {
      this.leftLeg.rotation = Phaser.Math.DegToRad(walkSwing);
      this.rightLeg.rotation = Phaser.Math.DegToRad(-walkSwing);
      this.leftLeg.y = 14 + Math.max(0, -walkSwing) * 0.08 - landingRatio;
      this.rightLeg.y = 14 + Math.max(0, walkSwing) * 0.08 - landingRatio;
    }

    const leftArmRun = -walkSwing * 0.8;
    const rightArmRun = walkSwing * 0.6 + 10;
    const leftArmAir = this.falling ? -18 : -34 * jumpRatio;
    const rightArmAir = this.falling ? 28 : -22 * jumpRatio;

    this.leftArm.rotation = Phaser.Math.DegToRad(airborne ? leftArmAir : leftArmRun);
    this.rightArm.rotation = Phaser.Math.DegToRad(
      this.mining ? -68 + miningSwing * 14 : airborne ? rightArmAir : rightArmRun,
    );

    this.pickaxeHandle.rotation = this.rightArm.rotation;
    this.pickaxeHead.rotation = this.rightArm.rotation;
    this.pickaxeHandle.y = 11 - miningLift * 0.25;
    this.pickaxeHead.y = 4 - miningLift * 0.38;

    this.backpack.x = -7 - locomotion * 0.5;
    this.backpack.y = 2 + Math.abs(runSwing) * 0.7 - jumpRatio * 1.5;
    this.helmet.y = -7 + idleBob * 0.12;
    this.visor.y = -5 + idleBob * 0.12;
    this.lamp.y = -9 + idleBob * 0.18;
    this.lamp.alpha = 0.82 + Math.sin(this.animationTime * 10) * 0.12;
    this.lamp.scaleX = 1 + Math.sin(this.animationTime * 8.5) * 0.06;
    this.lamp.scaleY = 1 + Math.cos(this.animationTime * 8.5) * 0.06;
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
