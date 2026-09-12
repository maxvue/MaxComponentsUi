# Interfaces gráficas não oferecem informação e operação equivalentes

## Resumo
PDF, gráfico, mapa, divisor e recorte expõem conteúdo/ações apenas por canvas, arraste ou ponteiro, sem alternativa textual/teclado.

## Severidade e prioridade
Alta — P1. WCAG 1.1.1, 1.3.1 e 2.1.1.

## Evidências
- `src/components/MaxPdfView.vue:27`: desativa text e annotation layers.
- `src/components/MaxChart.vue:3,20-27,54-60,115`: canvas sem nome por padrão/fallback; seleção só por clique.
- `src/components/MaxMaps.vue:4-6,62-87`: coordenadas mudam somente por marker draggable/dragend.
- `src/components/MaxDividers.vue:32-42`: separator focável reage apenas a mouse/touch, sem orientation/value/setas.
- `src/components/MaxImage.vue:4-12,63-89`: imagem que abre preview não é focável e crop é só pointer.

## Afetados
MaxPdfView, MaxChart, MaxMaps, MaxDividers e preview/crop de MaxImage.

## Causa-raiz
Estado e operação estão presos à camada gráfica, sem modelo alternativo de dados/controles.

## Impacto e reprodução
Usar somente teclado/leitor: não abrir imagem, selecionar gráfico, alterar coordenada/divisão, recortar ou ler texto/links do PDF.

## Direção de correção
Fornecer fallback textual/tabular e controles nativos para todas as operações; manter drag/canvas como método adicional.

## Critérios de aceite
Informação e resultado funcional equivalentes existem sem visão/ponteiro; estados e valores são anunciados.

## Contraevidências
PDF possui botões de zoom/fechar; Chart aceita ariaLabel; Dividers é focável. Essas bases parciais não implementam a operação equivalente.
