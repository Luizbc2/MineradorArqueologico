# Arquitetura Inicial

Estrutura base para a migracao gradual do projeto:

- `src/app`
  - bootstrap e pontos de entrada
- `src/game/legacy`
  - ponte temporaria para o jogo atual em Canvas 2D
- `src/scenes`
  - cenas Phaser
- `src/systems`
  - regras, estado, progressao e servicos do jogo
- `src/ui`
  - HUD, overlays e interface
- `src/assets`
  - recursos visuais e sonoros da nova pipeline

Regra desta fase:
- manter o jogo atual funcionando
- migrar um sistema por vez
- evitar commit grande que misture arquitetura com gameplay
