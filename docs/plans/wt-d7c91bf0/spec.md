# Especificação técnica — layout do MaxCardList

## 1. Contexto & Objetivo

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.2`.
- Worktree e branch autorizadas: `wt-d7c91bf0`.
- Raiz confirmada por `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-d7c91bf0`.
- Natureza desta entrega: planejamento; nenhuma implementação ou validação executável foi realizada.

O pedido tem dois objetivos: centralizar a ação de adicionar quando não houver itens visíveis e, no desktop, fazer o card com subcards acompanhar a largura necessária ao seu conteúdo. O grupo pode crescer até o limite horizontal da área da lista; depois disso, os subcards passam a ocupar várias linhas, sem ampliar o card além desse limite.

**Decisão confirmada pelo usuário:** limitar o crescimento pela **área da lista**, não pela coluna atual. A referência inicial à borda esquerda fica operacionalizada como respeito aos limites da área disponível, sem inverter a direção de leitura ou a ordem dos itens.

O anexo mostra grupos com um subcard e espaço lateral excedente. Não há código da aplicação consumidora nem medidas verificadas daquele ambiente. Não copiar nomes, dados da imagem ou dimensões estimadas da captura para os testes.

## 2. Escopo

### 2.1. Incluído

1. Estado sem itens visíveis com ação de adicionar automática (`showAddCard`) ou personalizada (`#add-card`).
2. Centralização do elemento de ação nos dois eixos da região de conteúdo, não apenas do ícone/texto dentro dele.
3. Grupos `MaxCard` + `MaxSubCard` no contexto de `MaxCardList`: largura ajustada aos subcards, disposição horizontal no desktop e quebra ao atingir o limite da lista.
4. Paridade entre renderização estática e virtual, inclusive reagrupar linhas e manter índices corretos.
5. Regressões unitárias e geométricas em Chromium real, além de exemplo no playground.
6. Limpeza dos observadores, atualização após redimensionamento, filtros e mudanças dos subcards.

### 2.2. Fora do escopo

- Mudanças gerais na aparência, cores, fontes, status, ações ou acessibilidade dos cards.
- Alterar o comportamento de `MaxCard` ou `MaxSubCard` usados fora de `MaxCardList`.
- Migrar stores, modificar busca/categorias ou introduzir chamadas HTTP, persistência e cache de geometria.
- Novas dependências, mudanças de versões, manifesto, lockfile, exports ou resolver.
- Reordenar itens, criar masonry ou desativar a virtualização como solução alternativa.
- Implementar mudanças na aplicação da captura, que não está disponível nesta worktree.
- Commits, integração Git, publicação e deploy.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Evidências do estado atual

| Fonte existente | Evidência por leitura |
| --- | --- |
| `src/components/MaxCardList.vue:91–101,180–225,369–395` | Com adicionar no grid, a lista vazia não entra no ramo vazio; a ação fica na primeira célula. Colunas dependem da largura, de `columns` e de `minCardWidth`; até 768 px de container é uma coluna. |
| `src/components/MaxCardList.vue:441–495,560–575` | Linhas virtuais são fatias por quantidade fixa. Índices e `scrollToIndex` usam aritmética de colunas. O grid usa frações iguais. |
| `src/components/MaxCardList.vue:665–741` | Região de status tem mínimo de 200 px. Células e filhos são esticados. O CSS também força uma coluna em viewport até 768 px. |
| `src/components/MaxCard.vue:157–171,198–264,421–463` | Card ocupa 100%; conteúdo da variante adicionar já centraliza sua apresentação. Cards com subcards continuam com 100% e conteúdo em coluna. |
| `src/components/MaxSubCard.vue:117–130` | Subcard ocupa 100% do contêiner; não existe largura preferencial pública específica. |
| `src/types/card.ts` | Contratos atuais de props; nenhum campo exige que os itens exponham uma coleção chamada `subcards`. |
| `tests/components/MaxCardList.test.ts`, `MaxCard.test.ts`, `MaxSubCard.test.ts` | Há testes de estrutura, eventos, filtros e colunas, mas não de geometria real desta composição. Os grupos são frequentemente simulados com HTML. |
| `vitest.config.ts`, `tests/setup.ts` | Testes unitários usam happy-dom e `getComputedStyle` global simulado; não comprovam layout. |
| `vitest.browser.config.ts`, `tests/browser.setup.ts` | Chromium real via Vitest/Playwright, Pinia isolada por teste e adaptador Axios de teste. |
| `playground/src/scenarios/media-brand.vue:175–228` | Demonstra os três componentes, mas não os cenários agrupados solicitados. |

### 3.2. Estado vazio

Definir um estado derivado único: sem carregamento, nenhum `displayItems` e ação disponível por prop ou slot. Ele deve preceder os ramos de grid/virtualização.

