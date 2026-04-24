# Plano Completo do Hub, Economia e Progressao

## Objetivo

Transformar a superficie em um hub funcional e dar ao jogo um loop de progressao economica claro:

- descer para minerar
- voltar para a base
- vender recursos
- comprar picaretas novas
- comprar upgrades
- descer mais fundo
- encontrar blocos mais duros e minerios mais valiosos

O foco nao e virar um jogo complexo de gerenciamento. O foco e criar um loop viciante, legivel e escalavel para browser game:

- risco x recompensa
- retorno rapido
- decisao clara de gasto
- melhoria perceptivel a cada compra

## Fantasia do Jogador

O jogador deve sentir que:

- esta operando uma pequena base de mineracao
- cada descida vale a pena
- voltar a superficie e uma decisao economica, nao so um reset
- a ferramenta evolui de verdade
- profundidade significa perigo, lentidao e riqueza

## Principios de Design

1. Superficie e hub, nao apenas spawn.
2. Picareta e equipamento. Upgrade e melhoria separada.
3. Cada sistema novo precisa reforcar o loop principal, nao competir com ele.
4. O jogador deve entender em poucos segundos:
   - o que vende
   - onde compra
   - por que descer mais fundo
5. A UI nao deve substituir o mundo. Interacoes importantes acontecem no mapa.
6. Tudo deve entrar em passos pequenos e revisaveis.

## Loop Final Desejado

1. Jogador nasce na base.
2. Desce e minera.
3. Enche a mochila com recursos.
4. O mundo vai ficando mais resistente com a profundidade.
5. Recursos mais raros comecam a aparecer mais fundo.
6. O jogador decide voltar para a base.
7. Interage com o ponto de venda.
8. Converte recursos em moedas.
9. Interage com a oficina.
10. Decide entre:
    - comprar nova picareta
    - comprar upgrade
11. Volta a mina mais eficiente que antes.

## Estrutura do Hub da Superficie

### Centro

- continua como area neutra de chegada
- entrada visual da mina
- sem menu proprio
- funcao principal: retorno e orientacao

### Lado esquerdo: Ponto de Venda

Identidade visual:

- madeira
- balcao
- placas de comercio
- caixas, sacos, minerio exposto
- leitura rapida de "mercado" ou "posto de compra"

Funcao:

- vender recursos
- mostrar valor total do inventario
- depois, opcionalmente, vender por item

Interacao:

- prompt contextual `E INTERAGIR`
- abre overlay DOM de venda

### Lado direito: Oficina

Identidade visual:

- mais industrial
- metal, bancada, ferramentas, suporte de pecas
- leitura rapida de "forja/oficina"

Funcao:

- comprar picaretas
- comprar upgrades

Interacao:

- prompt contextual `E INTERAGIR`
- abre overlay DOM da oficina

### Regra importante

Os dois pontos nao devem parecer duas casinhas iguais com cores diferentes.

Eles precisam ter:

- silhuetas diferentes
- props diferentes
- leitura funcional diferente mesmo sem texto

## Sistemas Finais

### 1. Economia

Estado minimo:

- `coins`
- tabela de preco por recurso

Comportamento:

- vender transforma inventario em moedas
- venda inicial e manual via `VENDER TUDO`
- inventario vendido e zerado

Decisao de design:

- nao vender automaticamente ao chegar na base
- nao colocar botao de venda na HUD
- a venda precisa ser uma interacao diegetica com o mundo

### 2. Picaretas

Picaretas sao equipamentos, nao upgrades numericos abstratos.

Cada picareta precisa ter:

- `id`
- `name`
- `tier`
- `cost`
- `basePower`
- `baseSpeed`
- `unlockDepth` ou prerequisito opcional
- `owned`
- `equipped`

Exemplo de progressao:

- Picareta Gasta
- Picareta de Cobre
- Picareta de Ferro
- Picareta de Aco
- Picareta de Titanio

Responsabilidade da picareta:

- definir o patamar base de performance
- permitir o acesso confortavel a blocos mais profundos
- criar marcos claros de progressao

### 3. Upgrades

Upgrades sao melhorias complementares permanentes.

Cada upgrade precisa ter:

- `id`
- `name`
- `description`
- `baseCost`
- `growth`
- `currentLevel`
- `maxLevel` opcional
- `effectPerLevel`

Upgrades iniciais recomendados:

- `power`
- `speed`

Upgrades futuros:

- `comboWindow`
- `fortune`
- `surfaceReturnBonus`
- `rareFind`

Regra de design:

- nao misturar compra de picareta com aumento de nivel da picareta
- equipamento e uma camada
- upgrades permanentes sao outra camada

### 4. Dificuldade por Profundidade

Cada bloco precisa ter:

- dureza base por tipo de material
- multiplicador de profundidade

Objetivo:

