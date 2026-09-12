# Popovers e visualizador PDF não se adaptam a viewports estreitos

## Resumo

Popovers impõem largura mínima de 300 px somada a padding/borda sem clamp ao viewport. `MaxPdfView` usa geometria centrada em 60vw, offsets fixos e `100vh`, sem breakpoint ou safe areas.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- `src/components/MaxPopover.vue:257-271` e `src/components/MaxPopoverConfirm.vue:129-141`: `min-width: 300px`, padding e borda sem `max-width`/media.
- `src/components/MaxPdfView.vue:160-173`: área central fixa em 60vw com padding baseado em vh.
- `src/components/MaxPdfView.vue:213-235`: toolbar usa offsets de 30 px sem safe area.
- `MaxModal` (`src/components/MaxModal.vue:457-483`) e `MaxLoadScreenTarget` (`src/components/MaxLoadScreenTarget.vue:98-107`) demonstram clamps existentes.

## Componentes e consumidores afetados

`MaxPopover`, `MaxPopoverConfirm` e `MaxPdfView` em celulares de 280–320 px, landscape e zoom elevado.

## Causa-raiz

Geometria desktop foi preservada sem compartilhar o helper de largura/clamp usado por overlays recentes.

## Impacto visual e funcional

Overflow/corte lateral, ações inacessíveis, PDF excessivamente estreito e toolbar competindo com conteúdo/notch.

## Reprodução e verificação

Usar viewport de 280/320 px e zoom 200%; abrir os popovers/PDF e verificar overflow e alcance dos controles.

## Direção recomendada

Aplicar `box-sizing`, largura máxima pelo viewport/safe area e layout responsivo; reutilizar a estratégia da base de overlay.

## Critérios de aceite

- Nenhuma caixa ultrapassa a largura útil em 280 px.
- Controles visíveis em landscape, zoom 200% e safe areas.
- Testes exercitam dimensões em múltiplos viewports.

## Contraevidências consideradas

Reposicionamento reduz escape lateral, mas não encolhe caixa cuja largura mínima externa supera o viewport.
