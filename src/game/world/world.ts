import type { World } from "../../types/app";

export function createWorld(): World {
  return {
    width: 40,
    depth: 600,
    biome: "cavern",
  };
}
