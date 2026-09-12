# Plano de implementação — eliminar busca duplicada no `MaxInputAutoCompleteApi`

## Objetivo e resultado esperado

Consolidar a reação a uma mudança de `temp_value` em um único caminho, eliminando o segundo `filter` e o segundo evento `complete` causados por uma mesma digitação. Ao final, cada evento DOM `input` que efetivamente altera o texto deve produzir exatamente uma filtragem da lista atual, no máximo uma emissão de `complete` e a atualização correta da abertura do painel, sem alterar o resultado da filtragem, a seleção de opções ou a validação do campo.

## Escopo

- Refatorar o fluxo de entrada em `src/components/MaxInputAutoCompleteApi.vue` para que `onInput` e o watcher de `temp_value` não executem a mesma busca.
- Preservar os demais gatilhos intencionais de busca: aplicação de uma nova lista recebida da API, foco com texto existente e abertura por seta para baixo.
- Preservar a atualização de `isDone`, a emissão de `update:modelValue` ao selecionar um objeto e o fechamento/estado de navegação do painel.
- Ampliar `tests/components/MaxInputAutoCompleteApi.test.ts` com regressões que contem filtragens e emissões por interação e cubram os caminhos adjacentes.
- Medir o custo antes/depois com uma lista sintética de 10.000 itens, preferencialmente em teste de benchmark isolado do conjunto unitário normal.

## Fora de escopo

- Implementar virtualização da lista; isso pertence ao achado `performance/falta-virtualizacao-colecoes-grandes`.
- Corrigir concorrência ou cancelamento de respostas da API; isso pertence ao achado `testes_estabilidade/autocomplete_api_resposta_obsoleta`.
- Remodelar semântica ARIA, backdrop ou posicionamento do overlay, já cobertos por achados próprios.
- Aplicar a mudança ao `MaxInputAutoComplete.vue`, cujo fluxo é diferente.
- Ativar ou redefinir nesta correção as props hoje não aplicadas `delay` e `minLength`. Debounce de eventos externos exige contrato documentado, temporizadores e política de cancelamento; deve ser tratado separadamente para não esconder a regressão de duplicidade nem introduzir quebra silenciosa.
- Alterar a API pública, o formato dos itens, a estratégia de normalização ou o conteúdo do evento `complete`.

## Arquivos a alterar ou criar

- Alterar `src/components/MaxInputAutoCompleteApi.vue`.
- Alterar `tests/components/MaxInputAutoCompleteApi.test.ts`.
- Opcionalmente criar `tests/benchmarks/MaxInputAutoCompleteApi.bench.ts` somente se a infraestrutura vigente executar benchmarks separadamente; caso contrário, registrar a medição em teste opt-in ou no relatório da implementação, sem incluir limite de tempo instável na suíte unitária.

Não são necessárias mudanças em `src/index.ts`, `src/components-manifest.json` ou `README.md`, pois o nome, a exportação e a API pública do componente permanecem iguais.

## Dependências e ordem de execução

1. Congelar o comportamento público atual com testes de caracterização, zerando as emissões produzidas pela carga inicial antes de simular a digitação.
2. Escolher o watcher de `temp_value` como fonte única para filtragem e efeitos derivados da mudança de valor.
3. Ajustar a ordem de atualização do painel para que `onInput` consulte `filtered_values` somente depois da filtragem única.
4. Executar as regressões focadas e, depois, as validações gerais.
5. Realizar a medição comparativa após a correção funcional estar estável.

A correção deste achado pode ser feita independentemente da virtualização. Se também for implementada a proteção contra respostas obsoletas da API, integrar primeiro a proteção de requisições e depois reaplicar estes testes de contagem, pois ambos os trabalhos tocam `applyList`/`search` no mesmo componente.

## Passos detalhados de implementação

1. Em `MaxInputAutoCompleteApi.test.ts`, adicionar uma forma determinística de fornecer uma lista local grande ou controlar a resposta de `getCachedApiIDB`, aguardando a carga inicial e então limpando o histórico de `complete` antes da interação sob teste.
2. Criar um teste de regressão que dispare um único `input` com texto diferente do valor atual e verifique simultaneamente:
   - exatamente uma emissão nova de `complete`;
   - resultado filtrado correto;
   - painel aberto quando há resultados e fechado quando não há;
   - nenhuma emissão textual indevida de `update:modelValue`.
