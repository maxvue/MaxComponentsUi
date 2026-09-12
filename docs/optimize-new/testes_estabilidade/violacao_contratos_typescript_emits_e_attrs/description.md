# Grafo de tipos Vue dividido bloqueia type-check, build e release

## Resumo
O pacote não passa sua própria checagem TypeScript. `@maxvue/max-use` e `@maxvue/max-pinia` são dependências locais `file:` e carregam Vue `3.6.0-rc.7`, enquanto esta biblioteca resolveu `3.6.0-rc.8`. Tipos nominais de `Ref`/`ComputedRef` atravessam essa fronteira e deixam de ser atribuíveis.

## Severidade e prioridade
**Crítica / P0 — bloqueador de release.** `build` e `release` executam `vue-tsc` antes de produzir/publicar o pacote.

## Evidências
- `package.json:33-36`: `build`, `type-check` e `release` dependem de `vue-tsc`.
- `package.json:49-50`: pacotes irmãos são `file:../MaxPinia` e `file:../MaxUse` em pacote público (`package.json:25-27`).
- `src/components/MaxInputFile.vue:217`: `Ref<HTMLDivElement | null>` é rejeitado por `useDropZone`.
- `src/components/MaxPageMobileLayout.vue:32-36,83-90`: `ComputedRef<string>` é rejeitado em `style` e o ref é rejeitado por `useDraggable`.
- `npm run type-check` sai 1 com esses três erros.
- `npm ls vue @vueuse/core @maxvue/max-use @maxvue/max-pinia --all` sai `ELSPROBLEMS` e mostra RC.8 na raiz e RC.7 nos irmãos.

## Afetados
Build, declarações, release npm, `MaxInputFile`, `MaxPageMobileLayout` e novos composables do MaxUse que transportem tipos Vue.

## Causa-raiz
Dependências locais mantêm árvores próprias de uma versão pré-release de Vue. Marcas internas dos tipos reativos tornam as instâncias incompatíveis. Casts `as any` já escondem o mesmo limite em outros componentes; corrigir só três linhas deslocaria o problema.

## Impacto
O artefato oficial não pode ser construído/liberado. Referências `file:` também não existem no ambiente de um consumidor e a duplicação de Vue pode produzir refs/watchers de runtimes distintos.

## Reprodução
Executar `npm run type-check`, `npm run build` e `npm ls vue @vueuse/core --all`.

## Direção de correção
Publicar/consumir os irmãos por versões reproduzíveis, mover Vue/VueUse compartilhados para peers compatíveis, unificar uma versão estável e validar o tarball em projeto externo vazio.

## Critérios de aceite
- Uma única instância válida em `npm ls vue --all`.
- `type-check`, `build` e instalação do tarball passam.
- Nenhuma dependência publicada usa caminho `file:`.
- Usos permanecem tipados sem casts compensatórios.

## Contraevidências consideradas
Os 2.481 testes passam isoladamente porque transpõem sem type-check e `vitest.config.ts:14-24` força alias/dedupe. Isso contorna o ambiente, não refuta o build quebrado.
