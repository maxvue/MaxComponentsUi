# Plano de implementação — overlays não modais sem dead click

## Objetivo e resultado

Migrar overlays modeless ao contrato de `MaxBaseOverlay`: clique externo fecha sem máscara, posição é medida antes de aparecer e acompanha âncora em scroll/resize. Confirmação global mantém referência viva ao originador.

## Escopo e fora de escopo

- Cobrir Select, TagSelect, DatePicker, dois autocompletes, PopoverMenu, UserSection e PopoverConfirm/store.
- Reusar uma infraestrutura compartilhada.
- Não retirar backdrop de diálogos realmente modais nem misturar focus trap em listboxes modeless.

## Arquivos

- Ampliar `src/components/base/MaxBaseOverlay.vue` e testes.
- Alterar os oito componentes modeless citados e testes.
- Alterar `src/components/MaxPopoverConfirm.vue`, `src/stores/useConfirm.Store.ts`, tipos/testes.
- Remover CSS/backdrops legados somente após migração.

## Dependências e ordem

1. Completar base (medição oculta, outside pointer, clamp, stack).
2. Migrar selects/autocompletes/date.
3. Migrar menus/user.
4. Migrar confirmação/âncora.
5. Integrar foco/ARIA dos achados correlatos.

## Passos

1. Na base, posicionar em fase oculta antes de pintar; usar `pointerdown`/`click` em capture conforme teste para fechar sem impedir evento do destino.
2. Ignorar eventos dentro do painel/âncora e remover listeners/rAF idempotentemente.
3. Reposicionar em scroll de ancestrais, resize e ResizeObserver de painel/âncora, com clamp.
4. Remover backdrops transparentes dos widgets modeless e delegar Escape/outside/retorno à base.
5. Preservar alvo por HTMLElement em `shallowRef`/`markRaw` no confirm store, com fallback de rect somente para compatibilidade; limpar referência ao fechar.
6. Fazer PopoverConfirm acompanhar a âncora e definir fallback se ela desconectar.
7. Uniformizar eventos show/hide e retorno de foco apenas quando apropriado (clique em outro controle conserva foco no destino).
8. Testar abertura simultânea/stack e evitar listener por overlay fechado.

## Migração e testes

Props/emits atuais permanecem; coordenadas do confirm podem ser depreciadas em favor de target. Unitários cobrem outside click que chega ao destino, medição, scroll/resize/disconnect e cleanup; browser testa flicker/posição/zoom; a11y cobre foco modeless. Benchmark conta layouts/listeners por frame.

## Aceite

Um clique troca controles sem segundo clique; overlay não aparece em posição provisória; rect acompanha âncora após scroll/resize; nenhum backdrop modeless intercepta viewport; listeners zeram no close/unmount.

## Riscos e rollback

Capture pode fechar antes da ação destino; testar ordem e não prevenir default. HTMLElement em Pinia não deve virar reativo/serializado. Rollback por componente para base anterior, mantendo novo contrato testado.

## Validação final

Testes base+componentes/store, browser em scroll aninhado/resize, inspeção de listeners/layout shifts, suíte, type-check, lint e `git diff --check`.
