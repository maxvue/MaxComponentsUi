# MaxModal desmontado enquanto aberto deixa `show_id` preso e timers pendentes

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxModal.vue:128-133`, `src/components/MaxModal.vue:156-248`
- **Domínio:** overlays-navegacao

## Problema

O componente mantém uma lista de timers pendentes (`pending_timers`, linha 128) e um `clearPendingTimers()` (linha 130), mas **nenhum hook de ciclo de vida os limpa**. Não existe `onBeforeUnmount`/`onUnmounted` em todo o arquivo.

Dois defeitos decorrem disso:

1. **Timers órfãos.** Se o modal for desmontado durante uma transição (por exemplo, o consumidor faz `v-if="false"` no `MaxModal` logo depois de `close()`), os `setTimeout` das linhas 172, 191, 193, 217, 241 e 243 continuam agendados. Ao dispararem, executam `style.value = ...` e `modal_store.toggle(id.value)` / `modal_store.hide()` sobre um componente já destruído — mutando estado global (`useModalStore`) fora de qualquer instância viva.

2. **`show_id` preso.** Se o modal for desmontado enquanto está aberto (`modal_store.show_id === id.value`), o `show_id` nunca é limpo. Como o `useModalStore` é um singleton com um único `show_id` (`src/stores/useModal.Store.ts:7`), o valor fica apontando para um id de um modal que não existe mais. Um `hide()` no store resolve, mas nenhum outro `MaxModal` aberto depois disso terá o mesmo id — o efeito imediato é apenas estado sujo, mas o timer órfão do item 1 pode reabrir ou fechar indevidamente um modal legítimo que assumiu o `show_id` nesse meio-tempo (o `toggle` do store, linha 17-19, alterna com base em comparação de id).

## Impacto

Em aplicações com listas dinâmicas (modais dentro de `v-for` ou de rotas que trocam), o resultado é overlay que reaparece ou some sozinho, e `show_id` residual que impede um novo modal de abrir corretamente. É um vazamento de estado global difícil de diagnosticar em produção.

## Plano de correção

1. Em `src/components/MaxModal.vue`, importar `onBeforeUnmount` de `vue`.
2. Adicionar:
   ```
   onBeforeUnmount(() => {
       clearPendingTimers();
       if (modal_store.show_id === id.value) modal_store.hide();
   });
   ```
3. Blindar adicionalmente os callbacks dos `setTimeout` das linhas 191-196 e 241-246 para checarem se o componente ainda está montado antes de tocar o store (flag local `is_unmounted`), já que `clearPendingTimers` cobre o caso normal mas o guard torna a intenção explícita.
4. Manter indentação de 4 espaços e ponto e vírgula.

## Verificação

- Teste em `tests/components/MaxModal.test.ts`: montar, `open()`, `wrapper.unmount()`, e afirmar que `modal_store.show_id === null`.
- Teste de timer órfão: montar, `close()`, desmontar imediatamente, avançar `vi.advanceTimersByTime(500)` e afirmar que nenhum erro foi lançado e que o store não foi mutado depois do unmount (espiar `modal_store.hide`).
- Teste de interferência: abrir modal A, desmontar A durante o fechamento, abrir modal B, avançar timers e afirmar que B continua aberto.
- `npx vitest run tests/components/MaxModal.test.ts`