3. Instrumentar no teste a execução do filtro sem depender de duração de relógio. A opção preferencial é usar itens com getters/normalizadores contáveis ou extrair uma função interna pura e testável; para `n` itens, uma digitação deve visitar cada item no máximo uma vez. Evitar testar detalhes frágeis da implementação caso a contagem de itens já prove o único scan.
4. Em `MaxInputAutoCompleteApi.vue`, remover a chamada direta redundante a `search()` de `onInput` e manter a mutação de `temp_value` como origem do fluxo.
5. Tornar o watcher de `temp_value` o único coordenador dos efeitos dessa mutação: executar uma filtragem, atualizar `isDone` e preservar a emissão de `update:modelValue` apenas para valores-objeto. Para manter a abertura síncrona esperada pelo handler, usar um watcher com `flush: 'sync'` ou fazer o watcher também decidir a abertura somente quando a origem for digitação; preferir `flush: 'sync'` por ser a menor mudança comportamental e documentar essa dependência junto ao watcher.
6. Manter em `onInput`, depois da atribuição a `temp_value`, apenas a decisão de abrir/fechar baseada em `filtered_values`. Com `flush: 'sync'`, essa coleção já deve refletir o novo texto. Não adicionar `nextTick`, temporizador ou segundo fallback de busca, pois isso recriaria duas fontes de verdade.
7. Revisar `search()` para garantir que cada chamada efetue no máximo uma passagem pela lista e uma emissão de `complete`. Preservar a normalização atual e explicitar o resultado para lista vazia, evitando que resultados anteriores permaneçam visíveis quando `list` deixar de ter conteúdo; se essa correção revelar mudança observável, cobri-la com teste específico.
8. Verificar separadamente os gatilhos que não nascem de `onInput`: `applyList`, `onFocus` e `onArrowDown`. Eles devem continuar fazendo uma única busca por ação e não devem chamar novamente o fluxo de alteração de valor.
9. Cobrir a seleção por clique e por Enter: o objeto selecionado deve ser emitido uma única vez em `update:modelValue`, o painel deve fechar e o índice ativo deve voltar a `-1`. Registrar explicitamente a contagem de `complete` para congelar o contrato existente da seleção e impedir duplicações futuras.
10. Cobrir mudança interna/programática de `temp_value` e atualização de lista por `data`: cada mudança deve recalcular uma vez. Não ampliar este trabalho para sincronizar `props.modelValue` após o mount sem uma decisão específica de API, pois o componente atualmente apenas inicializa `temp_value` com essa prop.
11. Adicionar um caso com digitação sequencial (`a`, `ab`, `abc`) e confirmar três, e não seis, novas emissões e no máximo `3n` avaliações para uma lista de tamanho `n`.
12. Executar um benchmark repetível com 10.000 opções e a mesma sequência de termos antes/depois. Usar aquecimento e múltiplas iterações, relatar mediana e número de avaliações; a métrica normativa é a redução de `2n` para `n`, enquanto tempo de parede é apenas evidência auxiliar devido à variância de CI.

## Migração e compatibilidade

A alteração deve ser compatível em nível de tipos, props, slots e eventos: consumidores continuam recebendo `complete`, mas passam a recebê-lo uma única vez por digitação. Consumidores que acidentalmente dependam da duplicidade serão corrigidos para o comportamento coerente com um evento por ação; isso é uma correção de bug, não uma nova opção configurável.

Não introduzir debounce por padrão nesta entrega, porque isso mudaria latência e temporização observáveis. Caso uma futura versão use `delay`, deverá definir se `complete` representa filtragem local ou solicitação remota, cancelar temporizadores no unmount e documentar a migração. A correção também não deve alterar seleção por objeto nem o payload vazio atual de `complete`.

## Estratégia de testes

### Testes unitários

- Uma digitação: um scan, um `complete` e filtragem correta.
- Três digitações: três scans e três emissões, sem multiplicação reativa.
- Lista vazia e termo sem correspondência: nenhum resultado obsoleto e painel fechado.
- Foco com texto, seta para baixo com painel fechado e aplicação de nova lista: uma busca por gatilho.
- Seleção por clique e Enter: um `update:modelValue`, fechamento e índice reiniciado.
- Valor string programático: uma filtragem, sem `update:modelValue`; valor-objeto: preservação da emissão de seleção.
- Unmount não deve deixar novo temporizador, pois esta correção não adiciona debounce.

