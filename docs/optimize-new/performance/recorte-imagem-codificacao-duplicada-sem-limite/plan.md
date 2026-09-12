# Plano de implementação — recorte de imagem com codificação única e limites

## Objetivo e resultado

Limitar pixels/dimensões do bitmap de recorte e codificar uma única vez para Blob. Representações adicionais serão derivadas somente quando exigidas pelo modo de compatibilidade, reduzindo bloqueio e memória em fotos grandes.

## Escopo e fora de escopo

- Definir limites configuráveis, downscale proporcional, codec/qualidade e erros.
- Tornar Blob a representação canônica e migrar `MaxImageEditPayload`.
- Preservar preview, crop, `onEdit` e eventos.
- Não redesenhar a UI de recorte nem implementar editor completo.
- Worker/`OffscreenCanvas` é otimização posterior, condicionada a benchmark.

## Arquivos

- Alterar `src/components/MaxImage.vue` e `tests/components/MaxImage.test.ts`.
- Alterar tipos/documentação pública onde `MaxImageEditPayload` é descrito/exportado.
- Criar teste de navegador/benchmark de crop grande se jsdom não oferecer canvas real.

## Dependências e ordem

1. Definir contrato e orçamento suportado por navegadores-alvo.
2. Testar cálculo de dimensões e falhas.
3. Implementar downscale/codificação única.
4. Adicionar compatibilidade opcional de data URL e benchmark.

## Passos

1. Adicionar props com defaults documentados para máximo de largura, altura e pixels, MIME/qualidade e inclusão opcional de data URL.
2. Extrair função pura que calcule dimensões de saída preservando proporção e nunca amplie o recorte.
3. Dimensionar canvas pelo resultado limitado e desenhar origem natural diretamente nessa saída.
4. Executar apenas `canvas.toBlob`; rejeitar `null`/exceção com estado recuperável e sem fechar o editor.
5. Criar `File` a partir do Blob sem nova compressão. Gerar data URL do Blob somente no modo legado/opt-in.
6. Para atualizar `currentSrc` sem base64, usar Object URL temporária, revogando a anterior no replace/close/unmount.
7. Definir migração do payload: manter campos antigos por uma janela de depreciação ou lançar a mudança em major; marcar campo opcional nos tipos somente com documentação.
8. Avaliar `OffscreenCanvas`/worker após medir; manter fallback assíncrono em canvas comum.

## Migração e compatibilidade

Eventos `edit`/`crop` e `onEdit` permanecem. Se consumidores exigem `dataUrl` obrigatório, manter modo legado com aviso e data URL derivada do Blob; numa major, torná-lo opcional. Defaults devem limitar imagens grandes sem alterar pequenas. Documentar diferenças de dimensões e qualidade.

## Testes

- Unitários: cálculo 3/12/48 MP, proporção, sem upscale, JPEG/PNG, `toBlob(null)`, exceção e cleanup de Object URL.
- Integração em navegador: canvas real, eventos/payload, cancelar/tentar novamente e unmount.
- A11y: erro anunciado e botões permanecem operáveis por teclado.
- Benchmark: Long Tasks, duração e heap em desktop/mobile throttled; contar uma única compressão.

## Critérios de aceite

- Saída nunca excede limites configurados.
- `toBlob` é chamado uma vez e `toDataURL` zero vezes por padrão.
- Foto de 48 MP conclui sem exceder orçamento definido no baseline nem congelar a UI além do limite aprovado.
- URLs temporárias são revogadas exatamente uma vez.
- Pequenas imagens preservam dimensões e eventos.

## Riscos e rollback

Downscale pode reduzir qualidade e payload opcional pode quebrar consumidores; mitigar por defaults, modo legado e major quando necessário. Object URL revogada cedo quebra preview; testar ciclo completo. Rollback reativa o modo legado por flag sem remover limites seguros.

## Validação final

Rodar testes focados e de navegador, benchmark comparativo, `npm run type-check`, suíte completa, lint e `git diff --check`.