- tornar profundidade uma barreira economica real
- manter o loop de compra sempre relevante

Exemplo conceitual:

- `stone` raso e facil
- `stone` profundo e mais resistente
- `gold` fundo e mais duro que `coal`
- `diamond` profundo exige ferramenta melhor

### 5. Minerios por Camada

A geracao precisa comunicar:

- perto da superficie: volume maior, valor baixo
- medio: transicao de risco e valor
- fundo: raridade alta, valor alto, dureza alta

Exemplo de camada:

- `0m-20m`: carvao dominante, ferro ocasional
- `20m-60m`: ferro dominante, ouro aparecendo
- `60m+`: ouro forte, diamante aparecendo, espaco para novos minerios

### 6. Persistencia

Sem persistencia, a economia perde valor.

Precisamos salvar:

- moedas
- inventario
- picaretas compradas
- picareta equipada
- upgrades e niveis
- progresso de metas relevantes

Persistencia pode entrar depois da primeira versao jogavel do loop, mas nao deve ficar esquecida.

## Arquitetura Recomendada

### Economia

Arquivos sugeridos:

- `src/game/economy/sellValues.ts`
- `src/game/economy/currency.ts`

Responsabilidade:

- preco dos recursos
- calculo do total de venda
- regras de conversao recurso -> moeda

### Catalogo de Picaretas

Arquivos sugeridos:

- `src/game/progression/pickaxeCatalog.ts`
- `src/game/progression/pickaxeState.ts`

Responsabilidade:

- definicoes dos tiers
- ownership
- equipado atual
- validacao de compra/equip

### Upgrades

Arquivos sugeridos:

- `src/game/progression/upgradeCatalog.ts`
- `src/game/progression/upgradeState.ts`

Responsabilidade:

- definicoes dos upgrades
- niveis
- custo atual
- calculo de bonus acumulado

### UI / Overlays

Arquivos sugeridos:

- `src/ui/overlays/VendorOverlay.ts`
- `src/ui/overlays/WorkshopOverlay.ts`

Responsabilidade:

- renderizar menus DOM
- consumir estado do scene
- emitir callbacks de compra/venda

### Integracao no Scene

Arquivo principal:

- `src/scenes/MineScene.ts`

Responsabilidade:

- zonas de interacao no mapa
- prompt contextual
- abrir/fechar overlays
- manter estado em runtime
- aplicar stats na mineracao

### HUD

Arquivo principal:

- `src/ui/hud/MineHud.ts`

Responsabilidade:

- mostrar moeda de forma compacta quando a economia entrar
- nao virar painel gigante
- permanecer minimalista

## Modelo de Dados Sugerido

### Estado economico

```ts
type EconomyState = {
  coins: number;
};
```

### Estado de picaretas

```ts
type PickaxeDefinition = {
  id: string;
  name: string;
  tier: number;
  cost: number;
  basePower: number;
  baseSpeed: number;
};

type PickaxeState = {
  ownedIds: string[];
  equippedId: string;
};
```

### Estado de upgrades

```ts
type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  growth: number;
  effectPerLevel: number;
};

type UpgradeState = {
  levels: Record<string, number>;
};
```

## Formula de Mineracao Recomendada

Nao implementar de forma arbitraria. A logica precisa ser previsivel.

Separacao recomendada:

- `baseHardness` do bloco
- `depthMultiplier`
- `pickaxeBasePower`
- `pickaxeBaseSpeed`
- `upgradePowerBonus`
- `upgradeSpeedBonus`

Formula conceitual:

```ts
effectiveHardness = baseHardness * depthMultiplier
effectivePower = pickaxeBasePower + upgradePowerBonus
effectiveSpeed = pickaxeBaseSpeed * (1 + upgradeSpeedBonus)
miningRate = (effectivePower / effectiveHardness) * effectiveSpeed
```

Objetivo da formula:

- profundidade impacta tudo
- nova picareta tem salto perceptivel
- upgrade complementa, nao substitui, a picareta

## Formula de Venda Recomendada

Cada recurso recebe um valor base.

Exemplo inicial:

- carvao: 4
- ferro: 9
- ouro: 18
- diamante: 34

Calculo inicial:

```ts
total = sum(resourceCount * sellValue)
```

Sem multiplicadores escondidos na primeira fase.

Primeira versao deve ser simples para balancear com clareza.

## UI / UX Recomendadas

### Prompt de interacao

Quando o jogador estiver perto:

- aparece pequena label `E INTERAGIR`
- preferencialmente perto do objeto fisico
- nao no centro da tela

### Overlay de venda

Conteudo minimo:

- titulo `PONTO DE VENDA`
- lista de recursos e quantidades
- valor total
- botao `VENDER TUDO`
- botao `FECHAR`

### Overlay da oficina

Conteudo minimo:

- titulo `OFICINA`
- moeda atual
- abas:
  - `PICARETAS`
  - `UPGRADES`

