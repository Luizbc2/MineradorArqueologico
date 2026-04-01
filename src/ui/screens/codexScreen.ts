import type { GameState } from "../../types/app";

type CodexScreenOptions = {
  state: GameState;
  onBack: () => void;
  onStart: () => void;
};

export function createCodexScreen(options: CodexScreenOptions) {
  const main = document.createElement("main");
  main.className = "app-shell";

  const section = document.createElement("section");
  section.className = "game-shell";

  section.innerHTML = `
    <header class="shell-topbar" aria-label="Navegação do códice">
      <div class="topbar-brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <div>
          <p class="topbar-label">Fluxo de produto</p>
          <strong>Códice arqueológico</strong>
        </div>
      </div>

      <div class="topbar-status" aria-label="Estado atual">
        <span>estado: ${options.state.screen}</span>
        <span>coleção: em preparação</span>
      </div>
    </header>

    <div class="shell-layout shell-layout--single">
      <section class="hero-card">
        <p class="eyebrow">Coleção narrativa</p>
        <h1>Descobertas, curiosidades e progresso cultural</h1>
        <p class="description">
          Esta tela já entra no fluxo do app para receber cartas arqueológicas, itens
          colecionáveis e metas de exploração nas próximas etapas.
        </p>

        <div class="info-grid">
          <article class="info-card">
            <strong>Pronto para receber</strong>
            <p>cards desbloqueados, raridade, descrição e progresso da coleção.</p>
          </article>
          <article class="info-card">
            <strong>Função no jogo</strong>
            <p>transformar exploração em descoberta e dar mais identidade ao projeto.</p>
          </article>
        </div>

        <div class="hero-actions">
          <button class="hero-button hero-button--primary" type="button">Ir para o jogo</button>
          <button class="hero-button hero-button--ghost" type="button">Voltar ao início</button>
        </div>
      </section>
    </div>
  `;

  const [startButton, backButton] = section.querySelectorAll<HTMLButtonElement>(".hero-button");
  startButton?.addEventListener("click", options.onStart);
  backButton?.addEventListener("click", options.onBack);

  main.append(section);
  return main;
}