- Renderizar a ação **uma única vez**, centralizada no corpo da lista. Retirar temporariamente sua ocorrência do cabeçalho se `addCardPosition='header'`; restaurar a posição configurada assim que houver itens. Trata-se da regra proposta para cumprir a centralização sempre que a ação estiver disponível.
- Não duplicar nem substituir o conteúdo fornecido por `#add-card`. Manter sua responsabilidade atual sobre o clique; a ação automática continua emitindo `add`.
- Não esticar um botão personalizado para preencher toda a região: manter tamanho intrínseco e máximo de 100% da área útil. Para o card automático, usar largura de referência `minCardWidth`, limitada pela área útil, e preservar o mínimo visual de 160 px do MaxCard, sem altura de 100% da região.
- Centralizar em relação à região útil abaixo de cabeçalho/filtros. No modo virtual, respeitar `height`/`maxHeight`; no estático, não passar a impor a altura virtual padrão de 600 px: usar o mínimo de status existente (200 px) e eventual espaço definido pelo contêiner.
- Sem ação disponível, preservar `#empty`/`MaxEmptyDiv`. Durante carregamento, preservar a precedência de `#loading`/`MaxLoader`. Zero resultados de filtro também é ausência de itens visíveis; não limpar filtros automaticamente.

### 3.3. Dimensionamento dos grupos

Implementar no contexto da lista, com seletores semânticos restritos às células agrupadas. A abordagem preferida não precisa modificar os componentes avulsos.

1. Identificar o `MaxCard` pertencente à célula e seus subcards no DOM efetivamente montado. Não executar slots antecipadamente, inspecionar internals de VNodes ou presumir o formato dos dados do consumidor.
2. Considerar apenas subcards pertencentes àquele card, excluindo grupos mais profundos. Contabilizar uma camada de wrapper neutro; estilos de layout explícitos do consumidor não devem ser apagados indiscriminadamente.
3. Estabelecer largura preferencial estável para cada subcard, independente da largura já comprimida do grupo. Proposta: reutilizar `minCardWidth` como referência quando não houver dimensão explícita do consumidor; admitir a variável CSS contextual nova `--max-card-list-subcard-width` para personalização. Respeitar `width`/`max-width` explícitos compatíveis com o espaço disponível. Não inventar uma largura fixa extraída do anexo.
4. Calcular largura desejada do grupo pela soma das larguras preferenciais, dos intervalos internos e das bordas/paddings do card. Ler espaçamentos resolvidos: não confundir `gap` da lista com o intervalo interno atual de `0.75rem`.
5. Aplicar `larguraGrupo = min(larguraDesejada, larguraÚtilLista)`. O cabeçalho não deve ampliar essa largura: manter truncamento e ações acessíveis.
6. No desktop, os subcards usam largura preferencial, sem crescimento artificial para preencher sobras, e quebram em linhas. Ao atingir o teto, o card conserva esse teto enquanto aumenta sua altura. Um subcard maior que o espaço útil precisa poder encolher até caber, sem cortar conteúdo por simples ocultação de overflow.
7. No mobile, preservar uma coluna e largura disponível, com subcards empilhados. Uma alteração de conteúdo ou retorno ao desktop deve recalcular as preferências, não perpetuar larguras reduzidas da fase mobile.

**Invariante geométrica:** antes do teto, largura externa do card = largura preferencial conjunta dos subcards + gaps internos + padding + bordas, admitindo 2 px de tolerância. A borda externa do card não deve coincidir literalmente com a borda dos filhos, pois o padding do design system permanece.

### 3.4. Modelo único de linhas

CSS isolado não resolve: as fatias fixas atuais não representam grupos que ultrapassam uma coluna. Adotar um modelo compartilhado de células e linhas, com empacotamento sequencial por largura e sem reordenação.

**Contratos internos novos propostos**, sem exportação pública:

- Célula: chave estável, tipo `item`/`add`, item original, índice original ou ausência de índice na ação, largura preferencial e largura aplicada.
- Linha: chave derivada das chaves de suas células, células e larguras aplicadas.
- Mapa: índice original do item → linha atual.

Para largura útil `A`, colunas efetivas `C` e gap externo `g`, cards comuns e adicionar conservam a largura-base `(A - (C - 1) * g) / C`. Grupos usam sua largura calculada, podendo ultrapassar essa base até `A`. `columns` permanece referência das colunas comuns, não uma barreira ao crescimento do grupo solicitado. Sem grupos, o resultado deve reproduzir a grade atual, inclusive a última linha sem esticar seus poucos itens.

Empacotar na ordem original; se a próxima célula, mais o gap, não couber no restante da linha, abrir nova linha. Um grupo não deve quebrar seus subcards antecipadamente apenas para caber ao lado de outro card: ele vai para a próxima linha antes de ser limitado pelo teto da lista inteira. A posição da ação na lista preenchida permanece a atual.

Usar essas linhas nos dois modos. Virtualizar **linhas**, preservar `estimateSize`, `overscan`, altura dinâmica e evento `scroll`; remedir linhas quando a geometria mudar. Substituir fórmulas de índices pelo índice original armazenado, incluindo `scrollToIndex` com adicionar presente. Invalidar medidas de linhas cuja composição mudou e preservar a âncora de rolagem por chave quando ainda existir.

Preservar equalização de altura entre células da mesma linha e o contrato estático existente de `gridAutoRows: 1fr`, coberto por teste. O modo virtual continua medindo cada linha dinamicamente. A paridade exigida é de larguras, quebra interna dos subcards e ordem dos itens; não pressupõe igualar a altura total das áreas estática/virtual, cujas políticas já são distintas.

