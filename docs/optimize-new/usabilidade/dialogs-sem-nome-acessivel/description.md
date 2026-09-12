# Dialogs permitem nome ausente ou referência de título órfã

## Resumo
Bases de modal associam `aria-labelledby` a nós que podem desaparecer quando slots substituem o fallback e permitem dialog sem título nem aria-label.

## Severidade e prioridade
Alta — P1. WCAG 4.1.2.

## Evidências
- `src/components/MaxDrawer.vue:16-25`: header opcional; slot pode substituir o nó com ID.
- `src/components/MaxPopover.vue:25-38,127-128`: título opcional e mesmo risco com slot.
- `src/components/MaxModal.vue:19-39,190`: slot header substitui o único alvo do ID.
- `src/components/base/MaxBaseOverlay.vue:8-12,39-52`: role dialog sem API de nome.
- `src/components/MaxSideMenuMobile.vue:2-9`: Drawer modal real sem header/aria-label.

## Afetados
Drawer, Modal, Popover, BaseOverlay e consumidores com header customizado/ausente.

## Causa-raiz
O ID pertence ao conteúdo fallback, não a um contrato estável, e nome acessível não é exigido pela API.

## Impacto e reprodução
Abrir o SideMenuMobile ou usar slot header; consultar accessible name: vazio ou `aria-labelledby` aponta para ID inexistente.

## Direção de correção
Manter elemento de título estável ou fornecer IDs ao slot; exigir/derivar aria-label quando não houver título.

## Critérios de aceite
Todo dialog aberto tem nome não vazio e referências existentes, inclusive com slots e defaults.

## Contraevidências
MaxImage/MaxPdf têm aria-label e PopoverConfirm possui labelledby válido.
