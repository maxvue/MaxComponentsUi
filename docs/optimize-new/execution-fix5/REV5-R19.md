# REV5-R19 — refutação E10-10

## Veredito

**REJEITADO.** A correção resolve o `modelValue` de `MaxMaps`, compila e passa
o smoke focal, mas não satisfaz dois requisitos explícitos de E10-10:

1. o orçamento executável está praticamente no mesmo nível do baseline de
   2,5 MB, embora o maior chunk real seja 711.244 B;
2. o smoke importa os 36 loaders, porém monta somente `media-loaders`; os
   outros 35 cenários não têm seus componentes/estados montados em Chromium.

## Evidências

- HEAD auditado: `7668372d9efc92f9c0cf4659df98634a03f89268`.
- Referência adversarial `aac16bca`: `media-brand.vue` contém três ocorrências
  de `<MaxMaps />` sem `modelValue`. No HEAD, as três ocorrências passam
  `:model-value="mapCoordinates"`, onde as coordenadas são `{ latitude: 0,
  longitude: 0 }`; isto respeita o contrato de `MaxMaps` e preserva equador e
  meridiano.
- `npm --prefix playground run build`: passou. Inclui `vue-tsc`, Vite e
  `check-playground-bundle.mjs`; maior chunk efetivo:
  `index.essential-Dtos-r5Y.js`, 711.244 B bruto e 216.388 B gzip.
- `npm run test:browser -- tests/browser/playgroundSmoke.browser.ts`: passou
  no Chromium, 1 arquivo/1 teste.
- ESLint focal e Stylelint de `src/themes/all.scss`: passaram sem saída de
  diagnóstico.
- Não há `:global(...)` em `src/themes/all.scss`; os usos restantes ocorrem
  apenas em SFCs scoped, onde a sintaxe é válida.

## Caso adversarial

O script `scripts/check-playground-bundle.mjs` fixa limites em 2.500.000 B
bruto e 814.000 B gzip, contra os baselines declarados de 2.507.440 B e
814.514 B. As margens são somente 7.440 B (0,297%) e 514 B (0,063%),
respectivamente: uma regressão até quase o bundle de 2,5 MB continuaria
aceita, contrariando o requisito de orçamento abaixo do baseline **e não
quase igual ao chunk atual**. Como a própria build mediu 711.244 B / 216.388
B, o limite não protege a melhora obtida.

Em `tests/browser/playgroundSmoke.browser.ts`, o laço chama cada loader e
verifica apenas `module.default`; em seguida só cria/monta a aplicação para
`SCENARIO_LOADERS['media-loaders']`. Portanto importação não equivale a
montagem dos loaders/estados reais de todos os cenários e não detectaria uma
falha de renderização de outro cenário.

## Correção solicitada

- Definir budgets com folga material sobre o maior chunk medido (e documentar
  a política), em vez de limites a menos de 1% do baseline removido.
- Montar cada loader no Chromium (com Pinia/diretivas necessárias), aguardar
  renderização e afirmar o marcador/estados de cada cenário; manter o teste
  específico de `media-loaders` como complemento, não como substituto.

## Comandos executados

```text
npm --prefix playground run build                         # código 0
npm run test:browser -- tests/browser/playgroundSmoke.browser.ts # código 0
npx eslint playground/src/scenarios/media-brand.vue playground/vite.config.ts scripts/check-playground-bundle.mjs src/components/MaxPdfView.vue tests/browser/playgroundSmoke.browser.ts vitest.browser.config.ts # código 0
npx stylelint src/themes/all.scss                          # código 0
git show aac16bca:playground/src/scenarios/media-brand.vue # três MaxMaps sem modelValue
```
