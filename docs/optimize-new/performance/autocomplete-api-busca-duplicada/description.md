# Autocomplete API busca e emite duas vezes por digitação

## Resumo

`MaxInputAutoCompleteApi` chama `search()` no handler do input e novamente no watcher da ref alterada pelo mesmo handler. Cada tecla pode percorrer toda a lista e emitir `complete` duas vezes.

## Severidade e prioridade

- Severidade: média.
- Prioridade: P2.

## Evidências

- `src/components/MaxInputAutoCompleteApi.vue:186-193`: `search()` filtra toda a lista e emite `complete`.
- `src/components/MaxInputAutoCompleteApi.vue:200-205`: `onInput` altera `temp_value` e chama `search()`.
- `src/components/MaxInputAutoCompleteApi.vue:247-251`: o watcher de `temp_value` chama `search()` outra vez.
- A sequência determinística é de dois scans `O(n)` e dois emits por evento de input comum.

## Componentes afetados

`MaxInputAutoCompleteApi` e consumidores que executam efeitos/requisições no evento `complete`.

## Causa-raiz

A responsabilidade pela busca está duplicada entre o evento DOM e a sincronização reativa, sem uma fonte única de verdade nem debounce/cancelamento no contrato.

## Impacto quantificado

Para `n` itens, cada digitação executa `2n` avaliações de filtro em vez de `n` e emite exatamente duas notificações `complete`. Se o consumidor inicia trabalho assíncrono por emissão, o custo externo também duplica.

## Reprodução e benchmark

Montar com 10.000 itens, espionar `complete`, digitar um caractere e medir contagem/duração. Repetir com consumidor que inicia request no evento.

## Direção de solução

Centralizar a busca em um único caminho; separar atualização local, filtragem e solicitação remota; adicionar debounce/cancelamento configurável quando o evento puder disparar rede.

## Critérios de aceite

- Uma alteração do input produz no máximo um scan e um evento `complete`.
- Seleção programática e mudanças externas mantêm o contrato esperado.
- Teste verifica explicitamente contagem de emits e chamadas do filtro.

## Contraevidências

- Listas pequenas mascaram o custo.
- O componente `MaxInputAutoComplete` possui fluxo diferente; este achado não deve ser aplicado a ele sem análise própria.
