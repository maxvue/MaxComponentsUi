# Relatório de Execução — IMP6-F07

- **ID do Papel:** IMP6-F07
- **Bloco:** F07 / E04-02 (useOutsidePointer.ts e fechamento de pilha de overlays)
- **UUID:** `4a04d537-eb4c-42cb-b700-1c0ea5b5f782`
- **Worktree:** `/home/johnattas/GitHub/MaxAiManager/.worktrees/maxcomponentsui-fix6`
- **Branch:** `fix/fix6-implementation`
- **Status:** CONCLUÍDO

## 1. Escopo e Problema Tratado
Em `src/helpers/useOutsidePointer.ts`, eventos de fechamento chamavam `onClose` antes que o estado reativo (`isOpen.value = false`) fosse desativado e processado pelo watcher do Vue (que é assíncrono). Quando múltiplos eventos síncronos de clique ou teclado (Escape) ocorriam antes do `nextTick`, o overlay do topo ainda constava na pilha ou, se marcado como `closing`, o evento seguinte disparava fechamento inadvertido na camada inferior.

Além disso:
- Era necessário garantir que o topo da pilha receba a flag `closing = true` imediatamente antes do disparo de `onClose`.
- Garantir que eventos síncronos adicionais disparados no mesmo frame/microtask sejam coalescidos, impedindo fechamento prematuro da camada inferior.
- Assegurar retenção de clique-through, integridade do trigger desconectado e restauração de foco em stack.

## 2. Modificações Realizadas
1. `src/helpers/useOutsidePointer.ts`:
   - Adicionada a propriedade opcional `closing?: boolean` na interface `OverlayEntry`.
   - Adicionada função `getTopActiveOverlay()` que localiza a entrada mais ao topo ignorando as que já estejam marcadas como `closing: true`.
   - Adicionada proteção `hasPendingCloseMicrotask` para coalescer eventos síncronos de clique e Escape que ocorram no mesmo ciclo síncrono antes que o ciclo reativo do Vue consuma o fechamento (`nextTick`/microtask).
   - Atualizado `onGlobalKeydown` e `onGlobalClick` para marcar `topOverlay.closing = true` e agendar liberação do `hasPendingCloseMicrotask` via `Promise.resolve().then(...)`.
   - Incluído o reset de `hasPendingCloseMicrotask = false` em `resetOutsidePointerStateForTests()`.
2. `tests/helpers/useOutsidePointer.test.ts`:
   - Adicionado caso de teste demonstrando que dois eventos síncronos de clique/Escape antes do `nextTick` chamam `close2` apenas uma vez e não acionam `close1`.

## 3. Comandos Executados e Evidências
```bash
$ npx vitest run tests/helpers/useOutsidePointer.test.ts
✓ tests/helpers/useOutsidePointer.test.ts (14 tests) 57ms
  ✓ useOutsidePointer (14)
    ✓ ativa listeners e registra na pilha quando aberto; desmontar/fechar zera listeners
    ✓ stack: tecla Escape fecha apenas o overlay do topo da pilha
    ✓ clique-through: clique em elemento externo fecha overlay sem impedir o evento do elemento
    ✓ não fecha se o clique for dentro dos elementos do overlay
    ✓ scroll ancestral aciona onReposition
    ✓ elimina listener keydown duplicado: registra apenas em document, nunca em window
    ✓ stack: clique na camada inferior fecha APENAS o overlay superior (não trata camada inferior como inside)
    ✓ stack: clique externo fecha apenas o topo da pilha
    ✓ F07: dois eventos síncronos de clique ou escape antes do nextTick não fecham o overlay inferior prematuramente
    ✓ clique-through: não rouba o foco de volta para o trigger quando o clique foca outro controle externo
    ✓ restauração de foco: Escape devolve o foco ao trigger; fallback seguro se trigger estiver desconectado
    ✓ reposicionamento: fecha o overlay se a âncora/trigger for desconectada do DOM
    ✓ múltiplas instâncias compartilham listeners globais e zeram rigorosamente após unmount de todas
    ✓ suporta zoom e resize via visualViewport quando disponível

Test Files  1 passed (1)
     Tests  14 passed (14)

$ npx eslint src/helpers/useOutsidePointer.ts tests/helpers/useOutsidePointer.test.ts
# Saída com código 0 (sem erros ou warnings de lint).
```
