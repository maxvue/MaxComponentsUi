# Ordenação e seleção de tabelas são exclusivas de ponteiro

## Resumo
Cabeçalhos ordenáveis e linhas selecionáveis de `MaxTable` recebem apenas clique. Não são focáveis nem expõem `aria-sort`/`aria-selected`.

## Severidade e prioridade
Crítica — P0. WCAG 2.1.1 e 4.1.2.

## Evidências
- `src/components/MaxTable.vue:55-86`: `<th sortable>` só usa `@click`, sem tabindex, Enter/Espaço ou `aria-sort`.
- `src/components/MaxTable.vue:121-158,169-203`: linhas com seleção/row-click também só usam clique, sem foco ou `aria-selected`.
- `tests/components/MaxTable.test.ts:183-233`: ordenação é testada apenas por clique.

## Afetados
Modo data-driven com colunas sortable, `selectionMode` single/multiple e `row-click`.

## Causa-raiz
Operação foi anexada diretamente a elementos estruturais sem um alvo de botão/checkbox/link ou contrato de interação equivalente.

## Impacto e reprodução
Tabular uma tabela: cabeçalhos e linhas nunca recebem foco; leitor não anuncia direção de ordem nem seleção.

## Direção de correção
Usar botão no cabeçalho ou tornar o alvo operável por teclado com `aria-sort`; modelar seleção com controles nativos ou padrão de grid/table documentado.

## Critérios de aceite
Sort e seleção funcionam por teclado, expõem estado e preservam semântica nativa; testes cobrem Enter/Espaço e anúncios.

## Contraevidências
Estrutura table/thead/tbody é nativa e paginação usa botões nomeados; isso não cobre as operações citadas.
