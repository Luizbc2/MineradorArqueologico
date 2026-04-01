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

  const shell = document.createElement("section");
  shell.className = "game-shell";

  shell.innerHTML = `
    <header class="shell-topbar" aria-label="Resumo do projeto">
      <div class="topbar-brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <div>
          <p class="topbar-label">Portfolio build</p>
          <strong>${options.title}</strong>
        </div>
      </div>

      <div class="topbar-status" aria-label="Status da arquitetura">
        <span>estado: ${options.state.screen}</span>
        <span>render: ${options.renderer.mode}</span>
        <span>mundo: ${options.world.width} x ${options.world.depth}</span>
      </div>
    </header>

    <div class="shell-layout">
      <section class="hero-card">
        <p class="eyebrow">Reconstrucao premium</p>
        <h1>${options.title}</h1>
        <p class="description">${options.subtitle}</p>

        <div class="hero-actions" aria-label="Direções do projeto">
          <button class="hero-button hero-button--primary" type="button">Iniciar reconstrução</button>
          <button class="hero-button hero-button--ghost" type="button">Ver arquitetura base</button>
        </div>

        <div class="status-list" aria-label="Pilares da reconstrução">
          <span>canvas 2d</span>
          <span>typescript</span>
          <span>save local</span>
          <span>feedback visual</span>
          <span>portfolio ready</span>
        </div>

        <section class="playframe" aria-label="Prévia da área principal do jogo">
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
              <span>Picareta</span>
              <strong>Lv ${options.player.pickaxeLevel}</strong>
            </div>
          </div>

          <div class="playframe-canvas">
            <div class="canvas-glow"></div>
            <div class="canvas-grid"></div>
            <div class="player-chip">
              <span class="player-chip__avatar" aria-hidden="true"></span>
              <div>
                <strong>${options.player.name}</strong>
                <p>pronto para explorar o subterrâneo</p>
              </div>
            </div>
            <div class="ore ore--gold"></div>
            <div class="ore ore--cyan"></div>
            <div class="ore ore--ember"></div>
          </div>
        </section>
      </section>

      <aside class="side-panel" aria-label="Resumo do produto">
        <article class="info-card info-card--feature">
          <strong>Visão do jogo</strong>
          <p>
            Explorar, cavar, evoluir equipamentos e desbloquear descobertas arqueológicas
            em uma experiência web mais polida e vendável.
          </p>
        </article>

        <article class="info-card">
          <strong>Arquitetura ativa</strong>
          <ul class="detail-list">
            <li>app + bootstrap isolados</li>
            <li>core para estado e configuração</li>
            <li>game separado por domínio</li>
            <li>ui e styles independentes</li>
          </ul>
        </article>

        <article class="info-card">
          <strong>Próximos ganhos</strong>
          <ul class="detail-list">
            <li>shell visual com HUD real</li>
            <li>copy em pt-BR revisada</li>
            <li>fluxo de jogo mais legível</li>
            <li>base pronta para canvas real</li>
          </ul>
        </article>
      </aside>
    </div>
  `;

  main.append(shell);
  return main;
}
