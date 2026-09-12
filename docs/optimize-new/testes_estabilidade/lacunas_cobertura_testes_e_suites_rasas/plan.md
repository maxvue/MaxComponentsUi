# Plano de implementação — suíte sem warnings e cobertura mínima

## Objetivo e resultado

Fazer warnings/erros inesperados falharem testes, estabilizar fixtures globais e adotar thresholds graduais, incluindo teste comportamental de `useListMenusStore`.

## Escopo e fora de escopo

- Política global de console/Vue warnings com allowlist local.
- Thresholds de cobertura e teste do store órfão.
- Corrigir mocks Pinia/router/componentes responsáveis pelos warnings atuais.
- Não duplicar testes específicos de IndexedDB, SSR ou concorrência de outros achados.

## Arquivos

- Alterar `tests/setup.ts` e `vitest.config.ts`.
- Criar `tests/stores/useListMenus.Store.test.ts`.
- Ajustar testes/fixtures que hoje geram warnings.
- Integrar o comando ao `verify` do achado de gates.

## Dependências e ordem

1. Inventariar warnings por teste.
2. Instalar capturadores que acumulam e falham no `afterEach`.
3. Corrigir fixtures.
4. Adicionar cobertura do store e thresholds.
5. Subir thresholds por ratchet.

## Passos

1. Restaurar `console.error` ao fim e remover supressão global de erros de ícone.
2. Capturar `console.warn/error` e `app.config.warnHandler/errorHandler`; mensagens deliberadas exigem spy/asserção local.
3. Corrigir stubs de `LoaderIcon`, plugins Pinia únicos, router/route e mounts fora de setup.
4. Garantir isolamento/reset de mocks, timers, DOM e handlers entre testes.
5. Testar `useListMenusStore` com `useRefCachedApi` controlado e rota configurada/resetada.
6. Fixar thresholds iniciais próximos ao baseline sem reduzi-lo (statements 85%, branches 76%, functions 84%, lines 89%) e usar `perFile` para módulos críticos selecionados.
7. Documentar processo de aumento e proibir redução não justificada.

## Migração e testes

Sem API de runtime. Testes que intencionalmente provocam warning passam a afirmá-lo explicitamente. Criar meta-testes do capturador e executar suíte em ordem aleatória/repetida. A11y/benchmark não são pertinentes.

## Aceite

- Suíte completa termina sem warning/erro inesperado.
- Warning injetado faz o teste falhar; warning esperado é contado localmente.
- Cobertura abaixo de qualquer threshold sai com código não zero.
- `useListMenusStore` possui teste de rota, retorno e isolamento.
- Métricas não ficam abaixo do baseline registrado.

## Riscos e rollback

Bibliotecas podem emitir warnings inevitáveis; usar allowlist estreita por teste, nunca substring global. Thresholds podem oscilar por instrumentação Vue; aplicar ratchet com margem documentada. Rollback temporário reduz somente o gate afetado com issue/prazo.

## Validação final

Executar suíte três vezes, cobertura, teste do store, `npm run verify` e `git diff --check`.
