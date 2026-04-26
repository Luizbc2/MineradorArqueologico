export const archaeologyFacts = [
  "As Pinturas Rupestres de Arapoti registram cenas humanas, animais e símbolos geométricos usados como memória visual e ritual.",
  "As Casas Subterrâneas de Irati mostram como povos Itararé-Taquara adaptaram suas moradias ao frio do planalto.",
  "A Cerâmica de Ponta Grossa evidencia trocas culturais entre diferentes grupos indígenas do Paraná pré-colonial.",
  "Os Sambaquis de Morretes revelam ocupações ligadas à pesca, coleta e uso cuidadoso dos recursos naturais do litoral.",
  "A Aldeia de Bituruna indica interação entre Guarani e Kaingang por meio de ferramentas, cerâmicas e restos alimentares.",
  "As Rotas Indígenas do Planalto conectavam litoral e interior, servindo para deslocamento, comércio e contato cultural.",
  "O Sambaqui de Matinhos apresenta camadas de ocupação prolongada e possíveis rituais funerários em área costeira.",
  "A Cerâmica Pintada de Telêmaco Borba usava pigmentos minerais e padrões geométricos em contextos domésticos e rituais.",
  "As Pinturas do Canyon Guartelá preservam narrativas visuais associadas à caça, fertilidade e memória ancestral.",
  "As Cerâmicas Guarani do litoral ajudam a reconstruir aspectos da vida cotidiana, do simbolismo e da religiosidade indígena.",
] as const;

export type ArchaeologyDeck = {
  collectedCount: number;
  totalCount: number;
  drawNextCard: () => string;
};

export type ArchaeologyDeckState = {
  collectedCount: number;
};

function createSeededRandom(seed: number) {
  let current = seed >>> 0;

  return () => {
    current += 0x6d2b79f5;
    let value = current;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDefaultArchaeologyDeckState(): ArchaeologyDeckState {
  return {
    collectedCount: 0,
  };
}

export function normalizeArchaeologyDeckState(
  state: Partial<ArchaeologyDeckState> = {},
): ArchaeologyDeckState {
  return {
    collectedCount: Math.min(
      archaeologyFacts.length,
      normalizePositiveInteger(state.collectedCount),
    ),
  };
}

export function createArchaeologyDeck(initialState?: Partial<ArchaeologyDeckState>, seed = 0xabc123) {
  const random = createSeededRandom(seed);
  const pool = [...archaeologyFacts];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[nextIndex]] = [pool[nextIndex], pool[index]];
  }

  let collectedCount = normalizeArchaeologyDeckState(initialState).collectedCount;

  for (let index = 0; index < collectedCount; index += 1) {
    pool.pop();
  }

  const deck: ArchaeologyDeck = {
    get collectedCount() {
      return collectedCount;
    },
    totalCount: archaeologyFacts.length,
    drawNextCard: () => {
      if (collectedCount >= archaeologyFacts.length) {
        return "Você já encontrou todos os cards arqueológicos desta expedição.";
      }

      collectedCount += 1;
      return pool.pop() ?? "Você já encontrou todos os cards arqueológicos desta expedição.";
    },
  };

  return deck;
}

function normalizePositiveInteger(value: unknown) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0;
}
