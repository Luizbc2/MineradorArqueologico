import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Elemento #app não encontrado.");
}

app.innerHTML = `
  <main class="app-shell">
    <section class="hero-card">
      <p class="eyebrow">Reconstrução em andamento</p>
      <h1>Minerador Arqueológico</h1>
      <p class="description">
        A base do projeto foi migrada para Vite + TypeScript. Nos próximos commits,
        vamos reconstruir o jogo com arquitetura moderna, visual mais forte e gameplay
        mais consistente para portfólio.
      </p>
      <div class="status-list" aria-label="Status inicial do projeto">
        <span>Vite configurado</span>
        <span>TypeScript ativo</span>
        <span>Entrada moderna pronta</span>
      </div>
    </section>
  </main>
`;
