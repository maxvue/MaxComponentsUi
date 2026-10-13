# Especificação técnica — Quebras explícitas de linha no MaxGrid

## 1. Contexto & Objetivo

- Data: 13/10/2026.
- Projeto: `@maxvue/max-components-ui` (`package.json`: 1.1.2).
- Worktree e branch: `wt-6f3f1cf3`.
- Raiz confirmada por `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-6f3f1cf3`.
- Objetivo: fazer `sN-end` encerrar a linha depois do item e `sN-start` iniciar a linha antes do item **dentro de MaxGrid**, mantendo os limites de largura atuais. O usuário escolheu expressamente esse escopo em vez de suporte a qualquer contêiner flex.
- Beneficiários: usuários de formulários com MaxGrid, especialmente a aba de consumo da proposta comercial do Engeapp.

### Evidência atual

`src/presetMaxUno.ts:83–100` reconhece os tokens e gera `flex`, `min-width`, `max-width` e propriedades de fragmentação. `break-before: always` / `break-after: always` não são comandos de mudança de linha no flexbox comum. `src/components/MaxGrid.vue:24–29` usa `display: flex`, `flex-wrap: wrap` e `gap: 13px 8px`, mas não interpreta os marcadores.

Os testes em `tests/preset/presetMaxUno.test.ts:433–488` e `tests/preset/presetMaxUno.generate.test.ts:105–157` verificam declarações, não coordenadas renderizadas. Não se executaram testes nesta sessão de planejamento.

A leitura dirigida do consumidor encontrou ambos os elementos como filhos diretos de MaxGrid em `/home/johnattas/GitHub/engeapp/resources/Vue/Pages/CommercialProposalDetailPage.vue:130–183`. O pai já permite wrap; a ausência de wrap não é a causa nesse exemplo.

## 2. Escopo

### Incluído

1. Interpretação dos marcadores existentes no slot default de MaxGrid.
2. Suporte a classes e atributos sem valor, incluindo os três pares enviados pelo usuário.
3. Organização explícita de segmentos de linha sem mudar os limites de largura dos itens.
4. Preservação de grids sem marcadores, label, labelCenter, atributos do contêiner, mensagens e eventos de inputs.
5. Testes unitários, geração real de CSS com attributify, geometria no Chromium e documentação de contrato.

### Fora de escopo

- Quebras garantidas em um `div` flex comum ou em CSS Grid.
- Modificações no Engeapp, cálculos de consumo, modelos, validação de números ou handlers.
- Transformar `s3-10-start` em largura total: seu teto continua sendo 200px.
- Corrigir usos de `-start` em cada mês ou a configuração de integração do consumidor nesta tarefa.
- Novas stores, chamadas de API, cache, persistência, migrações ou alterações em MaxPinia/MaxUse.
- Novas dependências, PrimeVue, geração de resolver, alteração de versão, publicação e integração Git.

## 3. Arquitetura & Mudanças Técnicas

### Contrato de tokens e dimensões

Manter a expressão `^s-?(\d+)(?:-(full|max|\d+))?(?:-(start|end))?$`.

| Token | Largura mínima | Largura máxima | Fronteira explícita |
|---|---:|---:|---|
| `s7-end` | 140px | 168px | Depois do campo |
| `s7-10-end` | 140px | 200px | Depois do campo |
| `s3-start` | 60px | 72px | Antes do histórico |
| `s3-10-start` | 60px | 200px | Antes do histórico |
| `sN-full-start` / `sN-max-end` | N × 20px | 100% | Conforme o último sufixo |

`flex: 1 1 0%` permanece. Sem limite explícito, o máximo é N × 24px; com número M, é M × 20px. `full` e `max` continuam aliases de teto, não comandos de largura integral. Valores zero, máximo menor que mínimo, rejeição de tokens inválidos e não interferência em `w-*` permanecem como hoje.

