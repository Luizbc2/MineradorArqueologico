import type Phaser from "phaser";
import type { ResourceKind } from "../inventory/resourceInventory";
import type { TileKind } from "../world/types";

type AmbienceState = {
  depthRatio: number;
  atSurface: boolean;
  comboCount: number;
};

const MASTER_VOLUME = 0.85;
const EFFECT_VOLUME_MULTIPLIER = 2.6;
const MAX_TONE_VOLUME = 0.42;

export class MineAudioDirector {
  private audioContext?: AudioContext;
  private masterGain?: GainNode;
  private ambienceTimer = 0;
  private unlocked = false;
  private muted = false;

  constructor(private readonly scene: Phaser.Scene) {}

  unlock() {
    const context = this.ensureContext();

    if (!context || this.unlocked) {
      if (context?.state === "suspended") {
        void context.resume();
      }
      return;
    }

    this.unlocked = true;

    if (context.state === "suspended") {
      void context.resume();
    }
  }

  update(deltaSeconds: number, state: AmbienceState) {
    if (!this.isReady()) {
      return;
    }

    this.ambienceTimer -= deltaSeconds;

    if (this.ambienceTimer > 0) {
      return;
    }

    const baseDelay = state.atSurface ? 3.6 : 2.6 - state.depthRatio * 0.9;
    this.ambienceTimer = Math.max(1.2, baseDelay - Math.min(0.45, state.comboCount * 0.05));

    if (state.atSurface) {
      this.playSurfaceAmbience();
      return;
    }

    this.playMineAmbience(state.depthRatio, state.comboCount);
  }

  playStep(depthRatio: number) {
    if (!this.isReady()) {
      return;
    }

    this.playTone({
      frequency: 110 - depthRatio * 16,
      duration: 0.04,
      volume: 0.022,
      type: "triangle",
      attack: 0.002,
      release: 0.06,
      detune: (Math.random() - 0.5) * 8,
    });
  }

  playMiningTick(kind: TileKind, intensity: number) {
    if (!this.isReady()) {
      return;
    }

    const base = kind === "diamond" ? 520 : kind === "gold" ? 420 : kind === "iron" ? 320 : 220;
    const volume = 0.02 + intensity * 0.018;

    this.playTone({
      frequency: base,
      duration: 0.035,
      volume,
      type: "square",
      attack: 0.002,
      release: 0.05,
      detune: (Math.random() - 0.5) * 18,
    });
    this.playTone({
      frequency: base * 0.46,
      duration: 0.05,
      volume: volume * 0.6,
      type: "triangle",
      attack: 0.001,
      release: 0.06,
      startTime: 0.008,
      detune: (Math.random() - 0.5) * 12,
    });
  }

  playBlockBreak(kind: TileKind) {
    if (!this.isReady()) {
      return;
    }

    const accent = kind === "diamond" ? 760 : kind === "gold" ? 620 : kind === "iron" ? 460 : 260;

    this.playTone({
      frequency: accent,
      duration: 0.06,
      volume: 0.05,
      type: "sawtooth",
      attack: 0.001,
      release: 0.09,
      detune: (Math.random() - 0.5) * 12,
    });
    this.playTone({
      frequency: accent * 0.52,
      duration: 0.1,
      volume: 0.04,
      type: "triangle",
      attack: 0.001,
      release: 0.12,
      startTime: 0.01,
      detune: (Math.random() - 0.5) * 10,
    });
  }

  playPickup(resource: ResourceKind, streak: number) {
    if (!this.isReady()) {
      return;
    }

    const root = resource === "diamond" ? 830 : resource === "gold" ? 698 : resource === "iron" ? 554 : 392;
    const bonus = Math.min(220, streak * 16);

    this.playTone({
      frequency: root + bonus,
      duration: 0.08,
      volume: 0.04 + Math.min(0.02, streak * 0.003),
      type: "triangle",
      attack: 0.002,
      release: 0.12,
    });
    this.playTone({
      frequency: (root + bonus) * 1.5,
      duration: 0.08,
      volume: 0.025,
      type: "sine",
      attack: 0.002,
      release: 0.12,
      startTime: 0.03,
    });
  }

  playChestOpen() {
    if (!this.isReady()) {
      return;
    }

    this.playTone({
      frequency: 392,
      duration: 0.12,
      volume: 0.05,
      type: "triangle",
      attack: 0.002,
      release: 0.14,
    });
    this.playTone({
      frequency: 523,
      duration: 0.16,
      volume: 0.045,
      type: "sine",
      attack: 0.002,
      release: 0.18,
      startTime: 0.05,
    });
    this.playTone({
      frequency: 784,
      duration: 0.18,
      volume: 0.03,
      type: "sine",
      attack: 0.002,
      release: 0.18,
      startTime: 0.08,
    });
  }

