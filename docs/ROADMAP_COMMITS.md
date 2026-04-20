# Roadmap de Modernizacao

Base atual preservada:
- Jogo legado em `HTML + CSS + JavaScript + Canvas 2D`
- Arquivos principais: `index.html`, `css/style.css`, `js/game.js`
- Estado inicial de referencia: commit `cda55da`

Objetivo:
- Modernizar o jogo sem perder sua identidade
- Melhorar visual, animacoes, organizacao do codigo e motivacao de gameplay
- Evoluir em pequenos passos, com commits claros e revisaveis

Sequencia planejada de commits:

1. `docs: add modernization roadmap and legacy baseline`
2. `chore: scaffold vite phaser and typescript project base`
3. `chore: organize src structure for scenes systems ui and assets`
4. `feat: add boot and preload scenes with base phaser config`
5. `feat: create main mine scene with camera and world bounds`
6. `feat: port procedural terrain generation to typed world system`
7. `feat: add player entity movement gravity and spawn flow`
8. `feat: implement mining system and block destruction`
9. `feat: add ore drops inventory tracking and pickup feedback`
10. `feat: add in-game hud for depth energy pickaxe and inventory`
11. `feat: add chest interaction and archaeology card flow`
12. `feat: add upgrade panel and pickaxe progression`
13. `feat: add return-to-surface flow and safe reset area`
14. `feat: add particles screen shake and mining juice`
15. `feat: add cave lighting atmosphere and depth ambience`
16. `style: polish menus typography colors and responsive layout`
17. `feat: add audio effects and simple sound controls`
18. `feat: add save system progression goals and deploy prep`

Observacoes:
- Cada etapa deve manter o jogo executavel
- Commits devem ser pequenos o suficiente para revisao facil
- Phaser e TypeScript entram como base tecnica, mas o foco continua sendo o jogo
