import Phaser from "phaser";
import { TILE_SIZE } from "../world/constants";
import { gameTheme } from "../../ui/theme/gameTheme";

export type PlayerTilePosition = {
  x: number;
  y: number;
};

export class PlayerMiner {
  readonly sprite: Phaser.GameObjects.Container;

  private readonly aura: Phaser.GameObjects.Ellipse;
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
  private stepKick = 0;

  position: PlayerTilePosition;
  facing: -1 | 1 = 1;
  moveCooldown = 0;
  fallCooldown = 0;

  constructor(scene: Phaser.Scene, startPosition: PlayerTilePosition) {
    this.position = { ...startPosition };
    this.targetX = this.toWorldX(startPosition.x);
    this.targetY = this.toWorldY(startPosition.y);

    this.aura = scene.add.ellipse(0, 1, 34, 28, gameTheme.colors.accentCool, 0.16);
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
    this.lamp = scene.add.ellipse(8, -9, 7, 7, 0xdffffa, 1);

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
      this.aura,
      this.dustShadow,
      this.rig,
    ]);
    this.sprite.setSize(30, 34);

    scene.tweens.add({
      targets: this.lamp,
      alpha: 0.45,
      duration: 320,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    scene.tweens.add({
      targets: this.aura,
      alpha: 0.09,
      scaleX: 1.2,
      scaleY: 1.16,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  setMining(active: boolean) {
    this.mining = active;
  }

  setFalling(active: boolean) {
    this.falling = active;
  }

  update(deltaSeconds: number) {
    this.animationTime += deltaSeconds;
    this.moveCooldown = Math.max(0, this.moveCooldown - deltaSeconds);
    this.fallCooldown = Math.max(0, this.fallCooldown - deltaSeconds);
    this.stepKick = Phaser.Math.Linear(this.stepKick, 0, 0.18);

    this.sprite.x = Phaser.Math.Linear(this.sprite.x, this.targetX, 0.28);
    this.sprite.y = Phaser.Math.Linear(this.sprite.y, this.targetY, 0.34);
    this.sprite.scaleX = this.facing;

    const xDelta = Math.abs(this.targetX - this.sprite.x);
    const yDelta = Math.abs(this.targetY - this.sprite.y);
    const locomotion = Phaser.Math.Clamp((xDelta + yDelta) / 10, 0, 1);
    const idleBob = Math.sin(this.animationTime * 4.8) * 1.6;
    const walkSwing = Math.sin(this.animationTime * 14) * (2.8 * locomotion + this.stepKick);
    const fallLean = this.falling ? Phaser.Math.Linear(this.rig.rotation, -0.18, 0.26) : Phaser.Math.Linear(this.rig.rotation, 0, 0.2);
    const miningSwing = this.mining ? Math.sin(this.animationTime * 22) * 0.95 : 0;
    const miningLift = this.mining ? Math.abs(Math.sin(this.animationTime * 22)) * 2.5 : 0;

    this.rig.y = idleBob - miningLift;
    this.rig.rotation = this.falling ? fallLean : walkSwing * 0.01;
    this.dustShadow.scaleX = 1 + locomotion * 0.14;
    this.dustShadow.scaleY = 1 - locomotion * 0.08;
    this.dustShadow.alpha = 0.36 + locomotion * 0.12;
    this.aura.y = -2 + Math.sin(this.animationTime * 3.2) * 1.2;

    this.leftLeg.rotation = Phaser.Math.DegToRad(walkSwing * 1.2);
    this.rightLeg.rotation = Phaser.Math.DegToRad(-walkSwing * 1.2);
    this.leftLeg.y = 14 + Math.max(0, -walkSwing) * 0.08;
    this.rightLeg.y = 14 + Math.max(0, walkSwing) * 0.08;

    this.leftArm.rotation = Phaser.Math.DegToRad(-walkSwing * 0.8 - (this.falling ? 12 : 0));
    this.rightArm.rotation = Phaser.Math.DegToRad(this.mining ? -62 + miningSwing * 12 : walkSwing * 0.45 + 10);

    this.pickaxeHandle.rotation = this.rightArm.rotation;
    this.pickaxeHead.rotation = this.rightArm.rotation;
    this.pickaxeHandle.y = 11 - miningLift * 0.25;
    this.pickaxeHead.y = 4 - miningLift * 0.38;

    this.backpack.x = -7 - locomotion * 0.4;
    this.helmet.y = -7 + idleBob * 0.12;
    this.visor.y = -5 + idleBob * 0.12;
    this.lamp.y = -9 + idleBob * 0.18;
  }

  snapToTile(nextPosition: PlayerTilePosition) {
    if (nextPosition.x !== this.position.x) {
      this.stepKick = 1;
    }
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
