# REV5-R22 — E11-01: alinhamento DOM da calha virtualizada

## Escopo e referência

Refutação independente, somente leitura, no HEAD
`f38c9b70546a7a472ee71afb524a5c61a8b7a508`, confrontado com a referência
adversarial `aac16bca`.

O contrato R22 exige que cada número renderizado seja medido contra a linha DOM
correspondente em 10.000 linhas, no início/meio/fim, sem espelhar a fórmula de
virtualização, e que cursor, teclado e resize permaneçam funcionais.

## Caso adversarial e inspeção

O cenário em `tests/browser/MaxInputTextList.browser.ts` cria uma régua DOM com
10.000 `span`s, usando somente a tipografia e o padding computados do
`textarea`. Para cada número visível, ele compara `getBoundingClientRect().top`
e `.height` com o `span[data-line]` de mesmo número, com tolerância de 1 px, em
100% e 200% de zoom e nos três pontos de scroll. Não lê nem calcula
`translateY`, `startIndex`, `offsetY`, `LINE_HEIGHT` ou `OVERSCAN`.

Esse caso é capaz de refutar `aac16bca`: a referência não fixa a altura da
calha à viewport (`height: viewportHeight`), não aplica `box-sizing: border-box`
à calha e deixa o padding do `textarea` sujeito à regra prioritária de
`InputBase`. Assim, a régua DOM e a calha possuem viewport/ponto de início
distintos, sobretudo no fim do scroll; a comparação de retângulos introduzida
no HEAD expõe exatamente esse desalinhamento. O diff contra a referência mostra
as três correções correspondentes, além da substituição da antiga asserção
tautológica de fórmula pela medição DOM.

O segundo cenário preserva posicionamento de cursor, Enter, Tab (inclusive
reposicionamento de seleção), ArrowLeft sem `preventDefault` e igualdade de
altura calha/textarea após `ResizeObserver`.

## Evidência executada

```text
$ npx vitest --config vitest.browser.config.ts run tests/browser/MaxInputTextList.browser.ts

RUN  v4.1.11 /home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-optimize-fix5

Test Files  1 passed (1)
Tests       4 passed (4)
Duration    3.88s
```

O `vitest.browser.config.ts` declara o provider Playwright com instância
`chromium`, portanto esta é uma execução em navegador real. `git diff --check
aac16bca..HEAD -- src/components/MaxInputTextList.vue
tests/browser/MaxInputTextList.browser.ts` não produziu saída.

## Veredito

**ACEITO.** A refutação substitui o cálculo interno por geometria DOM
independente, cobre 10.000 linhas nos pontos e zooms exigidos e confirmou em
Chromium a preservação de cursor, teclado e resize.
