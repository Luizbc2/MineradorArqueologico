# Revisao de seguranca do cliente

## Contexto

O jogo roda como aplicacao estatica no navegador. Nao existe backend autoritativo, login, sessao, API de economia ou banco de dados remoto. Por isso, qualquer dado mantido no cliente deve ser tratado como manipulavel por DevTools.

As defesas atuais servem para reduzir abuso casual e evitar persistencia simples de save editado. Elas nao tornam a economia inviolavel contra alguem com controle total do navegador.

## Vetores encontrados

### Edicao de save local

- Impacto: moedas, inventario, upgrades e picaretas podiam ser alterados diretamente no `localStorage`.
- Mitigacao aplicada: save envelopado com checksum, normalizacao no carregamento, limite por profundidade, limite de mochila, auditoria de orcamento ganho e reset de saves antigos.
- Validacao: editar manualmente o save deve fazer o jogo voltar para valores normalizados ou resetar progresso invalido.

### Mutacao de estado em runtime

- Impacto: scripts no console podiam alterar `worldGrid`, moedas, inventario, posicao e chamar metodos TypeScript `private`, porque eles existem como metodos normais no JavaScript gerado.
- Mitigacao aplicada: grade canonica em `WeakMap`, restauracao de blocos adulterados, bloqueio de teleporte brusco e conversao de operacoes sensiveis para `#private` real em ES2022.
- Validacao: chamadas diretas como metodos publicos no objeto da cena nao devem estar disponiveis para vender, comprar, alterar mundo confiavel ou coletar drop.

### Compra e venda por estado adulterado

- Impacto: o jogador podia forcar saldo/inventario antes de vender ou comprar.
- Mitigacao aplicada: auditoria de progressao antes de abrir oficina, vender, comprar e a cada frame.
- Validacao: alterar moedas ou recursos pelo console deve ser revertido antes da transacao persistir.

### Limite real

Um atacante com tempo ainda pode alterar o bundle em memoria, interceptar funcoes, pausar no debugger ou reconstruir um save internamente consistente, porque o cliente ainda e a fonte da verdade. A solucao definitiva e mover economia, inventario, compras, drops e posicao validada para um servidor.

## Proxima etapa recomendada

1. Criar backend autoritativo para save e economia.
2. Enviar apenas comandos do jogador: mover, minerar, vender, comprar.
3. Validar no servidor: alcance, cooldown, bloco quebrado, drop, saldo, unlock por profundidade e capacidade da mochila.
4. Retornar snapshot assinado para o cliente renderizar.
5. Manter localStorage apenas como cache visual, nunca como fonte de verdade.
