# Plano de implementação — posicionamento ativo somente com overlay aberto

## Objetivo e resultado esperado

Desacoplar medição geométrica do tempo de vida do componente hospedeiro. Overlays fechados não devem registrar listeners/observers nem chamar `getBoundingClientRect`; overlays abertos devem medir imediatamente e coalescer scroll/resize em uma atualização por frame.

## Escopo e fora de escopo

- Escopo: selects, autocompletes, date picker, tag select, popovers, menu de usuário e gatilhos de confirmação que hoje usam `useElementBounding`/`useElementSize`/`useWindowSize` eager.
- Escopo: extrair uma primitiva compartilhada e alinhar `MaxBaseOverlay` ao mesmo ciclo de ativação/cleanup.
- Fora: redesenhar overlays, alterar API/posição visual deliberada ou mexer em medições não relacionadas de `MaxPageContent`, `MaxTable` e `MaxPdfView`.
- Fora: resolver contratos ARIA/foco além de preservar o comportamento atual.

## Arquivos-alvo

- Criar `src/composables/useActiveOverlayPosition.ts` e `tests/composables/useActiveOverlayPosition.test.ts`.
- Alterar `src/components/base/MaxBaseOverlay.vue`.
- Alterar `src/components/MaxInputSelect.vue`, `MaxTagSelect.vue`, `MaxInputAutoComplete.vue`, `MaxInputAutoCompleteApi.vue`, `MaxInputDatePicker.vue`, `MaxPopover.vue`, `MaxPopoverMenu.vue` e `MaxUserSection.vue`.
- Alterar `src/components/MaxButtonConfirm.vue`, `MaxIconConfirm.vue` e `MaxTogglePopover.vue` para medir apenas no acionamento.
- Atualizar os testes focados existentes desses componentes e criar `tests/performance/overlayPositioning.test.ts`.

## Dependências e ordem

1. Implementar/testar a primitiva sem migrar consumidores.
2. Migrar primeiro `MaxBaseOverlay`, depois selects/autocompletes/date picker e, por fim, popovers/menu.
3. Trocar confirmações por leitura pontual no clique.
4. Remover imports eager restantes somente após os testes de posição.
5. Coordenar com os planos de SSR, cleanup global, z-index e foco para evitar implementações duplicadas.

## Passos detalhados

1. A primitiva recebe `active`, elemento âncora, painel e callback puro de cálculo; ao abrir, aguarda `nextTick`, mede ambos e publica a posição.
2. Registrar `scroll` em capture/passive, `resize` e `ResizeObserver` somente enquanto `active === true` e DOM disponível.
3. Coalescer todos os eventos por `requestAnimationFrame`; cancelar frame, listeners e observers no fechamento e `onBeforeUnmount`.
4. Ler `window.innerWidth/innerHeight` no momento da medição, sem `useWindowSize` por instância.
5. Preservar clamp, abertura acima/abaixo, largura e offset específicos de cada componente por opções/callbacks, evitando uma fórmula universal incorreta.
6. Em confirmações, obter `getBoundingClientRect()` uma vez dentro de `onClickToggle` e enviar o snapshot ao store; não há overlay local que justifique observação contínua.
7. Garantir idempotência: abrir duas vezes não duplica listeners; fechar duas vezes não deixa recursos; troca de âncora aberta reposiciona uma vez.

## Migração e compatibilidade

- Props, eventos, métodos expostos, Teleport e formato dos estilos permanecem iguais.
- A primeira posição é calculada antes de revelar o painel ou no primeiro frame, evitando salto visível.
- A primitiva deve degradar em SSR sem acessar `window`, `document`, `ResizeObserver` ou RAF no setup.
- Não migrar componentes sem overlay apenas para eliminar imports semelhantes.

## Testes e benchmark

- Unitário: ciclos abrir/fechar, coalescência de eventos, troca de elemento, ausência de APIs do browser e cleanup no unmount.
- Integração: posição acima/abaixo, clamp lateral, scroll/resize aberto e nenhuma atualização fechado em cada família migrada.
- Performance: montar 1, 10 e 30 instâncias fechadas, disparar scroll/resize e exigir zero leituras; abrir uma e exigir no máximo uma leitura por elemento/frame.
- A11y: manter foco/Escape nos testes existentes; não há mudança visual intencional.
- Registrar trace manual antes/depois apenas como apoio; contagem de operações bloqueia CI.

## Critérios de aceite

- 1/10/30 overlays fechados produzem zero `getBoundingClientRect` em scroll/resize.
- Um overlay aberto reposiciona no máximo uma vez por frame e somente ele mede.
- Após fechar/unmount, contadores de listeners, observers e RAF ativos retornam a zero.
- Confirmações medem exatamente uma vez por acionamento.
- Posição observada permanece dentro de tolerância de 1 px nos cenários atuais.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Riscos: salto no primeiro frame, fórmula compartilhada apagar variações e observer duplicado. Mitigar ocultando até primeira medição, parametrizando cálculo e testando idempotência.
- Rollback: reverter consumidor a consumidor para o cálculo anterior; não há dados/API a migrar.
- Validar busca sem `useElementBounding` nos componentes migrados, testes 1/10/30, resize/scroll real, SSR, cleanup, type-check e build.
