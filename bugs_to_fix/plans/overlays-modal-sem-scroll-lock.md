# MaxModal não trava o scroll do body (`useScrollLock` não é utilizado)

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxModal.vue:33-41`, `src/components/MaxModal.vue:273-282`, `src/helpers/useScrollLock.ts:28`
- **Domínio:** overlays-navegacao

## Problema

O helper `useScrollLock` (`src/helpers/useScrollLock.ts`) existe justamente para overlays travarem o scroll da página de forma cumulativa, e o `MaxDrawer` o consome corretamente (`src/components/MaxDrawer.vue:60,115,186,197,206`).

O `MaxModal` **não importa nem usa** o helper. A máscara `.background-modal` tem `height: 100vh; width: 100vw; position: fixed` (linhas 275-278), mas isso não impede o scroll do documento por trás: a roda do mouse sobre a máscara rola o `body`.

Não há sequer prop `blockScroll` no `MaxModal` (props declaradas nas linhas 43-98), então não existe nem a opção de habilitar o comportamento.

## Impacto

Ao abrir um modal em uma página longa, a rolagem da roda do mouse move o conteúdo de fundo enquanto o modal permanece centralizado com `position: fixed`. Em mobile, o efeito é mais grave: o "scroll chaining" faz a página inteira deslizar sob o modal. Comportamento inconsistente com o `MaxDrawer` da mesma biblioteca.

## Plano de correção

1. Em `src/components/MaxModal.vue`, importar `useScrollLock` de `../helpers/useScrollLock`.
2. Adicionar a prop `blockScroll?: boolean` com default `true` (o comportamento esperado de um modal) — avaliar com o time se o default deve ser `false` para não quebrar consumidores; se for `false`, documentar no JSDoc da prop.
3. Instanciar `const scroll_lock = useScrollLock();`.
4. Replicar o padrão de flag do `MaxDrawer` (`has_scroll_lock`, `src/components/MaxDrawer.vue:175`) para que alternar `blockScroll` com o modal aberto não deixe o contador do helper desbalanceado:
   ```
   let has_scroll_lock = false;
   watch(is_show, (value) => {
       if (value && props.blockScroll) { scroll_lock.lock(); has_scroll_lock = true; return; }
       if (has_scroll_lock) { scroll_lock.unlock(); has_scroll_lock = false; }
   });
   ```
5. Liberar o lock em `onBeforeUnmount` (ver também o achado `overlays-modal-nao-desmonta-nem-restaura-estado-global-no-unmount.md`).

## Verificação

- Teste em `tests/components/MaxModal.test.ts`: abrir o modal e afirmar `document.body.style.overflow === 'hidden'`; fechar e afirmar que voltou ao valor original.
- Teste cumulativo: abrir dois modais/drawers com `blockScroll` e afirmar que fechar um mantém o `overflow: hidden` (espelhando `tests/components/MaxDrawer.test.ts:376`).
- Teste de unmount: abrir e desmontar; afirmar que o `overflow` foi restaurado.
- `npx vitest run tests/components/MaxModal.test.ts`
