# Minerador Arqueológico

[![Site](https://img.shields.io/badge/Link-Projeto-7dffb7?style=for-the-badge&logo=vercel&logoColor=0b1510&labelColor=0b1510)](https://mineradorarqueologico.vercel.app/)

Jogo web 2D de mineração incremental com exploração em blocos, progressão de picaretas, upgrades, mochila limitada, venda de minérios e metas de expedição. O projeto foi pensado como um jogo casual de navegador, com visual em pixel art e sistemas de progressão inspirados em jogos de mineração.

## Stack

- Jogo: Phaser 3, TypeScript
- Build: Vite
- Interface: HTML, CSS
- Deploy: Vercel

## Como jogar

- Minere blocos para coletar recursos.
- Volte para a superfície para vender minérios.
- Use as moedas para comprar picaretas e upgrades.
- Desça mais fundo para liberar minérios, baús e metas melhores.
- Complete metas de expedição para ganhar bônus permanentes.

## Atalhos

- `A` / `D`: mover o minerador
- `S`: minerar para baixo
- Mouse: mirar e minerar blocos próximos
- `Ctrl`: alternar mira inteligente
- `B`: abrir ou fechar a mochila
- `V`: vender a mochila direto perto do vendedor
- `E`: interagir com oficinas, vendedor e baús
- `R`: voltar para a superfície

## Estrutura

```bash
src/
  app/
  assets/
  game/
  scenes/
  ui/
```

## O que o projeto entrega

- Mundo de mineração em blocos com profundidade e recursos variados
- Catálogo de picaretas com tiers, força, velocidade e desbloqueio por profundidade
- Oficina com upgrades de força, velocidade, mochila, venda e baús
- Mochila com capacidade limitada, barra de preenchimento e bônus por venda cheia
- Posto de venda com resumo do lote, média por item e bônus ativos
- Metas de expedição com recompensas permanentes
- Baús arqueológicos com cards colecionáveis e moedas
- Mira inteligente para facilitar a mineração
- Save local usando `localStorage`
- Validação local de progresso para reduzir alterações acidentais no save
- HUD e menus em HTML/CSS integrados ao Phaser

## Como rodar localmente

```bash
npm install
npm run dev
```

Para gerar a build de produção:

```bash
npm run build
```

## Autor

**Luiz Otávio**

- GitHub: https://github.com/Luizbc2
- LinkedIn: https://www.linkedin.com/in/luiz-otavio-mello-de-campos-66699224b/
