# MaxInputAutoCompleteApi permite que consulta antiga sobrescreva dados atuais

## Resumo
Cada mudança profunda de `props.data` inicia leitura/cache/API e aplica o resultado sem verificar se ainda corresponde às props atuais. Respostas fora de ordem restauram opções antigas.

## Severidade e prioridade
**Alta / P1.** Sugestões incorretas podem ser selecionadas e persistidas no formulário.

## Evidências
- `MaxInputAutoCompleteApi.vue:149-162`: watcher imediato cria `applyList` e usa `.then(applyList)` sem request id/cancelamento.
- O callback pode ser chamado pelo `getCachedApiIDB` e novamente pela Promise, ampliando janelas de revalidação.
- A API de MaxUse aceita `signal`, mas o componente não fornece AbortController.
- `MaxInputAutoCompleteApi.test.ts` usa resolução imediata e não inverte a ordem de duas consultas.

## Afetados
`MaxInputAutoCompleteApi`, formulários dependentes de filtros encadeados e usuários em redes lentas.

## Causa-raiz
Resultado assíncrono não carrega identidade da geração de props que o originou.

## Impacto
Alterar rapidamente empresa/projeto/endereço pode mostrar opções do contexto anterior; selecionar uma delas emite valor semanticamente inválido para o estado atual.

## Reprodução
Mockar duas Promises para mudanças consecutivas de `data`, resolver a segunda e depois a primeira; `list` termina com a primeira.

## Direção de correção
Incrementar geração por consulta e/ou abortar anterior; aplicar cache/revalidação somente se geração e parâmetros ainda forem atuais; separar callback de cache da resolução final sem aplicação duplicada.

## Critérios de aceite
- Última mudança vence independentemente da ordem de resolução.
- Request anterior é abortada/ignorada no unmount.
- Teste cobre cache inicial, revalidação e ordem invertida.

## Contraevidências consideradas
Comparação `isEqual(newValue, oldValue)` evita requisição quando dados não mudam, mas não ordena requisições distintas já iniciadas.
