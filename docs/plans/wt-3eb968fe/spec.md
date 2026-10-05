# Especificação técnica — buffer configurável do MaxListBox

## 1. Contexto & Objetivo

- Data: 2026-10-05. Projeto: `@maxvue/max-components-ui` (package.json: 1.1.2).
- Worktree ativa: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-3eb968fe`; branch informada pelo usuário: `wt-3eb968fe`.
- Referência investigada: HEAD `67a658dd35dc2af3dd92f0ebb060d43122f5faba`; status Git inicial sem alterações.
- Solicitação inicial: saber se `virtual-scroll` permite definir quantos itens são carregados previamente. A entrevista confirmou que se trata de **renderização antecipada**, não de busca da API.
- Hoje o componente não expõe o buffer. `useVirtualList` aceita `overscan?: number`, captura o valor na criação e usa 5 por padrão.
- Objetivo: permitir ao consumidor ajustar o número de itens extras renderizados de cada lado da viewport, sem remontagem, sem alterar paginação e mantendo o padrão atual.
- Complexidade: mudança no componente e no composable compartilhado, duas suítes de testes e documentação; exige esta especificação antes do plano detalhado.

## 2. Escopo

### Incluído

1. Prop pública `overscan?: number` no MaxListBox, padrão 5, reativa.
2. `UseVirtualListOptions.overscan?: MaybeRef<number>`; manter compatibilidade com números estáticos já usados pelos demais componentes.
3. Normalização central no composable: ausente ou não numérico/não finito → 5; negativo → 0; fração finita → `Math.max(0, Math.floor(valor))`; zero válido. Não converter strings em números. Sem teto arbitrário; a janela nunca ultrapassa os itens existentes.
4. Correção aprovada do fim da janela para incluir a última linha parcialmente visível com qualquer buffer, inclusive zero.
5. Testes focados, regressão dos consumidores existentes e documentação do contrato.

### Fora de escopo

- Alterar `pageSize`, `loadOptions`, distância de antecipação da API, debounce, retry, limite de auto-preenchimento ou gerenciamento de requisições.
- Tornar reativas as props de buffer dos outros componentes que hoje passam números estáticos.
- Trocar o virtualizador, adotar novas dependências, alterar medição da viewport, suportar alturas variáveis ou redesenhar o componente.
- Alterar exports, resolver, aliases, CSS, classes legadas, seleção ou eventos.
- Corrigir divergências documentais gerais sobre PrimeVue; achado registrado separadamente.
- Implementação nesta sessão, instalações, execução de testes/build, commit, merge, push, release ou deploy.

## 3. Arquitetura & Mudanças Técnicas

### Arquivos existentes afetados na execução futura

| Arquivo | Mudança |
|---|---|
| `src/components/MaxListBox.vue` | Prop tipada/default/JSDoc; passar `computed(() => props.overscan)` ao composable |
| `src/composables/useVirtualList.ts` | Ampliar tipo; resolver/normalizar buffer em computed; corrigir fim da janela |
| `tests/composables/useVirtualList.test.ts` | Casos de reatividade, normalização e scroll parcial |
| `tests/components/MaxListBox.test.ts` | Contrato público, atualização dinâmica e preservação de comportamento |
| `COMPONENTS.md` | Nova subseção MaxListBox em Cards e Listas; exemplo e contrato do buffer |

Os documentos desta pasta são novos. Não gerar nem editar `dist` manualmente. Exports de MaxListBox/ListBox/Listbox já existem em `src/index.ts:221–223` e o subpath consta em package.json.

### Contrato confirmado na entrevista

- Nome escolhido: `overscan`, em vez de `numToleratedItems`.
- Unidade: **itens adicionais por lado**, não quantidade total, páginas ou pixels.
- Atualização após montagem: atualizar apenas a janela; preservar scroll, seleção e dados carregados, sem emitir eventos ou iniciar requests por causa da prop.
- Se a virtualização estiver desligada, continuar renderizando a lista completa; o buffer não força ativação nem altera o threshold (atualmente `length > 500`).
- No modo API, o buffer atua somente sobre os itens já disponíveis; não garante pré-carregamento de dados.
- Valores grandes podem renderizar toda a lista e custar memória/CPU. Documentar o trade-off, sem prometer fluidez.

Exemplo de contrato futuro, ainda não disponível no código:

```vue
<MaxListBox
    :options="opcoes"
    aria-label="Registros"
    virtual-scroll
    :overscan="20"
