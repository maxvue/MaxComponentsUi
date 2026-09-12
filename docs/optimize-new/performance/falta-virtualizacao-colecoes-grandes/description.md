# Coleções grandes ainda escapam da virtualização

## Resumo

Há infraestrutura de virtualização real na biblioteca, mas ela não é aplicada de forma consistente. `MaxInputIconPicker`, `MaxInputSelect`, os autocompletes e `MaxInputPhone` materializam listas completas. No seletor agrupado, a obtenção do índice global ainda adiciona custo quadrático por renderização.

## Severidade e prioridade

- Severidade: alta para `MaxInputIconPicker` e `MaxInputSelect` com dados grandes; média nos demais controles.
- Prioridade: P1.

## Evidências

- `src/components/MaxInputIconPicker.vue:76-98` cria uma linha para cada grupo e um botão/placeholder para cada ícone. Para `N = 5.000`, são pelo menos `5.000` botões, `5.000` placeholders e `ceil(5.000/8) = 625` linhas repetidas.
- `src/components/MaxInputIconPicker.vue:250-266` usa a faixa visível apenas para decidir quais SVGs buscar; ela não reduz o DOM montado.
- `src/components/MaxInputSelect.vue:88-145` renderiza todas as opções filtradas.
- `src/components/MaxInputSelect.vue:97-110` pode chamar `getOptionIndex` quatro vezes por opção; `src/components/MaxInputSelect.vue:432-446` achata grupos e executa `indexOf`. Com 1.000 opções agrupadas, o limite superior é aproximadamente dois milhões de comparações de identidade por renderização.
- `src/components/MaxInputAutoComplete.vue:34-49` e `src/components/MaxInputAutoCompleteApi.vue:34-49` montam integralmente os resultados.
- `src/components/MaxInputPhone.vue:47-67` monta todas as opções com imagem; `src/constants/ddiFlags.ts` contém 237 entradas.
- `src/components/MaxTagSelect.vue:91-130` monta todas as opções e calcula cor até duas vezes por item. Microbenchmark Node 24/jsdom mediu 100/1.000/5.000 nós de opção e abertura em aproximadamente 369 ms/2,51 s/13,0 s; os tempos são indicativos do ambiente sintético, não métricas universais de navegador.
- Triagem: `rg -n "v-for|getOptionIndex|onScrollerScroll|getVirtualItems" src/components` e leitura numerada dos pontos acima.

## Componentes afetados

`MaxInputIconPicker`, `MaxInputSelect`, `MaxTagSelect`, `MaxInputAutoComplete`, `MaxInputAutoCompleteApi` e `MaxInputPhone`.

## Causa-raiz

A virtualização foi introduzida como utilitário/base opt-in, sem um contrato comum para controles de coleção. Em `MaxInputIconPicker`, “virtual” passou a significar carregamento preguiçoso do conteúdo SVG, não janela de renderização. Em `MaxInputSelect`, o índice global é recalculado por busca linear dentro do próprio loop.

## Impacto quantificado

- O DOM do picker cresce linearmente para pelo menos `2N + ceil(N/8)` elementos repetidos antes de considerar wrappers internos.
- O seletor agrupado pode executar até cerca de `2N²` comparações por renderização no cenário de quatro consultas de índice por item.
- O seletor de telefone abre 237 linhas e 237 imagens sem `loading="lazy"`.

Não há nesta auditoria benchmark de navegador que sustente números absolutos de FPS, heap ou milissegundos.

## Reprodução e benchmark

1. Fornecer 5.000 ícones ao picker, abrir o drawer e contar `.icon-row`, `.icon-cell` e `.icon-placeholder` no DOM.
2. Fornecer 1.000 opções agrupadas ao select e registrar `getOptionIndex` no Vue Devtools/Performance.
3. Comparar tempo de montagem, nós DOM e heap com `MaxBaseVirtualScroller` usando a mesma coleção.

## Direção de solução

Aplicar a janela virtual já disponível aos controles de coleção; manter busca/prefetch independentes da faixa renderizada; calcular uma vez os índices das opções agrupadas; e definir um limiar comum, configurável, para ativação automática.

## Critérios de aceite

- Uma coleção de 5.000 itens mantém quantidade de linhas/nós proporcional à viewport e ao overscan, não à coleção inteira.
- Navegação por teclado, ARIA, seleção e scroll para item continuam corretos.
- Filtragem não remonta itens fora da janela.
- Benchmark versionado compara montagem, scroll, nós DOM e heap antes/depois.

## Contraevidências

- `src/components/base/MaxBaseVirtualScroller.vue:9-37` e `src/composables/useVirtualList.ts` implementam virtualização real.
- `MaxListBox` ativa a base virtual automaticamente acima de 500 itens.
- O problema não deve ser generalizado para toda lista da biblioteca nem convertido em estimativas não medidas de tempo ou memória.
