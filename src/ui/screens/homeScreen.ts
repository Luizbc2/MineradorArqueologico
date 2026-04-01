import type { GameState, Player, Renderer, World } from "../../types/app";

type HomeScreenOptions = {
  title: string;
  subtitle: string;
  state: GameState;
  world: World;
  player: Player;
  renderer: Renderer;
};

export function createHomeScreen(options: HomeScreenOptions) {
  const main = document.createElement("main");
  main.className = "app-shell";

  const panel = document.createElement("section");
  panel.className = "hero-card";

  panel.innerHTML = `
    <p class="eyebrow">Arquitetura organizada</p>
    <h1>${options.title}</h1>
    <p class="description">${options.subtitle}</p>

    <div class="status-list" aria-label="Status da arquitetura">
      <span>app</span>
      <span>core</span>
      <span>game</span>
      <span>ui</span>
      <span>styles</span>
      <span>types</span>
    </div>

    <div class="info-grid" aria-label="Resumo da estrutura atual">
      <article class="info-card">
        <strong>Tela atual</strong>
        <p>${options.state.screen}</p>
      </article>
      <article class="info-card">
        <strong>Renderizacao</strong>
        <p>${options.renderer.mode}</p>
      </article>
      <article class="info-card">
        <strong>Mundo base</strong>
        <p>${options.world.width} colunas / ${options.world.depth}m</p>
      </article>
      <article class="info-card">
        <strong>Jogador</strong>
        <p>${options.player.name} / energia ${options.player.energy}%</p>
      </article>
    </div>
  `;

  main.append(panel);
  return main;
}
