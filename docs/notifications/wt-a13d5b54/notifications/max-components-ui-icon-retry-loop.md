# Falha de ícones pode realimentar a própria fila

- Data: 19/10/2026.
- Projeto/worktree: MaxComponentsUi / `wt-a13d5b54`.
- Situação: achado no escopo do plano de correção; não implementado nem reproduzido nesta sessão.

## Localização e evidência

- `src/stores/useIcon.Store.ts:74–75`: um valor vazio no mapa é considerado ausência e vira `'waiting'`.
- `src/stores/useIcon.Store.ts:220–223`: após quatro falhas por nome, a store grava `''` como terminal.
- `src/components/MaxIcon.vue:165–167`: `watchEffect` chama `getIcon`, incluindo as leituras síncronas reativas da action no rastreamento do efeito.
- `src/stores/useIcon.Store.ts:168–259`: fila/erros disparam o watcher profundo, sem reserva de execução por nome.
- `src/stores/useIcon.Store.ts:192–200`: uma string rejeitada pelo sanitizador não é encaminhada ao fallback e ainda limpa o contador.

## Impacto

Uma chamada posterior ao esgotamento pode reabrir a fila. Alterações reativas e respostas lentas podem multiplicar requisições e mensagens, compatível com o travamento relatado pelo usuário. Não foi verificada a disponibilidade do nome informado no serviço externo.

## Encaminhamento

Planejado em `docs/plans/wt-a13d5b54/spec.md` e `plan.md`: terminal estável, gatilho explícito, deduplicação, orçamento de falhas e testes de regressão. Preservar cache, sanitização e recuperação temporária de rede.
