# REV5-R19 — refutação E10-10

## Veredito

**ACEITO na revalidação.** O retry corrige os dois motivos da rejeição
anterior: o gate aplica 750.000 B bruto / 245.000 B gzip, e o smoke Chromium
percorre e monta os 36 loaders com seus marcadores e conteúdo reais, reprovando
avisos e erros do Vue e do console por cenário.

## Evidências

- HEAD auditado: `1a4a6f432c195d29d4daa792604693f858810559`.
- Referência adversarial `aac16bca`: `media-brand.vue` contém três ocorrências
  de `<MaxMaps />` sem `modelValue`. No HEAD, as três ocorrências passam
  `:model-value="mapCoordinates"`, onde as coordenadas são `{ latitude: 0,
  longitude: 0 }`; isto respeita o contrato de `MaxMaps` e preserva equador e
  meridiano.
- `npm --prefix playground run build`: passou. Inclui `vue-tsc`, Vite e
  `check-playground-bundle.mjs`; maior chunk efetivo:
  `index.essential--nr5g_aC.js`, 712.093 B bruto e 216.726 B gzip.
  Isso fica 71,6% abaixo dos 2.507.440 B brutos e 73,4% abaixo dos 814.514 B
  gzip do baseline. Os tetos deixam 37.907 B (bruto) e 28.274 B (gzip) de
  margem para a medição atual e continuam pelo menos 70% menores que o
  baseline.
- `npm run test:browser -- tests/browser/playgroundSmoke.browser.ts`: passou
  no Chromium, 1 arquivo/1 teste. O teste exige exatamente 36 IDs, importa e
  monta cada módulo, aguarda frame/`nextTick`, verifica `data-scenario`,
  conteúdo renderizado e intercepta `warnHandler`, `errorHandler`,
  `console.warn` e `console.error` individualmente em cada cenário.
- Não há `:global(...)` em `src/themes/all.scss`; os usos restantes ocorrem
  apenas em SFCs scoped, onde a sintaxe é válida.

O Vite imprimiu o relatório informativo `[PLUGIN_TIMINGS]`; ele não é warning
de aplicação nem erro de compilação. A build não emitiu os warnings de imports
duplicados ou CSS `:global` inválido que bloqueavam E10-10.

## Caso adversarial

Os dois casos adversariais que rejeitavam o commit anterior agora são
detectados: elevar um chunk acima de 750.000 B/245.000 B faz o script falhar,
e qualquer cenário sem marcador, conteúdo, ou com emissão de warning/erro
falha dentro de sua própria iteração de montagem.

## Comandos executados

```text
npm --prefix playground run build                         # código 0
npm run test:browser -- tests/browser/playgroundSmoke.browser.ts # código 0
git show aac16bca:playground/src/scenarios/media-brand.vue # três MaxMaps sem modelValue
```