#### Aba Picaretas

- lista de picaretas
- preco
- stats base
- estado:
  - comprada
  - equipada
  - indisponivel

#### Aba Upgrades

- lista de upgrades
- nivel atual
- proximo bonus
- preco do proximo nivel

## Ordem Recomendada de Implementacao

### Fase 1: Fundacao sem UI agressiva

Objetivo:

- preparar dados sem quebrar o jogo

Commits:

1. `docs: add hub economy and progression plan`
2. `chore(economy): add coins state and ore sell values`

### Fase 2: Hub fisico

Objetivo:

- transformar os dois pontos da superficie em estruturas com papeis claros

Commits:

3. `refactor(surface): replace left hub structure with vendor stand`
4. `refactor(surface): replace right hub structure with workshop`

### Fase 3: Interacao contextual

Objetivo:

- preparar o mapa para menus contextuais

Commits:

5. `feat(surface): add vendor interaction zone and prompt`
6. `feat(surface): add workshop interaction zone and prompt`

### Fase 4: Venda

Objetivo:

- fechar o primeiro loop economico completo

Commits:

7. `feat(ui): add vendor overlay shell`
8. `feat(shop): implement sell all inventory flow`
9. `feat(hud): show coins in compact status area`

### Fase 5: Picaretas

Objetivo:

- introduzir equipamentos como camada de progressao

Commits:

10. `feat(pickaxes): add pickaxe catalog and ownership state`
11. `feat(ui): add workshop pickaxe tab`
12. `feat(shop): implement buy and equip pickaxes`

### Fase 6: Upgrades

Objetivo:

- adicionar melhoria permanente complementar

Commits:

13. `feat(upgrades): add upgrade definitions and level state`
14. `feat(ui): add workshop upgrade tab`
15. `feat(shop): implement upgrade purchases`

### Fase 7: Aplicacao na mineracao

Objetivo:

- fazer o sistema economico alterar o gameplay real

Commits:

16. `feat(mining): apply equipped pickaxe stats to mining`
17. `feat(mining): scale block hardness by depth`
18. `feat(world): rebalance ore generation by depth layers`

### Fase 8: Persistencia e polimento

Objetivo:

- fazer a progressao sobreviver entre sessoes

Commits:

19. `feat(save): persist coins pickaxes upgrades and inventory`
20. `polish(surface): add signage props and shop feedback`

## Riscos Tecnicos

### 1. Misturar tudo no MineScene

Risco:

- o scene virar uma classe monolitica ainda pior

Mitigacao:

- novos catalogos e regras em `src/game/`
- `MineScene` apenas orquestra

### 2. UI grande demais

Risco:

- transformar o hub em um jogo de menu e perder a mina

Mitigacao:

- overlays compactos
- interacao contextual
- HUD minimalista

### 3. Economias redundantes

Risco:

- picareta e upgrade fazerem exatamente a mesma coisa

Mitigacao:

- picareta = patamar base
- upgrade = refinamento incremental

### 4. Balanceamento ruim

Risco:

- ficar facil demais cedo
- ficar impossivel fundo demais

Mitigacao:

- primeira versao simples
- poucas variaveis
- rebalancear com dados reais depois

## Regras de Implementacao

1. Cada commit deve manter o jogo jogavel.
2. Cada commit deve ter uma responsabilidade clara.
3. Nao misturar arte do hub, economia, UI e mineracao no mesmo commit sem necessidade.
4. Preferir hooks e estados pequenos a grandes refactors de uma vez.
5. Quando possivel, terminar uma cadeia completa antes da proxima.

Exemplo correto:

- moedas entram
- depois venda entra
- depois oficina entra

Exemplo errado:

- metade de moedas
- metade de pickaxes
- metade de upgrades
- tudo quebrado ao mesmo tempo

## Criterios de Sucesso

O sistema esta funcionando bem quando:

- voltar a superficie e uma decisao valiosa
- vender recursos da satisfacao imediata
- comprar uma picareta nova muda claramente a sensacao de minerar
- upgrades sao entendiveis e desejaveis
- descer mais fundo e assustador, mas recompensador
- o hub fica vivo e legivel sem poluir a tela

## Antigo vs Novo

### Antes

- superficie como area de retorno
- inventario sem loop economico completo
- progressao limitada

### Depois

- superficie como hub
- economia clara
- equipamento + upgrades
- mundo com curva de dificuldade
- loop com motivacao de longo prazo

## Decisao Final Recomendada

Quando comecar a implementacao de verdade, a melhor sequencia e:

1. preparar economia
2. refazer os dois pontos fisicos do hub
3. colocar interacao de venda
4. fechar o loop de moedas
5. so depois abrir a camada de picaretas e upgrades

Essa ordem e a mais segura tecnicamente e a mais forte em valor de gameplay.
