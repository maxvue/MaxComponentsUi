# Recorte de imagem codifica duas vezes e não limita resolução

## Resumo

Ao confirmar um recorte, `MaxImage` cria um canvas na resolução natural, codifica o mesmo bitmap uma vez de forma síncrona para data URL e outra vez para Blob, e mantém `dataUrl`, `blob` e `file` simultaneamente no payload.

## Severidade e prioridade

- Severidade: alta.
- Prioridade: P1.

## Evidências

- `src/components/MaxImage.vue:471-491`: dimensões do canvas derivam da resolução natural do recorte, sem teto ou downscale.
- `src/components/MaxImage.vue:496-504`: `canvas.toDataURL` síncrono é seguido por `canvas.toBlob` para o mesmo conteúdo.
- `src/components/MaxImage.vue:506-516`: o payload mantém data URL, Blob e File.
- `tests/components/MaxImage.test.ts:194-208` simula o payload e não exercita canvas ou encoding real.

## Componentes afetados

`MaxImage` em fluxos de edição/recorte, principalmente fotos de câmera de alta resolução.

## Causa-raiz

O contrato de evento exige três representações do mesmo resultado e a implementação as produz eager, em vez de eleger uma representação binária canônica e derivar as demais sob demanda. Não há política explícita de dimensão, pixels ou bytes.

## Impacto quantificado

Uma foto de 12 MP recortada a 80% em cada eixo produz cerca de 7,68 MP; somente o backing RGBA do canvas representa aproximadamente 30,7 MB (`7,68M × 4`), antes de strings/cópias. Base64 adiciona cerca de 33% sobre os bytes codificados, e o conteúdo é comprimido duas vezes.

## Reprodução e benchmark

Recortar imagens de 3, 12 e 48 MP; medir Long Tasks, duração de `confirmCrop`, pico de heap e tamanho das três representações. Executar em desktop e dispositivo móvel com throttling.

## Direção de solução

Definir limites de pixels/dimensões, aplicar downscale quando apropriado, codificar uma única vez para Blob e tornar data URL opcional/derivada. Considerar `OffscreenCanvas`/worker quando suportado, com fallback.

## Critérios de aceite

- Um recorte grande respeita limites configurados e não bloqueia a thread principal além do orçamento definido.
- O bitmap não é comprimido duas vezes por padrão.
- Representações opcionais mantêm compatibilidade por migração documentada.
- Teste real de canvas ou benchmark de navegador cobre alta resolução e erro de codificação.

## Contraevidências

- Para imagens pequenas, o custo pode ser imperceptível.
- Blob e File podem compartilhar armazenamento interno em alguns navegadores, portanto não se afirma triplicação exata de memória.
- O impacto absoluto depende do codec, conteúdo e dispositivo.
