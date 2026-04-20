export const archaeologyFacts = [
  "As Pinturas Rupestres de Arapoti registram cenas humanas, animais e simbolos geometricos usados como memoria visual e ritual.",
  "As Casas Subterraneas de Irati mostram como povos Itarare-Taquara adaptaram suas moradias ao frio do planalto.",
  "A Ceramica de Ponta Grossa evidencia trocas culturais entre diferentes grupos indigenas do Parana pre-colonial.",
  "Os Sambaquis de Morretes revelam ocupacoes ligadas a pesca, coleta e uso cuidadoso dos recursos naturais do litoral.",
  "A Aldeia de Bituruna indica interacao entre Guarani e Kaingang por meio de ferramentas, ceramicas e restos alimentares.",
  "As Rotas Indigenas do Planalto conectavam litoral e interior, servindo para deslocamento, comercio e contato cultural.",
  "O Sambaqui de Matinhos apresenta camadas de ocupacao prolongada e possiveis rituais funerarios em area costeira.",
  "A Ceramica Pintada de Telemaco Borba usava pigmentos minerais e padroes geometricos em contextos domesticos e rituais.",
  "As Pinturas do Canyon Guartela preservam narrativas visuais associadas a caca, fertilidade e memoria ancestral.",
  "As Ceramicas Guarani do litoral ajudam a reconstruir aspectos da vida cotidiana, do simbolismo e da religiosidade indigena.",
] as const;

export type ArchaeologyDeck = {
  collectedCount: number;
  totalCount: number;
  drawNextCard: () => string;
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

export function createArchaeologyDeck(seed = 0xabc123) {
  const random = createSeededRandom(seed);
  const pool = [...archaeologyFacts];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[nextIndex]] = [pool[nextIndex], pool[index]];
  }

  let collectedCount = 0;

  const deck: ArchaeologyDeck = {
    get collectedCount() {
      return collectedCount;
    },
    totalCount: archaeologyFacts.length,
    drawNextCard: () => {
      collectedCount += 1;
      return pool.pop() ?? "Voce ja encontrou todos os cards arqueologicos desta expedicao.";
    },
  };

  return deck;
}
