# GATE5-IMAGE-PERFORMANCE — relatório de execução

- Papel: `GATE5-IMAGE-PERFORMANCE` (somente leitura de código).
- Agente: `/root/gate5_image_performance`; parent: `/root`.
- Início: `2026-09-15T17:42:00-03:00`; fim: `2026-09-15T17:43:53-03:00`.
- HEAD auditado: `cabb5d710f452a8a27e34d92210a28261491f8ac` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Evidência executada

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts --reporter=verbose

[IMP5-F18] métricas de crop {
  "durationMs": 798.7,
  "heapAfter": 39600000,
  "heapBefore": 39600000,
  "heapDelta": 0,
  "longTaskMs": 661,
}

Test Files  1 passed (1)
     Tests  5 passed (5)
Duration  12.82s
```

O cenário Chromium cria antes do recorte um PNG **raster real** por canvas em `8000 × 6000` (48 MP), confirma `naturalWidth`/`naturalHeight`, e não usa um SVG que apenas declare dimensões. A operação medida respeitou todos os budgets congelados: duração/congelamento percebido `798,7 ms < 1.500 ms`; soma de Long Tasks `661 ms < 1.500 ms`; delta de heap `0 B < 96 MiB`.

## Contratos funcionais e lifecycle

Os cinco casos Chromium aprovados cobrem, no mesmo componente real:

- downscale proporcional com `maxCropWidth=4096`, `maxCropHeight=4096` e `maxCropPixels=16.777.216`;
- exatamente uma chamada a `canvas.toBlob`, nenhuma a `canvas.toDataURL` no caminho padrão e `dataUrl` somente opt-in via `FileReader`;
- `Blob` e `File` não nulos;
- `toBlob(null)` mantém o editor aberto, emite zero eventos e expõe erro recuperável com `role="alert"`;
- revogação da Object URL ativa tanto na troca de `src` quanto no unmount.

O teste exige explicitamente suporte a `longtask` e `performance.memory`; não permite que ausência de instrumentação seja confundida com zero. Não houve warning ou erro de aplicação na saída focal.

## Veredito

**ACEITO.** O crop de 48 MP é raster e mensurado no Chromium, cumpre os três budgets e preserva os contratos de codificação e de ciclo de vida de Object URLs.
