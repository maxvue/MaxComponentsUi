# IMP5-R19 — E10-10 playground compilável e montável

## Escopo e reprodução

No HEAD de partida, `npm --prefix playground run build` falhava no `vue-tsc`: os três usos de `MaxMaps` em `playground/src/scenarios/media-brand.vue` não forneciam a prop obrigatória `modelValue`.

## Correções

- Os três mapas recebem coordenadas válidas `0,0`, preservando o cenário de equador/meridiano.
- Os oito imports repetidos do cenário foram consolidados em uma declaração.
- A regra `:global(...)` inválida foi removida de `src/themes/all.scss`, que já é uma folha global.
- A varredura de auto-import do fonte foi removida do playground: os cenários usam a API pública explicitamente, eliminando os quatro avisos de imports duplicados.
- `MaxPdfView` usa a build essencial de `vue-pdf-embed`, com worker local separado por URL. O maior chunk do playground caiu de `2.507.440 B` (`814.514 B` gzip) para `711.244 B` (`216.388 B` gzip).
- O budget executável passou a `750.000 B` bruto / `245.000 B` gzip: pelo menos 70% menor que o baseline de `2.507.440 B` / `814.514 B` gzip.
- O smoke Chromium importa e monta cada um dos 36 loaders. Para cada cenário, ele exige o nó `data-scenario`, conteúdo renderizado, ausência de avisos/erros do Vue e ausência de `console.warn`/`console.error`. O bootstrap reproduz Pinia, router, tooltip, Icon e a configuração local sem requisitar uma API de menus inexistente.
- Os cenários que ainda produziam avisos foram corrigidos com contratos reais: toolbar Markdown recebe `editor: null`, tags usam `modelValue` array, ListBox tem nome acessível e Popover/Modal recebem props suportadas.

## Evidências executadas

```text
npm --prefix playground run build
✓ built in 3.95s
Maior chunk: .../index.essential-Dtos-r5Y.js (711244 bytes brutos, 216388 bytes gzip).

npm run test:browser -- tests/browser/playgroundSmoke.browser.ts
Test Files  1 passed (1)
Tests       1 passed (1)

npm run build
✓ built in 14.91s

npx eslint playground/src/scenarios/media-brand.vue playground/vite.config.ts scripts/check-playground-bundle.mjs src/components/MaxPdfView.vue tests/browser/playgroundSmoke.browser.ts vitest.browser.config.ts
npx stylelint src/themes/all.scss
```

Todos os comandos acima terminaram com código zero. Não houve commit, conforme a orientação do coordenador.

### Retry após REV5-R19

```text
npm --prefix playground run build
Maior chunk: .../index.essential--nr5g_aC.js (712093 bytes brutos, 216726 bytes gzip).
✓ built in 3.97s

npm run test:browser -- tests/browser/playgroundSmoke.browser.ts
Test Files  1 passed (1)
Tests       1 passed (1)
```

O maior chunk fica 71,6% abaixo do baseline bruto e 73,4% abaixo do gzip. O gate usa tetos de 750.000 B/245.000 B, preservando margem pequena e mensurável para variação de hash/minificação sem voltar próximo do baseline. A revalidação independente de R19 permanece necessária.