Preservar as declarações de fragmentação existentes no preset, por compatibilidade; atualizar o comentário para distinguir fragmentação de quebra explícita no MaxGrid. Não atribuir a elas a responsabilidade da correção.

### Solução proposta: segmentos flex internos

Adicionar um renderizador interno, sem API pública, em `src/components/base/gridSlotRows.ts`. Integrá-lo ao slot default de MaxGrid. Cada segmento entre fronteiras explícitas é renderizado em uma `div.max-grid-row` de largura integral; os filhos desse segmento continuam flex items com seus próprios limites. Cada segmento usa flex com wrap natural e herda o gap do MaxGrid.

Não alterar o DOM de elementos dos slots, seus atributos, refs, listeners ou valores. Os novos wrappers são apenas organizadores. Sem qualquer marcador ativo, devolver os VNodes originais, sem wrappers de linha. O renderizador pode introduzir âncoras de Fragment do Vue; não deve introduzir elementos extras nesse caminho.

O novo arquivo fica em `components/base`, fora do manifesto público. `src/scripts/generateResolver.ts:24–29` já exclui subpastas do levantamento de componentes. Não exportar o renderizador por `src/index.ts` e não regenerar manifesto.

### Algoritmo

1. Invocar o slot apenas durante renderização; nunca congelar seu resultado em setup ou invocá-lo em computed fora do contexto de render.
2. Examinar filhos diretos lógicos, expandindo apenas Fragments do Vue, inclusive `v-for` e `template`. Não descer em elementos HTML ou no conteúdo de outros componentes/MaxGrid.
3. Ler tokens de `props.class` com a normalização de classes do Vue e nomes de atributos valueless presentes em `VNode.props`. Somente a regex completa identifica marcadores; substring `start` não basta.
4. Atributos valueless estáticos `''` e `true` são suportados. Para bindings opcionais, `null`/`undefined`/`false` não ativam fronteira; documentar esse contrato e testar. Classes condicionais seguem a normalização do Vue.
5. Antes de um item com `start`, concluir o segmento atual se tiver conteúdo visível.
6. Adicionar o item ao segmento atual. Depois de um item com `end`, concluir esse segmento.
7. `end` seguido de `start` representa **uma** fronteira, não uma linha vazia. `start` no primeiro item e `end` no último também não geram segmentos vazios.
8. Comentários e espaços em branco não criam linhas. Não descartar texto visível; conservar ordem e semântica de comentários de renderização.
9. Se dois tokens válidos no mesmo item trouxerem `start` e `end`, aplicar ambas as fronteiras sem duplicar o item. Isso não torna `s7-start-end` um token válido.
10. Produzir cada VNode uma única vez. Se for necessário ajustar keys, usar `cloneVNode`, sem mutação dos VNodes recebidos; compor keys de Fragments para não colidir em listas diferentes.

### CSS e retrocompatibilidade

- `.max-grid` mantém seu layout, gap, padding de 14px, posição e label existentes.
- Wrappers: largura/min-width adequadas ao pai, `flex: 0 0 100%`, `max-width: 100%`, `display: flex`, `flex-wrap: wrap`, `gap: inherit`; sem padding, borda, margem ou foco próprios. Evitar que `min-width: auto` no wrapper impeça encolhimento do segmento.
- Herdar alinhamentos úteis do pai sem prometer suporte a direções column ou wrap-reverse. O contrato desta correção é o fluxo horizontal padrão do MaxGrid.
- Como o renderizador é interno e não SFC, verificar aplicação do escopo CSS. Preferir seletor scoped do pai direcionado a seus wrappers imediatos, usando `:deep()` quando necessário, sem estilizar linhas de MaxGrid aninhados por acidente.
- Wrap natural dentro de segmentos continua funcionando. O espaço vertical entre linhas naturais e segmentos deve ser o mesmo `row-gap` efetivo; não usar separadores de altura zero que produzam gap duplicado.
- Novos wrappers mudam o parentesco DOM **somente em grids com marcadores**. Revisar seletores consumidores `>`, posicionamento e `:nth-child` no exemplo conhecido. Não prometer compatibilidade de seletores não investigados.
- Manter eventos e estado durante rerenders sem mudança de fronteiras, inserção em listas com keys e mudanças de valores. Reparentear um item quando a própria fronteira muda pode remontá-lo no Vue; keys não garantem preservação entre pais. Tratar esse risco explicitamente nos testes e na documentação, sem afirmar preservação universal de foco/estado nesse caso. Caso o fluxo real dependa dessa garantia, interromper e revisar a estratégia antes de entrega.

