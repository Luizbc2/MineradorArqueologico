import type { Renderer } from "../../types/app";

export function createRenderer(): Renderer {
  return {
    mode: "canvas-2d",
    status: "planned",
  };
}