### Testes de integração

- Montar o componente com `InputBase` real quando viável, resolver `getCachedApiIDB`, digitar e confirmar que a lista teleportada corresponde ao termo e que um listener consumidor de `complete` é chamado uma vez.
- Simular atualização de `data` seguida de digitação para garantir que a lista nova é usada e que os gatilhos não se multiplicam.
- Se a correção de respostas obsoletas já estiver integrada, executar também seu teste de ordem invertida para evitar regressão cruzada.

### Acessibilidade

Não há mudança semântica de acessibilidade prevista neste achado. Ainda assim, os testes de interação por teclado existentes/novos devem confirmar que seta para baixo, Enter e Escape continuam operacionais e que a remoção da busca redundante não deixa o painel ou `activeIndex` dessincronizados. A adoção completa de `combobox`, `aria-expanded`, `aria-controls` e `aria-activedescendant` fica no achado específico de contrato de autocomplete.

### Benchmark e performance

- Dataset fixo com 10.000 itens e termos com e sem correspondência.
- Contar avaliações do predicado: exatamente 10.000 por alteração, nunca 20.000.
- Contar o listener de `complete`: uma chamada por alteração.
- Comparar medianas em pelo menos 20 iterações após aquecimento; não transformar milissegundos absolutos em gate de CI, mas falhar o teste funcional se a contagem exceder `n`.

## Critérios de aceite mensuráveis

- Um evento `input` que muda o texto executa exatamente um scan da lista.
- Uma digitação gera exatamente uma nova emissão de `complete`.
- Uma sequência de `k` digitações sobre `n` itens realiza no máximo `k × n` avaliações, em vez de `2 × k × n`.
- `filtered_values` e a visibilidade do painel estão corretos no mesmo ciclo observável pelo teste de interação.
- Seleção emite exatamente um `update:modelValue` com o objeto selecionado e fecha o painel.
- Foco, seta para baixo e recebimento de lista continuam gerando no máximo uma busca por gatilho.
- A suíte focada de `MaxInputAutoCompleteApi`, a suíte completa, o type-check e o lint terminam sem novas falhas atribuíveis à mudança.
- O benchmark registra redução aproximada de 50% nas avaliações por digitação; a aprovação não depende de um tempo absoluto de máquina.

## Riscos e rollback

- `flush: 'sync'` muda a temporização do watcher. Mitigar limitando o callback a trabalho síncrono já existente e testando a ordem entre filtragem, abertura e eventos.
- Remover a chamada de `onInput` sem ajustar a temporização pode ler `filtered_values` antigo e abrir/fechar incorretamente. O teste deve observar o painel imediatamente após a interação.
- Consumidores podem ter mascarado lógica incorreta contando duas emissões. Comunicar a correção em changelog/release notes se houver publicação, sem manter modo legado.
- Alterações paralelas de virtualização ou controle de requisição podem causar conflito textual e mudar contagens de busca. Rebasear e executar novamente todos os testes focados.
- Se houver regressão não resolvida, o rollback é a reversão isolada da refatoração e de seus testes; não reintroduzir parcialmente um segundo `search()`. Manter o teste de caracterização marcado para orientar uma alternativa com coordenador único.

## Validação final

1. Executar `npx vitest run tests/components/MaxInputAutoCompleteApi.test.ts`.
2. Executar `npm run test`.
3. Executar `npm run type-check`.
4. Executar lint sem correção automática sobre os arquivos alterados, ou revisar cuidadosamente qualquer autofix para não modificar arquivos fora do escopo.
5. Executar o benchmark isolado e anexar ao relatório os totais de avaliações/emissões e a mediana antes/depois.
6. Executar `git diff --check` e revisar o diff para confirmar que somente o componente, seus testes e o benchmark opcional foram alterados durante a implementação.
7. Confirmar manualmente no playground: digitar rapidamente, focar novamente, abrir por teclado, selecionar por clique/Enter e alterar os dados de origem, observando lista estável e uma única notificação por digitação.
