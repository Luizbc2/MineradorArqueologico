import type { TileKind } from "./types";

export type TileMaterial = {
  base: number;
  top: number;
  edge: number;
  detail: number;
  glow?: number;
};

export const tilePalette: Record<TileKind, TileMaterial> = {
  empty: {
    base: 0x000000,
    top: 0x000000,
    edge: 0x000000,
    detail: 0x000000,
  },
  grass: {
    base: 0x704421,
    top: 0x6fb34c,
    edge: 0x3b2412,
    detail: 0xd19a62,
    glow: 0xa9dc6f,
  },
  dirt: {
    base: 0x734726,
    top: 0xa96d3e,
    edge: 0x442716,
    detail: 0xc8915d,
  },
  stone: {
    base: 0x596270,
    top: 0x8b96a7,
    edge: 0x303847,
    detail: 0xcfd8e6,
  },
  coal: {
    base: 0x252c35,
    top: 0x48515d,
    edge: 0x13171d,
    detail: 0xaab4c4,
  },
  iron: {
    base: 0x9d6d4d,
    top: 0xd4a57b,
    edge: 0x603c2a,
    detail: 0xf3d8bb,
  },
  gold: {
    base: 0xc9911d,
    top: 0xffdc74,
    edge: 0x7e5810,
    detail: 0xfff3c2,
    glow: 0xffcf52,
  },
  diamond: {
    base: 0x3db9d3,
    top: 0xaaf3ff,
    edge: 0x16606d,
    detail: 0xe5fcff,
    glow: 0x7ceeff,
  },
  obsidian: {
    base: 0x302447,
    top: 0x7c68b7,
    edge: 0x130d22,
    detail: 0xb7a3f2,
    glow: 0x8d6ff0,
  },
  crystal: {
    base: 0x7b4ed8,
    top: 0xd9c5ff,
    edge: 0x33206f,
    detail: 0xf5efff,
    glow: 0xb996ff,
  },
  fossil: {
    base: 0x6d5a3a,
    top: 0xd8c48d,
    edge: 0x332716,
    detail: 0xfff3c7,
    glow: 0xe7bd63,
  },
  prismatic: {
    base: 0x335773,
    top: 0xb8fff6,
    edge: 0x16233b,
    detail: 0xffe0ff,
    glow: 0x89f7ff,
  },
  chest: {
    base: 0x92541e,
    top: 0xc78435,
    edge: 0x502b0d,
    detail: 0xffe08a,
    glow: 0xffd67a,
  },
  bedrock: {
    base: 0x24292f,
    top: 0x444b54,
    edge: 0x0f1317,
    detail: 0x8f98a1,
  },
};
