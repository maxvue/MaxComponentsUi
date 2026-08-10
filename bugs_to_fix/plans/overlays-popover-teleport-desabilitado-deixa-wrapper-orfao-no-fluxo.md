# MaxPopover: `<Teleport :disabled="! isOpen">` deixa um wrapper `position: fixed` órfão no fluxo e não limpa estado no unmount

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxPopover.vue:8-27`, `src/components/MaxPopover.vue:234-236`, `src/components/MaxPopover.vue:143-146`
- **Domínio:** overlays-navegacao

## Problema

Dois defeitos ligados ao teleport condicional:

**1. Wrapper sempre renderizado.** O `<div style="position: fixed;" class="popover-item">` (linha 9) está **fora** de qualquer `v-if` — ele é renderizado sempre, aberto ou fechado. O `Teleport` apenas alterna `disabled` (linha 8): quando fechado, esse `div` fica dentro do `.max-popover-main` do gatilho; quando aberto, migra para o `<body>`.

Consequências:
- Cada `MaxPopover` fechado ainda injeta um `div` com `position: fixed` e `z-index: 9999 !important` (linha 235) no ponto de uso. Em uma lista com dezenas de popovers, são dezenas de nós fixos e empilhados no topo da pilha de camadas — mesmo sem nada visível dentro.
- Alternar `disabled` no `Teleport` move o nó DOM entre pais a cada abertura/fechamento, o que remonta o `MaxAnimateFade` (linha 10) e pode interferir na animação de entrada/saída.
- O `z-index: 9999 !important` no wrapper cria um novo contexto de empilhamento no meio do layout do consumidor, mesmo com o popover fechado.

**2. Sem limpeza no unmount.** Não há `onBeforeUnmount` no arquivo. Se o `MaxPopover` for desmontado enquanto aberto (`popover_store.show_id === id.value`), o `show_id` global (`src/stores/usePopover.Store.ts:7`) permanece apontando para um id inexistente. Nenhum outro popover consegue "destravar" esse estado exceto chamando `hide()`, e o `setTimeout` de `toggle` (linha 138) pode disparar após o unmount, escrevendo em `style.value` de um componente destruído.

## Impacto

Poluição de DOM e de contexto de empilhamento em listas com muitos popovers; animação de abertura inconsistente; e estado residual no `usePopoverStore` que pode impedir a abertura correta do próximo popover após uma navegação de rota.

## Plano de correção

1. Envolver todo o conteúdo teleportado num `v-if="isOpen"` (ou mover o `v-if` para o próprio `.popover-item`), de modo que nada seja renderizado quando fechado. Substituir `<Teleport :disabled="! isOpen">` por `<Teleport to="body">` com o conteúdo guardado por `v-if`, para que o nó não migre de pai a cada toggle.
2. Se a animação de saída do `MaxAnimateFade` depender de o nó permanecer montado, usar `v-show` no painel interno e manter o `v-if` apenas no wrapper `.popover-item` sincronizado com o fim da transição.
3. Remover o `!important` de `.popover-item { z-index: 9999 }` (linha 235) e integrá-lo à escala de camadas proposta em `overlays-modal-z-index-abaixo-do-popover-e-do-toast.md`.
4. Adicionar:
   ```
   onBeforeUnmount(() => {
       if (popover_store.show_id === id.value) popover_store.hide();
   });
   ```
5. Guardar o `setTimeout` de `toggle` (linhas 138-140) num handle limpo no unmount.

## Verificação

- Teste em `tests/components/MaxPopover.test.ts`: montar com o popover fechado e afirmar que `document.body.querySelectorAll('.popover-item').length === 0` e que `wrapper.find('.popover-item').exists() === false`.
- Teste de unmount: abrir, `wrapper.unmount()`, afirmar `popover_store.show_id === null` e que nenhum `.max-popover-dialog` sobrou no `document.body`.
- Teste de timer: abrir, desmontar e avançar timers sem que nenhum erro seja lançado.
- `npx vitest run tests/components/MaxPopover.test.ts`
