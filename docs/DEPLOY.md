# Deploy

## Build de producao

Use:

```bash
npm install
npm run build
```

O build final fica em `dist/`.

Para validar localmente o pacote pronto:

```bash
npm run preview:host
```

Isso sobe uma versao parecida com a de producao e deixa o servidor acessivel na rede local.

## Estrategia atual de bundle

O projeto usa `Vite` com separacao manual de chunks:

- `phaser`: motor do jogo
- `vendor`: outras dependencias de terceiros
- `index`: codigo da aplicacao

Isso melhora cache, reduz o peso do chunk principal da aplicacao e deixa o deploy mais previsivel.

## Onde subir

Como o resultado e um site estatico, funciona bem em:

- `GitHub Pages`
- `Netlify`
- `Vercel`
- `Cloudflare Pages`

## GitHub Pages

Fluxo simples:

1. Rode `npm run build`.
2. Publique o conteudo da pasta `dist/`.
3. Aponte o Pages para a branch/pasta em que o build foi publicado.

Se voce preferir automatizar depois, da para adicionar um workflow de GitHub Actions sem mudar a arquitetura do jogo.

## Netlify / Vercel / Cloudflare Pages

Configuracao recomendada:

- Build command: `npm run build`
- Output directory: `dist`

## Observacoes

- O projeto usa `TypeScript` e valida tipos durante o build.
- O jogo depende de interacao do usuario para liberar audio no navegador, o que e esperado em producao.
- Se o deploy for em subpasta customizada no futuro, talvez valha ajustar o `base` do Vite conforme a URL final.
