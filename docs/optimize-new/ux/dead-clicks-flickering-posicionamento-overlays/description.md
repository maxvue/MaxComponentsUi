# Achado UX-02: overlays não modais consomem cliques e divergem no posicionamento

## Resumo

Parte dos overlays ainda usa backdrops de viewport para fechar dropdowns/listboxes, consumindo o primeiro clique destinado a outro controle. A família também mantém motores de posição diferentes: `MaxBaseOverlay` reage a scroll/resize, enquanto confirmações e vários overlays legados trabalham com coordenadas próprias ou escalares. A alegação antiga de ausência total de infraestrutura compartilhada foi refutada.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Componentes impactados

`MaxInputSelect`, `MaxTagSelect`, `MaxInputDatePicker`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi`, `MaxPopoverMenu`, `MaxUserSection`, `MaxPopoverConfirm` e `useConfirmStore`.

## Evidências

- `MaxInputSelect.vue:52-62`, `MaxInputDatePicker.vue:27-34`, `MaxInputAutoComplete.vue:24-59`, `MaxInputAutoCompleteApi.vue:22-53`, `MaxPopoverMenu.vue:24-54`, `MaxTagSelect.vue:57-138` e `MaxUserSection.vue:48-78`: overlays não modais criam backdrop que intercepta clique.
- `src/components/MaxPopoverConfirm.vue:98-116` calcula posição a partir de coordenadas escalares.
- `src/stores/useConfirm.Store.ts:39-76` armazena `x/y/width/height`, não o elemento âncora, impossibilitando reposicionamento confiável após scroll/layout.
- `src/components/base/MaxBaseOverlay.vue:68-123`: contraevidência — a base existente reposiciona em scroll/resize e centraliza fechamento.

## Causa-raiz

A migração de overlays ocorreu por componente. O contrato compartilhado ainda não foi adotado pela família e a confirmação global perdeu a referência viva ao elemento originador.

## Impacto

- A troca entre controles pode exigir segundo clique.
- Confirmações podem ficar visualmente separadas da ação após scroll ou mudança de layout.
- Comportamentos de viewport, fechamento e foco variam entre widgets semelhantes.

## Reprodução e verificação

Abrir cada dropdown e clicar diretamente em outro controle. Abrir confirmação, rolar janela/ancestral e redimensionar. Comparar com um overlay baseado em `MaxBaseOverlay`.

## Direção de solução

Migrar overlays não modais para um contrato compartilhado que preserve a âncora, reposicione e trate clique externo sem máscara de viewport quando a modalidade não for necessária.

## Critérios de aceite

- Clique externo fecha e alcança o destino quando apropriado ao padrão não modal.
- Overlay mede antes de ficar visível e não salta de lado.
- Posição acompanha scroll/resize mantendo referência à âncora.
- Fechamento e retorno de foco são uniformes e testados.

## Contraevidências consideradas

- Backdrop é válido para diálogo modal, mas os widgets listados se apresentam como menus/listboxes não modais.
- `MaxBaseOverlay` já fornece parte da solução; o problema é sua adoção incompleta.
