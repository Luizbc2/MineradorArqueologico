# Minerador Arqueológico

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-8b5cf6?style=for-the-badge&logo=vite&logoColor=ffffff)](https://vite.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3-1f2937?style=for-the-badge&logo=javascript&logoColor=f7df1e)](https://phaser.io/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=ffffff)](https://mineradorarqueologico.vercel.app/)

Jogo web 2D de mineração incremental desenvolvido com Phaser, TypeScript e Vite. O jogador explora uma mina em blocos, coleta minérios, vende recursos na superfície, compra picaretas melhores, evolui upgrades e completa metas de expedição.

O foco do projeto é juntar uma experiência simples de jogar no navegador com sistemas de progressão, economia, inventário e interface em pixel art.

## Link publicado

- Site: https://mineradorarqueologico.vercel.app/

## O que tem no jogo

- Mundo de mineração em blocos com profundidade, recursos e baús arqueológicos.
- Catálogo de picaretas com tiers, força, velocidade, preço e desbloqueio por profundidade.
- Oficina com upgrades de força, velocidade, mochila, venda e moedas de baú.
- Mochila com capacidade limitada, valor estimado, barra de preenchimento e bônus por venda cheia.
- Posto de venda com resumo do lote, média por item e bônus ativos.
- Sistema de metas de expedição com recompensas permanentes.
- Cards arqueológicos coletáveis encontrados em baús.
- Mira inteligente inspirada no modo de mineração facilitada do Terraria.
- HUD em HTML/CSS por cima do canvas do Phaser.
- Save local via `localStorage`.
- Áudio procedural para passos, mineração, moedas, upgrades e eventos.

## Tecnologias do projeto

- TypeScript
- Phaser 3
- Vite
- HTML
- CSS
- Vercel

## Como rodar localmente

```bash
npm install
npm run dev
```

Para gerar a build de produção:

```bash
npm run build
```

Para visualizar a build local:

```bash
npm run preview
```

## Estrutura principal

```bash
src/
  app/
    phaser/
  assets/
    pickaxes/
    player/
    signs/
    surface/
  game/
    archaeology/
    audio/
    economy/
    inventory/
    player/
    progression/
    save/
    world/
  scenes/
  ui/
    hud/
    overlays/
    theme/
```

## Sistemas principais

### Mineração

O mapa é formado por tiles com diferentes materiais, durezas e recompensas. A velocidade para quebrar blocos considera a picareta equipada, upgrades comprados, profundidade e bônus de metas.

### Progressão

O jogador evolui comprando picaretas e upgrades, descendo mais fundo e completando metas. As metas liberam bônus permanentes como mais velocidade de mineração, maior janela de combo e velocidade de passo.

### Economia

Os minérios têm valores diferentes por raridade. A venda pode ser melhorada com upgrades e também ganha bônus quando a mochila volta quase cheia para a superfície.

### Interface

O jogo usa Phaser para o mundo e HTML/CSS para HUD, menus e overlays. Isso permite textos mais nítidos, menus mais responsivos e componentes de interface mais fáceis de ajustar.

## Autor

**Luiz Otávio**

- GitHub: https://github.com/Luizbc2
- LinkedIn: https://www.linkedin.com/in/luiz-otavio-mello-de-campos-66699224b/
