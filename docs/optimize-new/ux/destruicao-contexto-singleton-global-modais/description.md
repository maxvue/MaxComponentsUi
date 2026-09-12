# Achado UX-05: destruição de contexto e contrato de fechamento incoerente em modais

## Resumo

`MaxModal` ganhou `v-model` e proteções de foco, mas continua subordinando todas as instâncias a um único `show_id`. Abrir um segundo modal desmonta o conteúdo do primeiro e fechá-lo não restaura a camada anterior. Há ainda dois contratos incompatíveis para impedir fechamento: a prop `beforeClose` aguarda `done()`, enquanto o evento `before-close` é emitido e o modal fecha imediatamente, mesmo que o consumidor não invoque `done`.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Evidências

- `src/components/MaxModal.vue:8-15`: cada conteúdo só existe quando `modal_store.show_id === id`; a troca do ID desmonta a árvore anterior.
- `src/stores/useModal.Store.ts:5-21`: o estado global comporta somente `string | null`, sem pilha ou registro de camadas.
- `src/components/MaxModal.vue:148-155`: a prop `beforeClose` aguarda callback, mas a via do evento executa `close()` incondicionalmente logo após emitir o mesmo callback.
- `src/components/MaxModal.vue:234-260`: `modelValue` já é sincronizado com a store; portanto, a alegação anterior de ausência total de `v-model` foi refutada nesta reavaliação.
- `src/components/MaxModal.vue:210-218` e `282-405`: abertura e fechamento dependem de timers e intenção imperativa; troca de instância não preserva uma pilha de foco/contexto.

## Componentes afetados

- `MaxModal.vue` e `useModalStore`.
- Formulários, assistentes e seletores abertos dentro de outro modal.
- Consumidores que usam `@before-close` para confirmação de descarte.

## Causa-raiz

O componente combina controle local (`modelValue`), coordenação global exclusiva (`show_id`) e transição temporal imperativa sem definir precedência nem modelo de camadas. O conceito de “modal ativo” é escalar, mas jornadas reais podem exigir uma camada secundária ou confirmação sobre a camada atual.

## Impacto

- Perda do estado interno não elevado do modal anterior ao abrir outra instância.
- Retorno à tela base, em vez de retorno ao diálogo pai, após fechar a camada secundária.
- Risco de descartar edição apesar de o consumidor ter tratado `before-close` como gancho cancelável.
- Foco pode ser restaurado para elemento oculto/desmontado quando instâncias competem pela store.

## Reprodução e verificação

1. Monte dois `MaxModal` com campos de estado local; abra o primeiro, preencha um valor e abra o segundo.
2. Confirme que o primeiro sai do DOM; feche o segundo e confirme que o primeiro não volta.
3. Use apenas `@before-close="handler"`, não chame `done`, e acione Escape/backdrop; confirme que fecha mesmo assim.
4. Repita com a prop `:before-close="handler"`; confirme que essa via aguarda `done`, evidenciando contratos divergentes.

## Direção de solução

Definir um contrato único de visibilidade e fechamento. Se modais aninhados forem suportados, usar uma pilha com ordem, foco e scroll lock por camada; se forem proibidos, impedir a abertura secundária com feedback explícito e preservação do primeiro. Unificar prop/evento em uma semântica cancelável ou assíncrona inequívoca e substituir temporizadores de estado por ciclo de transição observável.

## Critérios de aceite

- Abertura de uma segunda instância não apaga silenciosamente o trabalho da primeira.
- Fechar uma camada restaura a camada/foco anterior quando empilhamento for permitido.
- Todas as vias respeitam a mesma política de fechamento.
- O gancho de pré-fechamento consegue cancelar/adiar o fechamento de maneira documentada e testada.
- `v-model`, store e eventos não entram em ciclos nem estados contraditórios.

## Possíveis contraevidências

- `modelValue`, focus trap, retorno de foco e scroll lock já existem e reduzem parte do risco; não resolvem a exclusão mútua global.
- Se a política do produto for estritamente “um modal por vez”, a ausência de pilha pode ser deliberada; ainda assim, substituir o modal ativo sem aviso e sem proteção do estado continua sendo falha de jornada.
