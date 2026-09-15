# IMP5-F18 — E07-06: recorte raster de 48 MP

## Manifesto e escopo

- `tests/browser/MaxImage.browser.ts` — fixture e cenários Chromium do crop.
- `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md` — evidência do papel.
- Este relatório.

Não foram alterados arquivos de outro owner. O componente já mantém a implementação exigida: uma chamada a `canvas.toBlob`, `File` e `Blob` obrigatórios, `dataUrl` opcional gerado por `FileReader`, alerta recuperável para `Blob` nulo e revogação de URL ao trocar `src` ou desmontar.

## Reprodução e correção

O cenário de navegador declarava 48 MP, mas criava um SVG com `width` e `height`. Isso não exercitava a decodificação de bitmap raster. O fixture foi substituído por um `canvas` 8000 × 6000 codificado uma vez como PNG e fornecido por Object URL nova a cada montagem.

O teste Chromium confirma:

- dimensões naturais 8000 × 6000 (48 MP);
- uma chamada a `toBlob`, nenhuma a `toDataURL` no caminho padrão;
- `Blob` e `File` não nulos;
- redução proporcional para os limites; erro com `role="alert"` e editor ainda aberto;
- revogação da URL de Object ao trocar `src` e no unmount.

## Budgets congelados e medição obrigatória

O cenário mede e impõe os seguintes limites durante `confirmCrop`:

| Métrica | Limite | Resultado |
|---|---:|---|
| Duração do crop | < 1.500 ms | 802,00 ms |
| Soma de Long Tasks observadas | < 1.500 ms | 665,00 ms |
| Delta de heap JS | < 96 MiB | 0 B (39.600.000 B → 39.600.000 B) |
| Lifecycle | URL revogada em troca de `src` e unmount | aprovado |

Após a rejeição de `REV5-F18`, suporte a `PerformanceObserver` com `longtask` e a `performance.memory` passou a ser pré-condição do teste Chromium. Assim, ambiente sem uma dessas APIs falha de modo explícito; não há fallback para zero nem métrica condicional. O runner atual expôs ambas. A soma de Long Tasks é observada somente entre o início e o fim de `confirmCrop`.

## Comandos executados

```text
npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts --reporter=verbose
Test Files  1 passed (1)
Tests  5 passed (5)
Duration  13.26s

[IMP5-F18] métricas de crop
durationMs: 802
longTaskMs: 665
heapBefore: 39600000
heapAfter: 39600000
heapDelta: 0

npx vue-tsc --noEmit --pretty false
exit 0

npx vitest run tests/components/MaxImage.test.ts tests/unit/MaxImage.adversarial.spec.ts
Test Files  2 passed (2)
Tests  37 passed (37)
Duration  1.72s

git diff --check
exit 0
```

HEAD auditado: `8ee9e0bc25f3a7f82fd516ffd93b2777a1621eed`.
