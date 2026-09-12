# SVGs de cartão incorporados e duplicados no bundle JavaScript

## Resumo

`MaxCreditCard` importa 14 SVGs como texto bruto. Três pares são byte a byte idênticos e o SVG de JCB concentra 82.410 bytes. Como o componente é exportado estaticamente pelo entry principal, esses textos integram o artefato monolítico.

## Severidade e prioridade

- Severidade: média; o custo é confirmado para `MaxCreditCard`, mas pode ser removido por tree-shaking quando o componente não é usado.
- Prioridade: P2.

## Evidências

- `src/components/MaxCreditCard.vue:71-84`: 14 imports `?raw`.
- `src/components/MaxCreditCard.vue:86-101`: aliases de bandeira usam imports separados, inclusive pares idênticos.
- `src/components/MaxCreditCard.vue:103-104`: frente e verso são convertidos para data URI na avaliação do módulo.
- `src/index.ts:91`: exportação estática de `MaxCreditCard`.
- `find src/assets/credit-card -type f -printf '%s %f\n'`: soma exata de 189.769 bytes; `card-jcb.svg` tem 82.410 bytes.
- `sha256sum src/assets/credit-card/*.svg`: `amex/american-express`, `diners/diners-club` e `hiper/hipercard` formam três pares idênticos, totalizando 32.878 bytes físicos redundantes.
- Análise dos assets e do `dist/index.es.js`: 14 strings SVG totalizaram 189.769 caracteres; o build isolado da refutação mediu 941.654 bytes.

## Componentes afetados

`MaxCreditCard`, o entry `src/index.ts`, os 14 arquivos de `src/assets/credit-card/` e qualquer consumidor do entry principal.

## Causa-raiz

Aliases funcionais foram modelados como cópias físicas e imports distintos. Além disso, assets detalhados foram tratados como strings JS eager, sem etapa de otimização vetorial ou fronteira de carregamento própria.

## Impacto quantificado

- 189.769 bytes de SVG fonte entram no grafo do componente.
- 32.878 bytes são duplicação exata entre aliases.
- Um único asset, JCB, responde por 82.410 bytes, 43,4% do total bruto.

Não se atribui aqui um número de FCP/TTI: o custo final depende do bundler, compressão, cache e forma de importação do consumidor.

## Reprodução e benchmark

Executar `find ... -printf`, `sha256sum` e `npx vite build`; depois comparar os tamanhos bruto, gzip e Brotli do entry antes/depois. Um bundle consumidor deve importar apenas `MaxCreditCard` e validar rede, parse e heap.

## Direção de solução

Deduplicar aliases no mapa lógico, otimizar os SVGs com regressão visual e separar assets pesados do entry eager, preservando compatibilidade e política de segurança para SVG.

## Critérios de aceite

- Nenhum par idêntico é publicado duas vezes.
- O JCB passa por otimização com snapshot/regressão visual.
- O bundle consumidor não baixa bandeiras não utilizadas sem necessidade.
- Há orçamento automatizado de tamanho bruto e comprimido.

## Contraevidências

- Minificação e gzip reduzem parte da redundância.
- Um bundler consumidor pode eliminar `MaxCreditCard` quando o entry e seus efeitos permitirem tree-shaking; portanto, o custo não é universal para toda aplicação.
- Não foi executado `rollup-plugin-visualizer`, e não há base para prometer uma faixa específica de tamanho do JCB otimizado.
