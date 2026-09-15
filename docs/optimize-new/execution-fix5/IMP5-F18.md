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

## Budgets congelados

O cenário mede e impõe os seguintes limites durante `confirmCrop`:

| Métrica | Limite | Resultado |
|---|---:|---|
| Duração do crop | < 1.500 ms | aprovado |
| Soma de Long Tasks observadas | < 1.500 ms | aprovado |
| Delta de heap JS, se `performance.memory` disponível | < 96 MiB | medido condicionalmente; não exposto pelo runner Chromium |
| Lifecycle | URL revogada em troca de `src` e unmount | aprovado |

## Comandos executados

```text
npx vitest run --config vitest.browser.config.ts tests/browser/MaxImage.browser.ts
Test Files  1 passed (1)
Tests  5 passed (5)
Duration  12.87s

npx vue-tsc --noEmit --pretty false
exit 0

npx vitest run tests/components/MaxImage.test.ts tests/unit/MaxImage.adversarial.spec.ts
Test Files  2 passed (2)
Tests  37 passed (37)
Duration  1.72s

git diff --check
exit 0
```

HEAD auditado: `41c526941508ddb72c72f1bf31f86d2d2e99bbb4`.
