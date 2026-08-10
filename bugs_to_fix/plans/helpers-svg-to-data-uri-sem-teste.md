# `svgToDataUri()` não tem teste unitário e usa `unescape()` (API depreciada)

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `src/helpers/svgToDataUri.ts:11-15`
- **Domínio:** helpers-composables

## Problema

Não existe `tests/helpers/svgToDataUri.test.ts` — a listagem de `tests/helpers/` contém apenas `cached`, `gap`, `getColorFromVar`, `getCssSize`, `maxAppConfig`, `paddingMargin`, `resolver`, `sanitizeSvg`, `Toast`, `useInputValidation`, `useMirroredModel`. O helper é consumido em produção por `src/components/MaxCreditCard.vue:99-100` e `:149`.

A implementação tem dois pontos sensíveis não exercitados:

```ts
// src/helpers/svgToDataUri.ts:12
const base64 = typeof window !== 'undefined' && typeof window.btoa === 'function' ? window.btoa(unescape(encodeURIComponent(svg))) : Buffer.from(svg, 'utf-8').toString('base64');
```

1. **`unescape()` é depreciada** (Annex B do ECMAScript). O idiom `btoa(unescape(encodeURIComponent(x)))` existe para lidar com caracteres não-ASCII, mas o substituto moderno é `new TextEncoder().encode()` + conversão binária. Nenhum linter atual do projeto sinaliza, mas é uma API cuja remoção é possível.
2. **Dois caminhos de execução divergentes** (browser via `window.btoa`, Node via `Buffer`). Não há nada garantindo que produzam a mesma saída para o mesmo SVG — especialmente com acentos/emoji dentro do markup, que é justamente o caso que o `unescape(encodeURIComponent(...))` tenta cobrir. Sob `happy-dom`, `window.btoa` existe, então o ramo `Buffer` nunca é executado nos testes atuais (nem indiretamente pelos testes de `MaxCreditCard`, se houver).
3. **Sem validação de entrada.** `svgToDataUri('')` devolve `data:image/svg+xml;base64,` — uma URI válida apontando para conteúdo vazio, não distinguível de erro. `MaxCreditCard.vue:149` já faz um guard (`svg ? svgToDataUri(svg) : false`), mas por conta própria.

## Impacto

Uma regressão no branch Node (SSR / geração estática) ou na codificação de SVGs com caracteres não-ASCII passaria despercebida. O consumidor veria imagens de cartão quebradas apenas em runtime, sem sinal em CI.

## Plano de correção

1. Criar `tests/helpers/svgToDataUri.test.ts` cobrindo: SVG ASCII simples; SVG com acentos (`<text>Ação</text>`); string vazia; e paridade entre os dois branches (forçando `window.btoa` como `undefined` via `vi.stubGlobal` para exercitar o `Buffer`).
2. Substituir `unescape(encodeURIComponent(svg))` por uma codificação baseada em `TextEncoder`, ou documentar explicitamente o motivo de manter o idiom legado.
3. Avaliar retornar `''` para entrada vazia/nula, alinhando o contrato ao de `sanitizeSvg` (`src/helpers/sanitizeSvg.ts:18`), que já devolve `''` para entrada falsy.

## Verificação

- Testes a criar/ajustar: `tests/helpers/svgToDataUri.test.ts` (novo)
- Comandos: `npx vitest run tests/helpers/svgToDataUri.test.ts`, `npm run type-check`, `npm run lint`
