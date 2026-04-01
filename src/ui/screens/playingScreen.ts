import type { GameState, Player, Renderer, World } from "../../types/app";

type PlayingScreenOptions = {
  state: GameState;
  title: string;
  player: Player;
  world: World;
  renderer: Renderer;
  actions: {
    onBack: () => void;
    onOpenCodex: () => void;
    onPause: () => void;
    onResume: () => void;
  };
};

export function createPlayingScreen(options: PlayingScreenOptions) {
  const main = document.createElement("main");
  main.className = "app-shell";

  const section = document.createElement("section");
  section.className = "game-shell";

  const isPaused = options.state.screen === "paused";

  section.innerHTML = `
    <header class="shell-topbar" aria-label="Moldura principal do jogo">
      <div class="topbar-brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <div>
          <p class="topbar-label">Loop principal</p>
          <strong>${options.title}</strong>
        </div>
      </div>

      <div class="topbar-status" aria-label="Status da sessão">
        <span>estado: ${isPaused ? "pausado" : "jogando"}</span>
        <span>energia: ${options.player.energy}%</span>
        <span>renderização: ${options.renderer.mode}</span>
      </div>
    </header>

    <div class="shell-layout">
      <section class="hero-card">
        <p class="eyebrow">Pré-jogo funcional</p>
        <h1>${isPaused ? "Sessão pausada" : "Área principal do jogo"}</h1>
        <p class="description">
          O fluxo já reconhece início, pausa, retorno e navegação para o códice.
          No próximo bloco vamos conectar isso ao estado interno do jogo.
        </p>

        <section class="playframe" aria-label="Moldura jogável">
          <div class="playframe-hud">
            <div class="hud-group">
              <span>Profundidade</span>
              <strong>${options.player.depth}m</strong>
            </div>
            <div class="hud-group">
              <span>Energia</span>
              <strong>${options.player.energy}%</strong>
            </div>
            <div class="hud-group">
              <span>Mundo</span>
              <strong>${options.world.width} colunas</strong>
            </div>
          </div>

          <div class="playframe-canvas playframe-canvas--active">
            <div class="canvas-glow"></div>
            <div class="canvas-grid"></div>
            <div class="session-banner">
              <strong>${isPaused ? "Jogo pausado" : "Fluxo do jogo ativo"}</strong>
              <p>
                ${isPaused
                  ? "A interface já entra em estado de pausa sem sair da sessão."
                  : "A sessão principal já está pronta para receber o loop de gameplay."}
              </p>
            </div>
          </div>
        </section>

        <div class="hero-actions">
          <button class="hero-button hero-button--primary" type="button">
            ${isPaused ? "Retomar sessão" : "Pausar sessão"}
          </button>
          <button class="hero-button hero-button--ghost" type="button">Abrir códice</button>
          <button class="hero-button hero-button--ghost" type="button">Voltar ao início</button>
        </div>
      </section>

      <aside class="side-panel" aria-label="Resumo do estado do fluxo">
        <article class="info-card">
          <strong>Fluxo conectado</strong>
          <ul class="detail-list">
            <li>início para jogo</li>
            <li>jogo para pausa</li>
            <li>jogo para códice</li>
            <li>retorno ao início</li>
          </ul>
        </article>

        <article class="info-card">
          <strong>Próximo passo do sistema</strong>
          <p>ligar esse fluxo ao loop, input e renderização reais do jogo.</p>
        </article>
      </aside>
    </div>
  `;

  const [pauseButton, codexButton, backButton] =
    section.querySelectorAll<HTMLButtonElement>(".hero-button");

  pauseButton?.addEventListener(
    "click",
    isPaused ? options.actions.onResume : options.actions.onPause,
  );
  codexButton?.addEventListener("click", options.actions.onOpenCodex);
  backButton?.addEventListener("click", options.actions.onBack);

  main.append(section);
  return main;
}
