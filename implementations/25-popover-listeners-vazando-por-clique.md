# 25 — Popovers/Confirms: composables VueUse criados dentro de handlers vazam observers

**Severidade:** Média
**Categoria:** Memory leak
**Arquivos:** `src/components/MaxPopover.vue:120-124`, `src/components/MaxButtonConfirm.vue:83`, `src/components/MaxIconConfirm.vue`, `src/components/MaxTogglePopover.vue:92`

## Problema

`useElementBounding`, `useElementSize` e `useWindowSize` são chamados **dentro de event handlers/`setTimeout`**, fora do escopo de setup. Cada clique cria novos `ResizeObserver` + listeners de `scroll`/`resize` que nunca são desregistrados (não há escopo de efeito para descartá-los). Em telas com muitos toggles, os observers acumulam indefinidamente.

## Correção sugerida

Instanciar os composables uma vez no setup do componente (são reativos) e ler `.value` no handler; ou usar `el.getBoundingClientRect()` diretamente para leitura pontual.
