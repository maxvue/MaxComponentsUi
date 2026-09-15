# REV5-F18 — refutação independente de E07-06

- Papel: `REV5-F18` (somente leitura).
- Referência adversarial: `aac16bca`.
- HEAD auditado: `927560b0c0d08a29c7a8255dfb5c6aaf787b9e12`.
- Início/fim: `2026-09-15T14:41:00-03:00` / `2026-09-15T14:43:00-03:00`.

## Caso adversarial e comparação

O caso exigido é uma foto **raster** 8000 × 6000 (48 MP), seguida de `confirmCrop`, com inspeção de codificação, payload, erro e ciclo de vida. A referência `aac16bca` falha este critério de evidência: seu próprio cenário `tests/browser/MaxImage.browser.ts` constrói um `Blob` `image/svg+xml` com atributos `width="8000" height="6000"`; portanto, não aloca nem decodifica bitmap raster de 48 MP. A mudança posterior troca o fixture por um canvas 8000 × 6000, codificado como PNG via `canvas.toBlob`, e confirma `naturalWidth === 8000` e `naturalHeight === 6000` antes do crop.

No HEAD, a implementação de `MaxImage.vue` usa uma única chamada a `canvas.toBlob` para o output, gera `dataUrl` somente por `FileReader` quando `includeDataUrl` é verdadeiro, exige `Blob` antes de construir `File`, mantém o editor aberto com alerta recuperável quando a codificação falha e revoga a URL ativa tanto na troca de `src` quanto no unmount. Os cinco cenários Chromium também exercitam sucesso raster, opt-in de data URL, ambas as revogações e `toBlob(null)`.

## Execução independente

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts

 RUN  v4.1.11 /home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-optimize-fix5

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  13.14s (transform 0ms, setup 5ms, import 1.23s, tests 11.11s, environment 0ms)
```

## Refutação dos budgets

O bloco **não pode ser aceito** ainda. Embora os limites estejam declarados (`duration < 1500 ms`, long tasks `< 1500 ms`, heap `< 96 MiB`), a suíte não registra os valores obtidos para heap, long tasks ou congelamento; o relatório do implementador só escreve “aprovado”. Pior, `PerformanceObserver.observe({ type: 'longtask' })` é envolvido em `try/catch` e a ausência da API resulta em lista vazia (0 ms), enquanto heap é totalmente condicional a `performance.memory`. Assim, uma execução sem instrumentação de Long Tasks/heap passa como se tivesse sido medida. Também não há uma métrica independente de congelamento/UI além da duração total de `confirmCrop`.

Isso viola diretamente o requisito de registrar Long Tasks, heap e congelamento contra budgets congelados. O raster, `toBlob` único, ausência de `toDataURL` por padrão, `Blob`/`File`, falha recuperável e lifecycle estão comprovados; as métricas de performance obrigatórias, não.

## Veredito

**REJEITADO.** Retornar ao implementador para tornar a instrumentação obrigatória (ou classificar explicitamente indisponibilidade como bloqueio), registrar valores observados por execução e medir congelamento/UI. O retry deste mesmo papel deve reexecutar o raster real e anexar os valores aos limites congelados.
