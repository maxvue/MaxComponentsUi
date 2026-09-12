# Plano de implementação — geração de consulta no autocomplete API

## Objetivo e resultado esperado

Garantir que cache, revalidação e resposta de rede só atualizem `MaxInputAutoCompleteApi` quando pertencem à combinação vigente de rota/dados. Alterações posteriores, fechamento ou unmount invalidam toda publicação antiga.

## Escopo e fora de escopo

- Escopo: watcher de consulta, `AbortController`, geração, deduplicação de aplicação e testes de ordem invertida/SWR.
- Fora: mudar o algoritmo de filtro, o formato da API, o cache do MaxUse ou aplicar a solução a outros autocompletes.

## Arquivos-alvo

- `src/components/MaxInputAutoCompleteApi.vue`.
- `tests/components/MaxInputAutoCompleteApi.test.ts`.

## Dependências e ordem

1. Criar promises controladas que reproduzam consulta A/B e callback de revalidação.
2. Implementar identidade/cancelamento da consulta.
3. Proteger callback e resolução final com a mesma geração.
4. Integrar cleanup e validar interação/foco.

## Passos detalhados

1. Observar conjuntamente `props.route` e `props.data`; no início de cada mudança, abortar o controller anterior e incrementar `requestGeneration`, inclusive quando a nova entrada for vazia.
2. Capturar rota, cópia dos parâmetros e `input_value` daquela geração antes da chamada.
3. Passar `{ signal: controller.signal }` no sexto argumento já suportado por `getCachedApiIDB`.
4. Criar um único `applyIfCurrent(result)` usado tanto por `onUpdate` quanto pelo `.then`; ele exige componente montado, signal não abortado e geração atual.
5. Ignorar vazio e resultado igual ao já aplicado para que cache e resolução da mesma carga não disparem duas buscas/renderizações.
6. Tratar `AbortError` como fluxo esperado e impedir rejeição não tratada; preservar o tratamento atual para demais falhas.
7. No unmount, marcar a instância inativa, abortar e invalidar a geração.

## Migração e compatibilidade

- Props, emits, payload e semântica stale-while-revalidate permanecem.
- Cache pode aparecer primeiro e rede depois, desde que ambos sejam da geração atual.
- A revalidação de background do MaxUse pode não ser cancelável; o guard local continua obrigatório.
- Não há migração de dados persistidos.

## Testes pertinentes

- Resolver B antes de A e afirmar que a lista final é B e A não reabre/recalcula opções.
- Emitir cache A, iniciar B e depois emitir revalidação A; somente B permanece.
- Verificar aplicação cache→rede na mesma geração, sem duplicar quando iguais.
- Alterar para dados vazios e desmontar durante request; zero mutações tardias.
- Afirmar signal enviado/abortado e ausência de unhandled rejection.
- Manter testes de filtro, seleção, teclado e ARIA; não há mudança visual/a11y intencional.

## Critérios de aceite

- Em qualquer ordem de resolução, somente a maior geração vigente publica `list`/`filtered_values`.
- Callback e promise da mesma resposta idêntica geram uma publicação.
- Consulta anterior recebe abort e produz zero mutações após troca/unmount.
- Suíte focada, type-check, testes completos e build passam.

## Riscos, rollback e validação final

- Riscos: callback SWR sobreviver ao abort e comparação profunda mascarar atualização legítima. Mitigar com geração obrigatória e deduplicar apenas resultados iguais.
- Rollback: remover cancelamento físico se incompatível, mantendo o guard de geração que garante correção.
- Validar A/B, cache/revalidação, vazio, unmount, interação normal, type-check e build.