### Arquivos existentes a modificar na execução

- `src/presetMaxUno.ts`: comentário do contrato; preservar CSS e fórmulas.
- `src/components/MaxGrid.vue`: integração do renderizador e estilos de segmentos.
- `tests/components/MaxGrid.test.ts`: regressões de fronteiras, slots, keys e comportamento existente.
- `tests/preset/presetMaxUno.test.ts`: exemplos pequenos do usuário e contrato preservado.
- `tests/preset/presetMaxUno.generate.test.ts`: attributify + Wind3 reais; analisar declarações por seletor, não agregando regras diferentes.
- `docs/THEME.md`: documentar start/end, pai obrigatório, exemplos e limitações.

### Arquivos novos propostos para a execução

- `src/components/base/gridSlotRows.ts`: renderizador funcional interno tipado com APIs de renderização do Vue; sem Options API e sem export público.
- `tests/browser/maxGridLineBreaks.browser.ts`: montagem real de MaxGrid e MaxInputNumber, CSS real do preset e verificações geométricas.

Não há novo helper genérico, componente público ou store. Usar MaxComponentsUi nos cenários de integração. MaxPinia e MaxUse continuam nos contratos existentes; esta alteração puramente estrutural não exige GET, salvamento nem helper de negócio. As APIs de VNode são APIs intrínsecas do Vue, não substitutos de helpers de negócio MaxUse.

## 4. Plano de Execução Faseado

1. **Preflight por leitura:** conferir branch, arquivos já alterados, plano/spec, scripts/hooks, resolução real de dependências e isolamento dos outputs. Revalidar integração do consumidor, sem alterá-la. Se falhar integridade de biblioteca, bloquear validações dependentes; não contornar gates.
2. **Contratos e implementação:** implementar renderizador e integração MaxGrid; manter preset e regressões sem marcadores; adicionar todo o conjunto de testes e atualizar docs no mesmo lote. Não executar suítes a cada microedição.
3. **Revisão estrutural:** revisar fronteiras, keys, mudança de parentesco, CSS scoped, gaps, handlers, aninhamento e ausência de dependências novas.
4. **Validação do lote:** executar suítes/tipos/lint/build confirmados, incluindo Chromium. Diagnosticar e corrigir falhas em lote, reexecutando apenas resultados afetados.
5. **Aceite e handoff:** registrar evidências reais e pendências; revisão independente no marco de risco e fechamento. Verificação no Engeapp exige integração autorizada, pois seus imports atuais apontam à árvore principal, não a esta worktree.

## 5. Critérios de Aceite & Validação

### Matriz de aceite