/>
```

### Cálculo da janela

Manter os limites existentes para início, lista vazia, scroll além do conteúdo e totalHeight. Resolver o buffer por `unref` dentro de computed, não capturar seu valor na inicialização.

- `first = Math.floor(scrollTop / itemHeight)`.
- Início: regra atual de clamp, subtraindo o buffer normalizado.
- Fim exclusivo: `Math.min(total, Math.ceil((scrollTop + effectiveViewportHeight) / itemHeight) + buffer)`.
- `offsetY = startIndex * itemHeight` e `totalHeight = total * itemHeight` permanecem.
- Quando desabilitado: intervalo completo e offset zero.

Caso decisivo: 1.000 itens, linha de 50px, viewport de 500px, scrollTop=25px e buffer=0 → índices 0 a 10 (11 itens). O cálculo atual retorna 0 a 9. Com buffer 5 o novo cálculo pode renderizar uma linha a mais em scroll não alinhado; impacto compartilhado explicitamente aprovado.

Fluxo: `prop overscan → computed da prop → normalização reativa no useVirtualList → startIndex/endIndex → visibleItems/offsetY → DOM`. Não há conexão nova com fetchPage.

### Viabilidade e evidências

- `src/components/MaxListBox.vue:157–196,403–439`: configuração atual, integração com virtualizador e paginação separada.
- `src/composables/useVirtualList.ts:10–19,26–28,53–73`: tipo, captura estática e cálculo atual.
- `tests/composables/useVirtualList.test.ts` e `tests/components/MaxListBox.test.ts`: suites existentes para buffer, limites, API e teclado.
- Consumidores identificados por busca em src: MaxInputAutoComplete, MaxInputAutoCompleteApi, MaxInputSelect, MaxTagSelect, MaxInputPhone e MaxInputIconPicker. Manter suas chamadas existentes.
- Documentação oficial Vue consultada via Context7: https://vuejs.org/guide/components/props e https://vuejs.org/guide/essentials/computed. Confirma fonte reativa em vez de valor capturado. Docs da linha Vue 3, não específicas do RC declarado no projeto (`^3.6.0-rc.10`); nenhuma dependência de recurso exclusivo do RC.
- Viabilidade avaliada por leitura; não houve instalação, teste ou execução de serviço. Não existem contratos de anexos, fornecedor/modelo ou migração nesta demanda.

## 4. Plano de Execução Faseado

1. Revalidar worktree, alterações locais, instruções e versões; ler plan.md antes da execução autorizada.
2. TDD no composable: testes falhando pelos motivos esperados; implementar tipo/normalização/cálculo; executar testes focados. Revisão de risco compartilhado.
3. TDD no MaxListBox: testar prop e alterações dinâmicas; integrar computed/default; validar API, teclado e modo não virtualizado.
4. Documentar a API futura em COMPONENTS.md e JSDoc, sem reformar documentação alheia.
5. Validar regressão dos consumidores, tipos, lint, build e suíte ampla; fazer revisão independente de entrega. Registrar evidências e pendências no estado de execução apenas na futura sessão Execute.

## 5. Critérios de Aceite & Validação

- Sem prop: buffer 5; scroll alinhado preserva contagens atuais.
- Com 20: até 20 itens extras por lado, limitado às extremidades.
- Com zero: toda a área visível, inclusive linhas parciais, e nenhum item adicional além dela em scroll dentro dos limites.
- Mudança 5 → 20 → 0 sem scroll adicional/remount recalcula índices e offset, não altera seleção nem altura total.
- Valores -2, 2.9, NaN, Infinity e -Infinity seguem normalização; entradas ausentes e inválidas não quebram renderização.
- Lista vazia, curta, fim e scroll além do conteúdo continuam seguros; virtualização desligada renderiza todos.
- API conserva pageSize, fluxo de páginas/erros e ausência de chamadas extras por mudança isolada do buffer.
- Teclado mantém o elemento apontado por aria-activedescendant renderizado, inclusive End/Home com buffer zero.
- Demais consumidores aceitam números como antes; linha parcial adicional é a única alteração intencional de cálculo.
- Documentação distingue renderização e carga, informa normalização, reatividade e custo.

Comandos identificados para execução futura: `npm run test -- tests/composables/useVirtualList.test.ts`, `npm run test -- tests/components/MaxListBox.test.ts`, `npm run type-check`, `npm run type-check:test`, `npm run lint`, `npm run build`, `npm run test`, `npm run test:coverage`, `npm run test:browser`. Consultar a matriz do plano para contexto e ordem. Todos **não executados nesta sessão**. Não usar release nem a esteira completa verify indiscriminadamente: inclui validações de consumidores e audit com possíveis efeitos externos.
