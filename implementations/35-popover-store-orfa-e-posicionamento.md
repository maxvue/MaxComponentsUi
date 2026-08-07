# 35 — MaxPopover: store órfã e posicionamento congelado

**Severidade:** Baixa
**Categoria:** Divergência / Documentação
**Arquivos:** `src/stores/usePopover.Store.ts`, `src/components/MaxPopover.vue:112-146`

## Problemas

1. `usePopoverStore` é exportada e documentada no CLAUDE.md como controladora do MaxPopover, mas `MaxPopover.vue` usa `ref(isOpen)` local — a store não é usada por nenhum componente. Consequência prática: dois MaxPopover abertos não se fecham mutuamente (MaxModal fecha, pois usa `useModalStore`).
2. A posição do popover é calculada uma única vez no `setTimeout(…, 1)` do toggle e congelada em `top/left` fixos; resize/scroll não reposicionam. `MaxPopoverConfirm` faz certo (computed reativo) — inconsistência entre os dois.

## Correção sugerida

Fazer MaxPopover usar a store (paridade com MaxModal) ou remover a store e atualizar o CLAUDE.md. Mover o cálculo de posição para um computed alimentado por composables criados no setup (resolve também o achado 25).
