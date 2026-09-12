# Plano de implementação — virtualização consistente de coleções

## Objetivo e resultado esperado

Aplicar a infraestrutura de virtualização existente aos seis controles afetados e eliminar o cálculo quadrático de índices agrupados. Coleções grandes devem manter DOM proporcional à viewport mais overscan, preservando filtro, slots, seleção, teclado, ARIA e scroll para o item ativo.

## Escopo

- Adotar um contrato comum baseado em `useVirtualList`, usando o comportamento já validado em `MaxListBox`.
- Virtualizar `MaxInputIconPicker`, `MaxInputSelect`, `MaxTagSelect`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi` e `MaxInputPhone`.
- Achatar grupos uma vez, incluindo metadados e índice global, sem `indexOf` dentro do render.
- Separar janela renderizada de busca, filtragem e prefetch de SVG.
- Adicionar props compatíveis para forçar/desativar virtualização, limiar, altura e overscan.
- Criar testes funcionais, de acessibilidade e benchmark versionado.

## Fora de escopo

- Virtualizar todos os componentes da biblioteca; `MaxListBox` já possui solução própria.
- Alterar APIs de dados, busca remota ou aparência.
- Implementar altura variável nesta primeira entrega; o contrato será de linha fixa e configurável.
- Corrigir duplicidade de busca ou respostas obsoletas do `MaxInputAutoCompleteApi`, cobertas por achados próprios.
- Trocar lazy loading de SVG por eager loading.

## Arquivos a alterar ou criar

- Alterar `src/composables/useVirtualList.ts` e `tests/composables/useVirtualList.test.ts` apenas para capacidades comuns comprovadamente ausentes, como `scrollToIndex`/intervalo final.
- Alterar os seis componentes citados e seus testes existentes em `tests/components/`.
- Usar `src/components/MaxListBox.vue` e `tests/components/MaxListBox.test.ts` como referência, sem reescrevê-los.
- Criar `src/types/virtual-list.ts` somente se as novas props/tipos forem compartilhados; caso contrário, manter tipos locais.
- Criar `tests/benchmarks/virtualized-collections.bench.ts` ou script equivalente executado separadamente da suíte unitária.
- Atualizar a documentação dos componentes/props no catálogo existente aplicável.

## Dependências e ordem

1. Congelar o contrato comum e ampliar `useVirtualList`.
2. Corrigir/virtualizar `MaxInputSelect` e `MaxTagSelect`, que exigem modelo achatado.
3. Virtualizar os dois autocompletes e `MaxInputPhone`.
4. Virtualizar as linhas do grid de `MaxInputIconPicker` e integrar o prefetch.
5. Executar regressões cruzadas, acessibilidade e benchmark.

Mudanças concorrentes nos autocompletes devem ser integradas antes dos testes finais. A implementação depende de altura de item conhecida; slots de altura variável deverão desativar virtualização ou informar altura compatível.

## Passos detalhados

1. Padronizar props com a semântica já usada por `MaxListBox`: `virtualScroll?: boolean`, `virtualScrollThreshold` padrão 500, `itemHeight` e `numToleratedItems`. `undefined` ativa automaticamente acima do limiar; `true` força; `false` desativa.
2. Completar `useVirtualList` com `endIndex` e `scrollToIndex` determinístico, limitando scroll ao conteúdo e permitindo atualizar a janela antes de consultar o DOM. Manter o modo desativado retornando toda a coleção.
3. Criar em `MaxInputSelect` uma coleção achatada computada de entradas discriminadas (`group`/`option`). A entrada de opção carrega o índice selecionável global calculado em uma passagem O(N); remover `getOptionIndex` e suas chamadas repetidas no template.
4. Aplicar o mesmo modelo a grupos de `MaxTagSelect` quando presentes e calcular cor/estado selecionado uma vez por entrada renderizada, não repetidamente no template.
5. Nos selects, renderizar somente `visibleItems` sobre spacer de `totalHeight` e janela deslocada por `offsetY`. Manter cabeçalhos de grupo não selecionáveis e chaves estáveis por valor/grupo.
6. Nos autocompletes, virtualizar `filtered_values` com linha fixa; toda busca continua percorrendo a coleção completa, mas somente a janela vira DOM. Preservar slot `option`, índice global, overlay e seleção.
7. Em `MaxInputPhone`, virtualizar as 237 opções, adicionar `loading="lazy"` às bandeiras e manter `focused_index` global.
8. No picker, virtualizar `rows`, não ícones individuais. O spacer representa todas as linhas e cada item virtual contém até oito células. Derivar o prefetch da faixa visível mais overscan.
9. Ao abrir, filtrar ou navegar por teclado, chamar `scrollToIndex` antes de buscar/focar o elemento montado e sincronizar no ciclo seguinte. Ao mudar o filtro, zerar scroll e índice quando necessário.
10. Garantir que `aria-activedescendant` só referencie o item ativo materializado; manter `aria-setsize`/`aria-posinset` relativos à coleção total e semântica de grupo.
11. Não remontar itens fora da janela durante filtro/scroll: a lista filtrada é a fonte do cálculo virtual e as chaves permanecem estáveis.
12. Adicionar benchmark com 100, 1.000 e 5.000 itens, mesma viewport/overscan, medindo montagem, abertura, scroll, nós DOM e heap.

## Migração e compatibilidade

As novas props são aditivas. Listas até o limiar mantêm render completo; consumidores com slots de altura variável podem usar `virtualScroll=false`. Acima do limiar, o item precisa respeitar `itemHeight`, condição que deve ser documentada. Slots continuam recebendo a opção e seu índice global, não o índice local da janela. Seleção, emits e formatos de opções/grupos não mudam.

Liberar componente a componente atrás do mesmo contrato, sem manter implementações divergentes. Não alterar o threshold de `MaxListBox` nesta entrega.

## Testes

### Unitários

- `useVirtualList`: limites, overscan, lista vazia, mudança de filtro/tamanho, habilitação dinâmica e `scrollToIndex`.
- Cada componente: abaixo/no/acima do limiar, overrides `true`/`false`, spacer/offset e quantidade limitada de itens.
- Selects agrupados: índice global correto em O(N), cabeçalhos não selecionáveis e nenhuma busca linear por item.
- Picker: somente linhas visíveis montadas e apenas SVGs da faixa/overscan enfileirados.
- Filtro: scroll reiniciado, janela recalculada e seleção preservada quando aplicável.

### Integração e acessibilidade

- Home/End/setas/Enter/Escape alcançam itens fora da janela e mantêm seleção.
- Clique e teclado emitem uma única atualização com a opção correta.
- `aria-activedescendant`, `aria-posinset`, `aria-setsize`, roles e grupos permanecem coerentes.
- Slots customizados e overlays teleportados funcionam com virtualização ligada/desligada.
- Atualização remota não deixa spacer, foco ou seleção obsoletos.

### Benchmark

- Rodar dataset e viewport fixos após aquecimento, com múltiplas iterações.
- Registrar mediana de montagem/abertura/scroll, pico de nós e heap antes/depois.
- Usar contagem máxima de DOM e ausência de complexidade quadrática como gates de CI; tempo/heap são relatórios.

## Critérios de aceite mensuráveis

- Com 5.000 itens, o DOM é limitado a itens visíveis mais overscan (vezes oito células no picker), sem crescer com N para viewport fixa.
- `MaxInputSelect` e `MaxTagSelect` constroem índices agrupados em uma passagem O(N), sem `indexOf` dentro de loops/templates.
- `MaxInputPhone` não monta 237 linhas simultaneamente quando virtualizado e suas imagens usam lazy loading.
- Navegação alcança primeiro/último item, mantém o ativo montado e seleciona o valor correto.
- Filtro não monta itens fora da janela e atualiza spacer/posição corretamente.
- Suítes focadas, completa, type-check e lint não apresentam novas falhas.
- Benchmark inclui montagem, scroll, nós e heap para 100/1.000/5.000 itens.

## Riscos e rollback

- Altura real diferente de `itemHeight` causa sobreposição: documentar linha fixa, testar slots e permitir opt-out.
- Grupos achatados podem alterar ordem/índices: comparar sequências e eventos antes/depois.
- Item ativo pode sair do DOM: rolar e atualizar janela antes de atualizar ARIA/foco.
- Prefetch pode atrasar SVGs ao scroll rápido: incluir overscan sem buscar toda a coleção.
- Se um componente regredir, usar `virtualScroll=false` como mitigação e reverter apenas sua integração; não duplicar um segundo motor virtual.

## Validação final

1. Executar testes de `useVirtualList` e dos seis componentes.
2. Executar `npm run test`, `npm run type-check` e lint nos arquivos alterados.
3. Rodar benchmark isolado e registrar tabela antes/depois.
4. Testar manualmente 5.000 itens com mouse, touch e teclado, incluindo filtros e temas.
5. Inspecionar DOM/heap após abrir/fechar repetidamente.
6. Executar `git diff --check` e revisar mudanças de API/visual.
