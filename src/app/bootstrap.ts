import { createApp } from "./App";

export function bootstrapApp() {
  const appRoot = document.querySelector<HTMLDivElement>("#app");

  if (!appRoot) {
    throw new Error("Elemento #app não encontrado.");
  }

  appRoot.replaceChildren(createApp());
}