### 3.5. Medição e ciclo de vida

- Helper puro novo: `src/helpers/cardListLayout.ts`, para cálculos/empacotamento/mapa de índices, sem DOM.
- Composable novo: `src/helpers/useCardListLayout.ts`, para referências de células montadas, observação e cache local das preferências.
- Reutilizar `useElementSize`, `useResizeObserver` e `useMutationObserver` de **`@maxvue/max-use`**. A disponibilidade foi confirmada no pacote instalado `1.1.47`, tanto nas declarações quanto no entry de runtime. Não adicionar VueUse diretamente.
- Preferências de células ainda não montadas usam a largura-base estimada; corrigir ao entrarem na janela virtual. Não montar todos os slots fora de tela para medir. Essa convergência é uma limitação explícita de slots arbitrários sem metadados públicos.
- Conservar cache ao desmontar por virtualização; remover entradas quando o item sair da coleção de origem. Invalidar com mudança relevante do item e revalidar ao remontar. Chaves por índice continuam fallback compatível, mas não oferecem identidade após reordenação.
- Coalescer leituras de layout e escritas reativas em um frame; não observar as próprias escritas de geometria indiscriminadamente. Comparar dimensões antes de atualizar, cancelar trabalho pendente e desconectar observadores no descarte.
- Geometria é estado local transitório. Não criar store, GET, salvamento ou cache persistente. Preservar `useSearchBarStore` e a integração existente; novas funcionalidades de dados exigiriam MaxPinia, mas estão fora deste pedido.

### 3.6. Dependências e documentação consultada

Lockfile: `@tanstack/vue-virtual` `3.13.39`, core `3.17.11`, Vue `3.6.0-rc.10`, MaxUse `1.1.47`. Não atualizar versões.

Documentação oficial consultada via Context7: [Virtualizer](https://tanstack.com/virtual/latest/docs/api/virtualizer), [useResizeObserver](https://vueuse.org/core/useResizeObserver/) e [useMutationObserver](https://vueuse.org/core/useMutationObserver/). Os exemplos remotos refletem versões atuais, não garantem correspondência exata com a versão instalada. `getItemKey`, `measureElement`, `measure` e `scrollToIndex` também foram confirmados nos tipos locais do core. Não importar opções novas apenas porque aparecem em exemplos remotos.

## 4. Plano de Execução Faseado

1. Fazer preflight por leitura, revalidar contratos e conferir alterações locais; não alterar branch/worktree.
2. Implementar o estado vazio com ação centralizada e suas regressões.
3. Implementar os helpers internos, dimensionamento contextual e modelo de linhas compartilhado; adicionar todos os testes correspondentes.
4. Integrar índices, remedição, âncora e descarte da virtualização; complementar testes e playground.
5. Revisar o conjunto; executar as validações em lote e corrigir falhas em lote. Não intercalar suítes, tipos ou builds entre microedições.
6. Registrar resultados reais e pendências; aguardar autorização para qualquer integração/publicação.

O roteiro executável detalhado, a matriz de aceite e a política de retomada ficam em `plan.md`, no mesmo diretório.

## 5. Critérios de Aceite & Validação

| Requisito | Aceite observável |
| --- | --- |
| Vazio + ação | Uma única ação centralizada nos dois eixos, por prop e slot, inclusive configuração header; clique/teclado continuam funcionais. |
| Um ou vários subcards | Card sem sobra arbitrária da coluna; cresce pela soma das preferências até o teto da lista, preservando padding/bordas. |
| Teto | Ao adicionar subcards depois do teto, largura não aumenta; surgem novas linhas e não há overflow horizontal. |
| Responsividade | Uma coluna no mobile; ao redimensionar para desktop, larguras e linhas são recalculadas. |
| Virtualização | Mesma geometria final do modo estático; índices, chaves, filtros e navegação continuam corretos, com DOM limitado à janela virtual. |
| Compatibilidade | Cards comuns, componentes avulsos, slots, labels, eventos, loading, busca, categorias e tokens preservados. |
| Ciclo de vida | Sem ciclos de ResizeObserver, avisos inesperados ou callbacks após descarte. |

Comandos existentes previstos para Execute, **não executados em Plan**: `npm run check:lockfile`, `npm run test`, `npm run type-check:test`, `npm run lint`, `npm run build`, `npm run test:browser` e `npm run test:benchmark`. O build já executa `vue-tsc` para os tipos de produção; não repetir `npm run type-check` na mesma revisão sem necessidade concreta. Preflight deve conferir integridade e efeitos dos scripts antes de executar. `npm run verify` é o gate completo caso haja etapa de pré-release posteriormente autorizada; não duplicar seus componentes na mesma revisão.

Os testes de navegador devem medir retângulos reais, não apenas classes/estilos. A reprodução exata na aplicação da imagem fica `manualPending` até acesso seguro ao consumidor; isso não impede testar a biblioteca isoladamente, mas impede declarar aquele ambiente corrigido sem verificação.
