# Editor numerado materializa todas as linhas

## Resumo

`MaxInputTextList` cria um nó de numeração por linha e recalcula a contagem com `split` integral a cada alteração. Textos extensos tornam montagem e edição proporcionais ao documento inteiro.

## Severidade e prioridade

- Severidade: média a alta para documentos extensos.
- Prioridade: P2.

## Evidências

- `src/components/MaxInputTextList.vue:5`: um `<div>` é criado para cada número de linha.
- `src/components/MaxInputTextList.vue:64-66`: a contagem divide todo o texto a cada mudança.
- Microbenchmark Node 24/jsdom: 100/1.000/10.000 linhas criaram exatamente 100/1.000/10.000 nós; montagem em cerca de 19,8/48,7/2.065,5 ms e input+patch em 3,4/4,0/15,3 ms. Os tempos são indicativos, não equivalem a navegador real.
- `tests/components/MaxInputTextList.test.ts:17-27,90-100` cobre somente 3 e 10 linhas.

## Componentes afetados

`MaxInputTextList` em logs, scripts, listas coladas e outros textos com milhares de linhas.

## Causa-raiz

A numeração visual é representada como uma lista DOM completa sincronizada a uma contagem derivada por scan total, sem viewport, limite de tamanho ou estratégia incremental.

## Impacto quantificado

Dez mil linhas adicionam dez mil nós ao DOM. Tanto a contagem quanto a numeração crescem linearmente com o documento; o microbenchmark registrou aproximadamente 2,06 s de montagem nesse ambiente sintético.

## Reprodução e benchmark

Montar textos de 100, 1.000 e 10.000 linhas; contar `.line-number`; medir mount, input, heap e nós no navegador e no teste sintético versionado.

## Direção de solução

Virtualizar a calha de números, desenhá-la por CSS/canvas quando adequado ou limitar o modo numerado; reduzir rescans por edição incremental/coalescida.

## Critérios de aceite

- A quantidade de nós de numeração é limitada pela viewport/overscan.
- Scroll e alinhamento continuam precisos.
- Digitação não remonta a calha inteira.
- Teste/benchmark cobre pelo menos 10.000 linhas.

## Contraevidências

- Para 3–10 linhas, o custo é irrelevante e os testes atuais passam.
- Tempos de jsdom não devem ser apresentados como desempenho de Chrome/Safari/Firefox.
