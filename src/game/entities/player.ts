import type { Player } from "../../types/app";

export function createPlayer(): Player {
  return {
    name: "Minerador",
    depth: 0,
    energy: 100,
    pickaxeLevel: 1,
  };
}
