# Suíte verde tolera warnings de runtime e não possui limiares de cobertura

## Resumo
A suíte tem bom volume, mas o verde não é barreira confiável: warnings Vue, `console.error` e mocks incompletos não falham testes. Cobertura é reportada sem thresholds e fluxos críticos ausentes permanecem invisíveis.

## Severidade e prioridade
**Alta / P1.** Falsos positivos já encobrem componente não resolvido e montagens com injeções inválidas.

## Evidências
- `npm test -- --reporter=dot`: 176 arquivos/2.481 testes passam, mas há warnings de `LoaderIcon`, Pinia duplicada, router/route ausentes, `inject()` fora de setup e mutação de computed readonly.
- `tests/setup.ts:107-113` substitui `console.error` e silencia erros assíncronos de ícones.
- `vitest.config.ts:26-38` não define `thresholds`.
- Cobertura reproduzida na refutação: statements 85,82%, branches 76,90%, functions 84,85%, lines 89,12%; o comando conclui com sucesso sem thresholds.
- `src/stores/useListMenus.Store.ts` não tem referência nominal em `tests/`.

## Afetados
Política global da suíte, especialmente warnings de Vue, fixtures Pinia/router e módulos sem teste comportamental nominal.

## Causa-raiz
Setup global privilegia mocks amplos sem política de warning/erro inesperado, e cobertura é métrica informativa sem gate mínimo.

## Impacto
Regressões de runtime são homologadas com todos os testes passando; arquivos testados compensam módulos/branches descobertos.

## Reprodução
Executar `npm test -- --reporter=dot` e procurar `[Vue warn]`; executar `npm run test:coverage` e observar que qualquer percentual passa.

## Direção de correção
Falhar em warnings/erros inesperados, tornar fixtures globais determinísticas, adicionar teste comportamental para módulos órfãos identificados e adotar thresholds graduais por dimensão/arquivo crítico. Fluxos IndexedDB, SSR e concorrência permanecem nos achados específicos, sem duplicar sua implementação aqui.

## Critérios de aceite
- Suíte sem warning inesperado.
- Warnings deliberados são afirmados localmente.
- Thresholds explícitos e teste comportamental do store órfão.
- O gate integrado de CI fica sob `gates_qualidade_fragmentados_e_lint_mutante`.

## Contraevidências consideradas
A antiga alegação de 16 componentes sem teste não se sustenta: testes agregados/integração referenciam todos os SFCs. Não se exige paridade 1:1, mas detecção comportamental.