| Requisito | Evidência e teste pertinente | Revisão pelo risco | Verificação manual |
|---|---|---|---|
| Três pares relatados separam campo/histórico | Chromium: topo do histórico maior ou igual ao fundo do campo + row-gap, tolerância ≤ 1px; classes e atributos | Garantir largura disponível ampla para o controle negativo caber na mesma linha | Conferir aba de consumo após integração autorizada |
| `start` não encerra a linha do próprio item | Três itens: anterior em segmento distinto; item start e posterior sem marcador na mesma linha, com espaço suficiente | Distinguir início de linha de item isolado | Conferir exemplo na documentação |
| `end` não inicia uma linha antes do próprio item | Três itens: anterior e item end juntos; posterior em segmento distinto | Não mudar fronteira para antes do campo | Conferir exemplo na documentação |
| Limites de largura preservados | Unitários/CSS: 140–168px, 140–200px, 60–72px e 60–200px; Chromium com conteúdo simples e box-sizing controlado | Separar declaração min/max de overflow interno do histórico | Não tratar histórico estreito como erro de quebra |
| Fronteiras redundantes não deixam espaço extra | Unitários: nenhuma linha vazia; Chromium: gap entre segmentos igual ao gap normal, inclusive gap customizado | Proibir gap duplicado e label participando de linhas | Conferir espaçamento de formulário |
| Sem marcador mantém comportamento | Unitários: filhos diretos continuam diretos; Chromium: controle negativo na mesma linha quando couber, wrap natural quando não couber | Preservar estrutura, labels e flags no-message/no-messages | Conferir formulário existente sem marcadores |
| Slots e atualizações continuam válidos | Fragments, v-for, keys, v-if, comentários, texto, classe array/objeto; eventos e ref do input sem atualização espúria | Rerender não pode remontar componentes com fronteiras estáveis; analisar fronteiras móveis separadamente | Editar campo e verificar foco/valor sem mudança estrutural |
| Attributify real funciona | Generator com presetMaxUno + presetWind3 + presetAttributify; PostCSS válido e seletores de atributos corretos | Não usar apenas geração por classes | Inspecionar atributo no wrapper do MaxInputNumber |
| Aninhamento e SSR seguros | MaxGrid interno não modifica fronteira externa; unitário/SSR sem DOM global no renderizador | Não usar observers ou varredura global; sem depender de window | Não obrigatória para comprovar fornecedor externo |
| Consumidor correto recebe a revisão | Identidade do preset/componente por realpath e revisão factual | Árvore principal não deve ser modificada por esta tarefa | `manualPending` até apontamento/integracão autorizado pelo responsável |

### Comandos futuros confirmados no projeto

Após implementação completa, executar `npm run test`, `npm run test:browser`, `npm run type-check`, `npm run type-check:test`, `npm run lint` e `npm run build`. Não foram executados no Plan Mode. `npm run verify` é o gate de pré-release: se a entrega exigir release, usá-lo em vez de repetir isoladamente suas etapas sobre a mesma revisão. Publicação não está autorizada.

O harness Chromium não processa automaticamente UnoCSS (`vitest.browser.config.ts` só usa plugin Vue). O teste deve receber CSS gerado **pelo preset real** em um ambiente Node e servi-lo como fixture de teste por um plugin restrito ao harness, se necessário. Não importar `src/presetMaxUno.ts` no iframe, pois depende de Sass e módulos Node; não duplicar suas fórmulas como CSS manual. A alteração pontual de `vitest.browser.config.ts`, se necessária para essa fixture, integra o escopo de testes, sem mudar configuração de aplicação.

Os resultados de geometry somente no happy-dom não comprovam quebra. A inspeção em Engeapp não comprova o código desta worktree sem identidade verificável da biblioteca. Nenhuma instalação, build, teste, serviço ou modificação de código foi executado para esta especificação.

### Limitações e fontes

- Lockfile confirma UnoCSS 66.10.5; `package.json` declara Vue `^3.6.0-rc.10`. Documentação oficial de UnoCSS e Vue consultada por Context7; a consulta não disponibilizou documentação versionada exata desse RC. Revalidar tipos/APIs instalados antes de implementar.
- `node_modules` desta worktree é symlink para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`; não instalar, atualizar ou escrever nessa árvore compartilhada.
- Guias oficiais: https://unocss.dev/presets/attributify ; https://unocss.dev/config/rules ; https://vuejs.org/guide/extras/render-function ; https://vuejs.org/api/render-function.html .
- Detalhes de operação, tarefas e registros de execução estão em `plan.md`.
