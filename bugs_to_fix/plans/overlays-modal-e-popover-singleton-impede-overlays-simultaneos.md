# `useModalStore` e `usePopoverStore` usam `show_id` único: impossível empilhar dois modais ou dois popovers

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/stores/useModal.Store.ts:7-19`, `src/stores/usePopover.Store.ts:7-19`, `src/components/MaxModal.vue:100`, `src/components/MaxPopover.vue:98`
- **Domínio:** overlays-navegacao

## Problema

Ambas as stores mantêm um único `show_id: Ref<string | null>` e o componente decide sua visibilidade por igualdade (`modal_store.show_id === id.value`, `MaxModal.vue:100`; `popover_store.show_id === id.value`, `MaxPopover.vue:98`).

Isso torna estruturalmente impossível ter **dois overlays do mesmo tipo abertos simultaneamente**:

- Abrir um `MaxModal` B enquanto A está aberto faz A desaparecer instantaneamente — sem animação de saída, pois o `v-if` da linha 9 avalia falso de imediato e o teleport é removido do DOM.
- O mesmo vale para `MaxPopover` (o teste `tests/components/MaxPopover.test.ts:161` documenta esse comportamento como esperado: "abrir um segundo MaxPopover fecha o primeiro automaticamente").

Fluxos legítimos que quebram:

1. **Modal aninhado.** Um modal de detalhe aberto de dentro de um modal de lista fecha o pai, e ao fechar o filho o usuário volta para a página, não para a lista.
2. **Popover dentro de modal.** Abrir um `MaxPopover` de dentro de um `MaxModal` funciona (stores diferentes), mas dois popovers em cascata não.
3. **Estado `intent` dessincronizado.** O `MaxModal` mantém um `watch` sobre `show_id` (linhas 152-154) exatamente para contornar o fato de outro modal poder "roubar" o `show_id` global — evidência de que a limitação já foi sentida e apenas mitigada.

## Impacto

A biblioteca não suporta overlays empilhados, um requisito comum em telas de cadastro (formulário em modal → confirmação/seleção em outro modal). O consumidor não tem alternativa, pois o controle é global e implícito.

## Plano de correção

1. Converter o `show_id` de ambas as stores em uma **pilha** (`show_ids: Ref<string[]>`), preservando a API atual como camada de compatibilidade:
   - `show(id)` → `push` se ainda não estiver na pilha.
   - `hide()` → `pop` (fecha apenas o topo) e `hide(id)` → remove o id específico.
   - `toggle(id)` → `push`/remove conforme presença.
   - Expor um getter `show_id` computado como `show_ids.at(-1) ?? null` para não quebrar consumidores existentes.
2. Nos componentes, trocar a comparação de igualdade por presença: `computed(() => modal_store.show_ids.includes(id.value))`.
3. Derivar o `z-index` do painel a partir do índice na pilha, para que overlays empilhados fiquem visualmente na ordem correta (ver `overlays-modal-z-index-abaixo-do-popover-e-do-toast.md`).
4. Ajustar o `watch` de `intent` no `MaxModal` (linhas 152-154) para reagir à saída da pilha, não à troca de `show_id`.
5. Reavaliar o teste `tests/components/MaxPopover.test.ts:161`, que hoje **codifica a limitação como comportamento esperado**: decidir explicitamente se popovers devem continuar sendo mutuamente exclusivos (provavelmente sim, para popovers irmãos) ou empilháveis, e ajustar o teste conforme a decisão.

## Verificação

- Teste em `tests/components/MaxModal.test.ts`: abrir modal A, abrir modal B, afirmar que **ambos** os painéis existem no DOM; fechar B e afirmar que A continua aberto.
- Teste de ordenação: afirmar que o `z-index` do painel B é maior que o de A.
- Rodar toda a suíte de overlays para pegar regressões de compatibilidade: `npx vitest run tests/components/MaxModal.test.ts tests/components/MaxPopover.test.ts tests/components/MaxTogglePopover.test.ts`