  playUpgrade() {
    if (!this.isReady()) {
      return;
    }

    this.playTone({
      frequency: 330,
      duration: 0.12,
      volume: 0.05,
      type: "square",
      attack: 0.002,
      release: 0.13,
    });
    this.playTone({
      frequency: 494,
      duration: 0.12,
      volume: 0.04,
      type: "square",
      attack: 0.002,
      release: 0.14,
      startTime: 0.05,
    });
    this.playTone({
      frequency: 659,
      duration: 0.16,
      volume: 0.03,
      type: "triangle",
      attack: 0.002,
      release: 0.16,
      startTime: 0.1,
    });
  }

  playCoins() {
    if (!this.isReady()) {
      return;
    }

    for (let index = 0; index < 5; index += 1) {
      this.playTone({
        frequency: 760 + index * 92,
        duration: 0.045,
        volume: 0.05,
        type: "triangle",
        attack: 0.001,
        release: 0.08,
        startTime: index * 0.035,
        detune: (Math.random() - 0.5) * 28,
      });
    }
  }

  playSurfaceReturn() {
    if (!this.isReady()) {
      return;
    }

    this.playTone({
      frequency: 210,
      duration: 0.16,
      volume: 0.045,
      type: "sawtooth",
      attack: 0.002,
      release: 0.18,
    });
    this.playTone({
      frequency: 280,
      duration: 0.18,
      volume: 0.03,
      type: "triangle",
      attack: 0.002,
      release: 0.2,
      startTime: 0.05,
    });
  }

  playSurfaceArrive() {
    if (!this.isReady()) {
      return;
    }

    this.playTone({
      frequency: 440,
      duration: 0.14,
      volume: 0.045,
      type: "triangle",
      attack: 0.002,
      release: 0.18,
    });
    this.playTone({
      frequency: 659,
      duration: 0.2,
      volume: 0.035,
      type: "sine",
      attack: 0.002,
      release: 0.2,
      startTime: 0.05,
    });
  }

  destroy() {
    this.masterGain?.disconnect();
    this.masterGain = undefined;

    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
    }

    this.audioContext = undefined;
  }

  private isReady() {
    return this.unlocked && !this.muted && Boolean(this.audioContext && this.masterGain);
  }

  private ensureContext() {
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtor) {
      return undefined;
    }

    this.audioContext = new AudioCtor();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = MASTER_VOLUME;
    this.masterGain.connect(this.audioContext.destination);

    return this.audioContext;
  }

  private playSurfaceAmbience() {
    this.playTone({
      frequency: 220,
      duration: 0.26,
      volume: 0.014,
      type: "sine",
      attack: 0.01,
      release: 0.35,
    });
    this.playTone({
      frequency: 330,
      duration: 0.22,
      volume: 0.01,
      type: "triangle",
      attack: 0.02,
      release: 0.28,
      startTime: 0.08,
    });
  }

  private playMineAmbience(depthRatio: number, comboCount: number) {
    const root = 96 - depthRatio * 18;
    const shimmer = 180 + depthRatio * 120 + comboCount * 6;

    this.playTone({
      frequency: root,
      duration: 0.24,
      volume: 0.016 + depthRatio * 0.008,
      type: "triangle",
      attack: 0.008,
      release: 0.26,
      detune: (Math.random() - 0.5) * 10,
    });

    this.playTone({
      frequency: shimmer,
      duration: 0.12,
      volume: 0.008 + Math.min(0.01, comboCount * 0.0015),
      type: "sine",
      attack: 0.01,
      release: 0.18,
      startTime: 0.1,
      detune: (Math.random() - 0.5) * 20,
    });
  }

  private playTone(options: {
    frequency: number;
    duration: number;
    volume: number;
    type: OscillatorType;
    attack: number;
    release: number;
    startTime?: number;
    detune?: number;
  }) {
    const context = this.audioContext;
    const master = this.masterGain;

    if (!context || !master) {
      return;
    }

    const now = context.currentTime + (options.startTime ?? 0);
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = options.type;
    oscillator.frequency.value = options.frequency;
    oscillator.detune.value = options.detune ?? 0;

    filter.type = "lowpass";
    filter.frequency.value = Math.max(220, options.frequency * 3.6);
    filter.Q.value = 0.5;

    const toneVolume = Math.min(MAX_TONE_VOLUME, options.volume * EFFECT_VOLUME_MULTIPLIER);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(toneVolume, now + options.attack);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + options.duration + options.release);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(master);

    oscillator.start(now);
    oscillator.stop(now + options.duration + options.release + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      filter.disconnect();
      gainNode.disconnect();
    };
  }
}
