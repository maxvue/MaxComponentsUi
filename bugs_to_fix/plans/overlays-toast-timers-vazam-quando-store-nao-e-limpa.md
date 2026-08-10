# MaxToast: timers da store nunca são limpos no unmount do componente

- **Categoria:** bug
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxToast.vue:46-66`, `src/stores/useToast.Store.ts:65-93`, `src/stores/useToast.Store.ts:125-130`
- **Domínio:** overlays-navegacao

## Problema

Cada toast adicionado agenda um `setTimeout` guardado em `toast.timerId` (`src/stores/useToast.Store.ts:67`). A store expõe `clear()` (linha 125), que corretamente limpa todos os timers.

Porém, o `MaxToast.vue` — o componente que renderiza a fila — não tem **nenhum hook de ciclo de vida**: não há `onMounted`, `onBeforeUnmount` nem `onUnmounted` em todo o `<script setup>` (linhas 46-66). Se o `MaxToast` for desmontado (troca de layout, logout, hot reload em dev) com toasts pendentes:

- Os `setTimeout` continuam agendados e disparam `remove(toast.id)` sobre uma store que ninguém mais renderiza — trabalho desperdiçado, mas inofensivo por si só.
- Os toasts pendentes permanecem em `items` (linha 48). Quando um novo `MaxToast` for montado, ele exibe imediatamente toasts antigos que já deveriam ter expirado (ou que pertenciam a outro contexto/usuário), com a barra de progresso reiniciando do zero (`animationDuration` derivado de `toast.duration`, `MaxToast.vue:39`).

Como a store é um singleton Pinia, esse estado atravessa desmontagens do componente.

## Impacto

Toasts "fantasma" reaparecem após navegação ou troca de layout — notificações de uma sessão anterior surgindo em um contexto novo. Em ambiente de testes, timers pendentes entre casos podem provocar flakiness se `vi.useFakeTimers()` não estiver ativo.

## Plano de correção

1. Decidir a semântica desejada com o time:
   - **Opção A (recomendada):** o `MaxToast` chama `toastStore.clear()` em `onBeforeUnmount`, tratando a fila como acoplada ao ciclo de vida do renderizador.
   - **Opção B:** manter a fila, mas garantir que os timers pendentes sejam recalculados na remontagem a partir de `createdAt`/`remaining`, em vez de reiniciar visualmente.
2. Implementar a opção escolhida em `src/components/MaxToast.vue`, importando `onBeforeUnmount` de `vue`.
3. Independentemente da opção, corrigir a dessincronização documentada da barra de progresso (`MaxToast.vue:26-35` e `useToast.Store.ts:98-101`): derivar `animationDuration` de `toast.remaining` e forçar o reinício da animação em cada `resume()` (por exemplo, alternando uma `key` no elemento `.max-toast-progress-bar`).

## Verificação

- Teste em `tests/components/MaxToast.test.ts`: adicionar dois toasts, desmontar o wrapper e afirmar que `toastStore.items.length === 0` (opção A).
- Teste de timer órfão: adicionar um toast, desmontar, avançar `vi.advanceTimersByTime(10000)` e afirmar que nenhum erro foi lançado.
- Teste da barra de progresso: pausar via `mouseenter`, avançar 2000ms, retomar e afirmar que o `animationDuration` reflete o `remaining`, não a `duration` original.
- `npx vitest run tests/components/MaxToast.test.ts`
