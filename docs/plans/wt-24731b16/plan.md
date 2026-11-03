# Plano de execução — múltiplos overlays coloridos no MaxBadge

## 1. Identificação e objetivo

- Data: 03/11/2026.
- Projeto: `@maxvue/max-components-ui` (`package.json`: `1.1.36`).
- Worktree/branch exclusiva: `wt-24731b16`.
- Diretório: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-24731b16`.
- Especificação normativa desta proposta: [spec.md](./spec.md).
- Executor solicitado: **Gemini 3.8 Flash, esforço High**. Não substituir por outro modelo nem alterar configuração de provedor nesta tarefa. A disponibilidade do identificador efetivo deve ser conferida pelo ambiente que iniciar Execute; nenhuma disponibilidade ou capacidade comparativa foi comprovada nesta sessão.
- Objetivo: aceitar `overlay?: boolean | string | number | string[] | number[] | OverlayData | OverlayData[]`, com `OverlayData = { color?: string; value: string | number }`, sem regressão dos formatos anteriores.
- Afetados: consumidores do badge, aliases, tags e botões/grupos que encaminham a prop.
- Requisito explícito adicional: `MaxBadgeButton` deve oferecer os mesmos múltiplos overlays e cores independentes de `MaxBadge`, não apenas aceitar uma tipagem mais ampla. Sua implementação, encaminhamento real e testes de renderização fazem parte obrigatória de T2/T3, inclusive em estado ativo/inativo.
- Esta sessão autoriza apenas os dois documentos. Executar o plano depende de autorização posterior. Não trocar branch, criar outra worktree, instalar, commitar, mergear, publicar ou fazer push por inferência.

## 2. Evidências da investigação

| Arquivo existente | Evidência e consequência |
|---|---|
| `src/components/MaxBadge.vue:12–15, 49–56, 121–146, 176–182, 243–258` | Renderiza um span; booleanos são aliases de status; vazios são ocultos; estilos vêm de uma única paleta. Precisa normalização/lista sem mudar status ou CSS legado. |
| `src/helpers/colorLuminance.ts:96–112, 176–191, 221–274` | Parser usa MaxUse, há fallback e memoização; `resolveBadgeColors` fornece `overlayBg` e `overlayText`. Reutilizar, sem alterar o algoritmo compartilhado. |
| `src/components/MaxBadgeButton.vue:3, 14–26, 91–109` | Encaminha overlay, mas restringe tipo; cor do badge fica neutra quando inativo. Atualizar contrato, preservar toggle e outline. |
| `src/components/MaxBadgeComponent.vue:2–15, 25–66` | Wrapper físico com aliases de label e união antiga. Ampliar tipo sem mudar aliases. |
| `src/components/MaxTag.vue:2–15, 24–39` | Encaminha overlay e mantém severidades próprias. Ampliar só o contrato pertinente. |
| `src/components/MaxBadgeButtonsGroup.vue:3, 12` | Encaminha `item.overlay`; tipo herda `MaxBadgeButtonProps`. Não requer nova prop nem mudança de seleção. |
| `src/index.ts:284–300` | `MaxBadgeComponent` da fachada aponta diretamente para MaxBadge; o subpath físico é outro componente. Preservar essa diferença e testar ambos os caminhos, sem corrigir aliases fora do escopo. |
| `package.json:60–75, 856–883`; `vite.config.ts` | Há subpaths, build por componente e geração de declarações; scripts de testes/build confirmados. |
| `tests/components/MaxBadge.test.ts`, `MaxBadgeButton.test.ts`, `MaxBadgeButtonsGroup.test.ts`, `MaxBadgeComponent.test.ts` | Cobrem escalar, booleanos, status e seleção; faltam múltiplos overlays e cor por item. |
| `vitest.config.ts`, `tests/setup.ts`, `tsconfig.test.json` | Happy DOM, Pinia isolada por teste, dedupe de Vue/Pinia, política de console, cores CSS simuladas e checagem de `tests/**/*`. Não confundir mocks com navegador real. |
| `vitest.browser.config.ts` | Chromium via Playwright, setup próprio, inclui `tests/browser/**/*.browser.ts`. |
| `playground/src/scenarios/buttons-badges.vue`, `playground/vite.config.ts` | Cenário já usa fachada pública; servidor usa host `maxcomponents.test` e porta fixa 5180. Não disputar nem reutilizar servidor de outro trabalho sem verificar sua origem. |
| `.gitignore:68–69` | `.worktrees/` e `.max-code-worktrees/` já estão ignoradas. |
| `scripts/verify-package-consumer.mjs:21–78, 139–145` | Empacota, instala dependências em diretórios temporários e os remove; verifica imports runtime, não o novo tipo. Exige autorização operacional própria e não substitui checagem das declarações. |

Estado inicial observado: `git status --short` vazio e branch `wt-24731b16`. Não é garantia de estado futuro: conferir novamente na execução.

Referência oficial consultada: Vue, `https://vuejs.org/api/sfc-script-setup`, `https://vuejs.org/guide/typescript/composition-api` e `https://vuejs.org/guide/essentials/list`, via Context7. Tipos importados são suportados desde Vue 3.3, a inferência runtime depende da AST e chaves devem ser primitivas e únicas. O projeto declara Vue `^3.6.0-rc.10`, TypeScript `^6.0.3` e Vite `^8.3.3`; a documentação consultada é geral do Vue 3, não uma garantia específica dessa versão RC. Não foi verificada a resolução instalada nem executada compilação.

## 3. Solução e decisões

Aplicar integralmente a tabela de entradas e decisões de `spec.md`. Pontos essenciais:

1. Definir `export type OverlayData` junto aos tipos de MaxBadge e reexportar na fachada.
2. Normalizar escalar/objeto/lista em `computed`, sem modificar props. Ausência, `null` defensivo e booleanos não produzem itens. Filtrar texto vazio sem remover zero nem espaços de valores válidos.
3. Renderizar spans com `v-for`, mantendo `.max-badge-overlay`, filhos diretos e margem esquerda `10px`. Índice local como chave evita colisão para valores repetidos; não há estado interno em cada span.
4. Com cor explícita não vazia, derivar `overlayBg`/`overlayText` pelo helper atual; sem cor, usar a mesma paleta do badge. Não aplicar propriedades de fundo/borda/glow do badge inteiro à pílula. Cor é base para paleta, não CSS literal garantido.
5. Atualizar tipos de wrappers pela fonte canônica (`MaxBadgeProps['overlay']`, se confirmado pelo compilador) sem alargar a união para `(string | number | OverlayData)[]`.
6. Preservar `status` explícito, aliases booleanos, label/ícone, cores globais, uppercase, tamanhos, dark, neon, background/textColor/outlineColor, eventos e seleção. Não refatorar os condicionais existentes sem necessidade causal.
7. Respeitar SFC template/script/style, recuo de quatro espaços em script, tags de abertura em uma linha, classes `.max-*`, tokens semânticos nos exemplos e comentários em pt-BR.
8. MaxComponentsUi é a implementação-alvo; MaxUse já atende helpers via `colorLuminance.ts`. Manter MaxPinia como infraestrutura de estado quando pertinente; não adicionar estado global, cache ou dependência obrigatória para uma projeção visual de props. Não usar Pinia puro para criar nova store de aplicação. Preservar o harness de testes existente.

Alternativas descartadas: container extra altera anatomia; chave baseada em valor colide; CSS de fundo literal ignora a paleta atual; nova store ou biblioteca de cores aumenta escopo; mudar o cache global de variáveis CSS ou garantir contraste de toda a biblioteca exige tarefa própria.

## 4. Etapas executáveis e dependências

### Roteiro operacional para Gemini 3.8 Flash (High)

**Modo de trabalho:** um executor, sequência fixa, alterações pequenas dentro de um único lote de implementação. Não iniciar subagentes, paralelismo de escrita nem outra sessão por inferência. A indicação do modelo não autoriza Execute. Os checkpoints abaixo são inspeções por leitura, não testes intermediários.

| Ordem | Tarefa e unidade de trabalho | Contexto necessário | Saída / checkpoint por leitura |
|---|---|---|---|
| 1 | T1: preflight | AGENTS, este plano, spec, scripts/configurações citados | Worktree/branch corretas; trabalho existente preservado; efeitos dos gates e dependências identificados. Bloqueio não conta como preflight aprovado. |
| 2 | T2: núcleo e contrato | `MaxBadge.vue`, `colorLuminance.ts`, seção 3 da spec | Tipo e união exatos, lista normalizada sem mutação, estilos por item, booleanos separados do fluxo de pílulas. |
| 3 | T2: encaminhamento público | Núcleo atualizado, wrappers, grupo e trecho de exports em `src/index.ts` | Mesma união nos wrappers, export de tipo, encaminhamento mantido; nenhum evento, alias ou algoritmo de cor alterado. |
| 4 | T3: cobertura de unidade e tipos | Contrato estabilizado e testes/setup existentes | Todos os formatos e regressões descritos em T3 cobertos; nenhum `any` escondendo erro de contrato. |
| 5 | T3: navegador; T4: exemplos | Contrato, configuração/setup de navegador e cenário do playground | Teste de geometria/tema/foco e exemplos tipados escritos; sem executar servidor ou gates neste checkpoint. |
| 6 | T5: validação do lote e entrega | Diff de todo o lote, matriz de aceite e scripts atuais | Gates executados com códigos reais, falhas diagnosticadas em conjunto e pendências explícitas; registro e handoff atualizados. |

**Antes de cada unidade:** conferir o que já está implementado e ler só os arquivos/trechos que serão usados. Depois de editar, conferir o diff do conjunto tocado. Se um patch falhar ou o conteúdo mudar externamente, reler os trechos afetados antes de tentar novamente. Não reinvestigar arquivos sem alteração nem reabrir decisões documentadas sem nova evidência.

**Ordem interna da normalização, sem impor nomes de funções:**

1. Descartar ausência e booleanos apenas do fluxo de pílulas; manter o cálculo atual de status independente.
2. Transformar entrada escalar em lista de um item; para array, preservar a ordem original.
3. Para cada elemento, aceitar primitiva string/número ou objeto não nulo com `value` string/número. Ignorar entrada inválida; não converter objeto inteiro em texto.
4. Omitir somente valores cujo texto aparado seja vazio, sem aparar o conteúdo exibido e sem filtrar `0`.
5. Para objeto com cor não vazia, resolver a paleta individual; caso contrário, usar a paleta atual do badge. Não mutar a entrada nem criar cache próprio.
6. Renderizar um span por item sobrevivente, com chave pelo índice local e CSS legado. Não adicionar wrappers DOM ou estado por item.

**Exemplos mínimos de conferência de contrato e saída:**

| Entrada de `overlay` | Textos das pílulas, na ordem | Observação |
|---|---|---|
| `0` | `['0']` | Não descartar por truthiness |
| `['A', '', '  ', 'A']` | `['A', 'A']` | Preservar duplicatas sem colisão de chave |
| `[0, 2, -1]` | `['0', '2', '-1']` | Lista numérica homogênea |
| `{ value: 'Novo' }` | `['Novo']` | Mesmas cores do fallback atual |
| `[{ value: 1, color: '#ef4444' }, { value: 'OK', color: '#10b981' }]` | `['1', 'OK']` | Cada item usa sua paleta; cores hex aqui são fixtures de teste, não novos tokens globais |
| `true` / `false` | `[]` | Manter aliases de status e prioridade do status explícito |
| `[]` | `[]` | Sem span vazio nem espaçamento residual |

Repetir os formatos novos no `MaxBadgeButton` real, inclusive ativo/inativo: cor explícita permanece independente; sem cor, acompanha `currentColor` do badge interno. O grupo herda o contrato sem alterar seleção. Não substituir testes de renderização por mera inspeção de props.

**Política de falha e retomada:** não corrigir ambiente ou dependências fora do escopo para conseguir verde. Ao falhar um gate, registrar o comando/código e agrupar causas antes de novas tentativas. Correções pertencentes à tarefa são feitas em lote; então reexecutar os gates afetados. Não trocar indexed access por união explícita por suposição: usar essa alternativa somente diante de evidência do compilador, na fase T5, e preservar o tipo público. Se for necessária instalação, mudança de configuração, acesso externo ou autorização de consumidor, interromper a ação dependente e registrar próxima ação concreta, sem declarar entrega integral.

**Registro de progresso:** manter IDs T1–T5; as unidades 2/3 pertencem à mesma T2 e 4/5 à mesma T3, sem inventar novos estados ou chaves. Atualizar o registro v2 descrito na seção 7 após marcos, somente durante Execute. Para handoff, comunicar unidade concluída, arquivos tocados, checks vigentes e próxima ação, sem criar documentos extras por inferência.

### T1 — Preflight somente por leitura

**Responsabilidade:** executor principal. Sem implementar antes de concluir as verificações de contrato.

- Ler `AGENTS.md`, spec e este plano na primeira admissão; nas retomadas ler só os trechos pertinentes.
- Conferir diretório, branch, diff e existência de trabalho já feito. Preservar alterações alheias e não investigar outras worktrees.
- Ler scripts/pre/post hooks e configurações efetivas; conferir versões instaladas, links e resolução de Vue/Pinia/MaxUse, presença do peer MaxPinia quando necessário e identidade única no harness. Axios não participa do fluxo: não ampliar escopo para HTTP.
- Conferir que build, cobertura, caches e artefatos de navegador escrevem apenas na worktree ou em destinos previamente autorizados e não em links para outra sessão. Se o playground emitir declarações por auto-import, inspecionar qualquer diff gerado e não descartar alterações preexistentes.
- Confirmar isolamento de storage/cache simulados e que nenhum teste dependente exige banco, filas, serviços ou credenciais compartilhados. Não copiar `.env`, migrar, resetar dados ou instalar dependências sem autorização específica.
- Gate de integridade de biblioteca falhado bloqueia validação dependente; não contornar por comando direto, remoção de prehook ou configuração alternativa.

**Concluído quando:** ambiente e contratos suficientes para implementar/verificar, ou bloqueio registrado com próxima ação concreta. Preflight não executado nesta sessão Plan.

### T2 — Contrato público e componente

**Depende de T1. Arquivos de escrita:** `src/components/MaxBadge.vue`, `src/index.ts`, `src/components/MaxBadgeButton.vue`, `src/components/MaxBadgeComponent.vue`, `src/components/MaxTag.vue`.

- Definir tipo/união, documentar formatos e semântica de cor na JSDoc.
- Trocar o trio escalar `hasOverlayValue`/`overlayValue`/`overlayStyles` por projeção reativa da lista com estilos independentes.
- Manter status em cálculo separado e renderizar a lista conforme spec.
- Ampliar contratos dos wrappers sem mudar demais props/defaults, eventos ou aliases. Manter tags tocadas em uma linha.
- Revisar por leitura a inferência runtime de booleano/string/número/array/objeto e encaminhamento. Se indexed access não for resolvido corretamente pelo compilador, usar a união explícita com `OverlayData` importado nos wrappers, registrando o motivo; não trocar o contrato solicitado.

**Concluído quando:** contratos e implementação cobrem todas as entradas da spec, prontos para cobertura; não executar tipos/testes/build após cada edição.

### T3 — Testes completos do lote

**Depende do contrato de T2. Existentes a ampliar:** os quatro `tests/components/MaxBadge*.test.ts` acima.

**Novos propostos:** `tests/components/MaxTag.test.ts`, `tests/components/MaxBadgeOverlayTypes.test.ts`, `tests/browser/MaxBadge.browser.ts`.

- Badge: formatos antigos; arrays de strings/números; objeto único/lista de objetos; cores independentes; fallback sem cor e cor em branco; zero; negativos/decimais sem nova formatação; lista vazia; strings vazias; duplicatas; preservação da ordem; coexistência com status e prioridade do status explícito sobre booleano.
- Reatividade: substituir listas com `setProps`, alternar escalar/objeto/array/booleano, mudar cor/valor em objetos reativos, reordenar e atualizar `color`, `dark`, `neon`; entrada congelada para detectar mutação. Nenhum objeto/lista deve virar texto acidental.
- Cores: conferir resultado com o helper existente e também diferenças entre itens usando cores hex distintas; testar variável CSS já suportada pelo mock, como `var(--max-primary-500)`. Não enfraquecer política de console nem adicionar mocks globais para esconder falha real.
- Wrappers: renderizar realmente o MaxBadge interno (não stubá-lo), verificar cores e lista em botão ativo/inativo, grupo e tag, preservando eventos, disabled e seleção. Cobrir wrapper físico e alias da fachada.
- Tipos: importar `OverlayData` da fachada e do componente; usar asserções de igualdade do Vitest para a união exata; fixtures tipadas para props do badge, botão, tag e item do grupo; casos negativos com `@ts-expect-error` para value ausente/booleano, array misto string+número, primitivas+objetos e arrays booleanos. Não usar `any` para comprovar contrato.
- Navegador: montar com infraestrutura já existente, verificar geometria real, margem de 10px, alturas, ausência de sobreposição, cores computadas com token e tema, ordem e nenhuma alteração de foco/ativação do botão. Para contraste, avaliar legibilidade sem transformar esta tarefa em correção global do algoritmo.

**Concluído quando:** todos os testes do escopo foram escritos e revisados; a execução dos gates começa só após T4.

### T4 — Exemplos de consumo

**Depende de T2. Arquivo de escrita:** `playground/src/scenarios/buttons-badges.vue`.

- Preservar estados existentes e acrescentar `string[]`, `number[]`, objeto com cor e lista `OverlayData[]` com/sem cor.
- Exemplo tipado de import público de `OverlayData`; cores semânticas de marca/sucesso/perigo, sem novas cores fixas globais.
- Mostrar status junto da lista e encaminhamento em botão/grupo. Não criar Get/Save/store para exemplos estáticos.

**Concluído quando:** exemplos documentam contrato e permitem inspeção visual clara/escura/neon, sem alterar configuração do playground.

### T5 — Gates, revisão e entrega

**Depende de T2, T3 e T4 completos.** Executar na worktree, sem implementações concorrentes. Comandos confirmados em `package.json`:

```bash
npm run check:lockfile
npm run type-check:test
npm run lint
npm run build
npm run test:built
npm run test:browser
```

- Esta é a validação do lote, não um roteiro por microedição. `npm run build` inclui vue-tsc e atende à checagem do código da biblioteca; `npm run type-check` é alternativa sem emissão, não etapa adicional obrigatória sobre a mesma revisão. Não usar `npm test` depois desse build: ele recompila; `test:built` executa a suíte completa sobre o build preparado.
- Conferir declarações geradas na fachada e subpath do componente, incluindo import de `OverlayData`, e união final dos wrappers. Não editar `dist` à mão. `npm run verify:package` está identificado, mas instala dependências, escreve fora da worktree e remove temporários: só executar com autorização específica desses efeitos e destinos isolados aprovados. Sem autorização, registrar gate de consumidor como pendente, sem substituí-lo por import do fonte. O script atual só verifica runtime; a prova do tipo gerado exige também conferir as declarações e compilá-las em consumidor isolado autorizado, usando o compilador já disponível e sem inventar aprovação desse gate.
- Para release futura, o gate é `npm run verify`, sujeito à autorização e preflight operacional de seus consumidores/auditoria. Se escolhido para a mesma revisão, ele substitui etapas já agregadas, sem repetição desnecessária. Este plano não autoriza release e validação parcial não deve ser apresentada como gate de release aprovado.
- Diagnosticar falhas por causa comum (bootstrap, resolução de módulos, build, mocks ou regressão), corrigir em lote e reexecutar só gates invalidados; não repetir a mesma falha sem diagnóstico nem corrigir baseline fora do escopo sem autorização.
- Inspeção manual do cenário: modo claro/escuro, neon, tamanhos padrão/large/xlarge, múltiplos valores, texto longo, botão ativo/inativo e foco. Textos longos podem aumentar largura como hoje; não prometer truncamento ou responsividade nova. Se navegador não estiver disponível, marcar `manualPending` com procedimento e próxima ação, sem instalar automaticamente.
- Revisão final por risco de API/compatibilidade, lendo diff bruto e submetendo-o ao guardrail Jev conforme AGENTS. Revisão independente nos marcos de contrato e entrega pode ser feita por revisor autorizado; não pressupõe delegação liberada.
- Informar comandos realmente executados, resultados e pendências. Nenhum commit/push/merge/limpeza de worktree pelo executor: integração e limpeza pertencem ao painel/usuário.

## 5. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência esperada | Testes e gates | Revisão por risco / manual |
|---|---|---|---|
| T1: ambiente isolado | Scripts/links/resoluções e destinos conferidos | Gate de integridade sem bypass | Bloquear efeitos em outro trabalho |
| T2: contrato solicitado | União exata e tipo exportado em fonte e declaração | Tipos, build, fixtures T3 e consumidor empacotado | Revisar AST/runtime e caminhos de export |
| T2/T3: múltiplos valores | Quantidade, ordem, duplicatas e zero corretos | MaxBadge unitário e navegador | Geometria de spans e estilo escalar preservado |
| T2/T3: cores independentes | Paletas diferentes, fallback inalterado | Valores de estilos, tema, CSS var real | Claro/escuro/neon; não alegar WCAG sem medição |
| T2/T3: compatibilidade | Status/booleanos, aliases, foco e seleção preservados | Testes existentes + wrappers/grupo/tag | Revisar fachada versus wrapper físico |
| T3: reatividade e segurança | Substituição e mutação reativas sem mutar props | Testes com atualizações e entrada congelada | Sem HTML dinâmico, novos eventos ou I/O |
| T4: exemplos | Formatos novos visíveis e import tipado | Build/gate aplicável + inspeção do cenário | Tokens canônicos e tags em uma linha |
| T5: fechamento | Resultados vinculados à revisão factual | Suíte completa, tipos/build, lint, navegador e pacote | Diff final; lacunas explícitas impedem conclusão integral |

## 6. Riscos, limites e recuperação

- **Compatibilidade pública:** união divergente em wrapper causa falha só em consumidores; comparar tipos e declarações, não apenas DOM.
- **Cor/cache:** helper memoiza por string/tema/neon, não pelo conteúdo resolvido de toda variável CSS. Preservar esse comportamento; não prometer atualização de variável arbitrária sem mudança de dependência reativa.
- **Contraste:** cálculo atual não prova razão mínima universal. Não modificar paleta global nesta demanda; evidência de problema novo exige diagnóstico e decisão de escopo.
- **Layout:** margem por pílula aumenta largura linearmente; não truncar dados nem impor máximo silencioso.
- **Harness:** mocks podem mascarar resolução de variáveis e não medem layout; navegador e pacote gerado são gates distintos.
- **Dependências:** instalação, navegador, servidor disponível e script de consumidor isolado não foram comprovados nesta sessão. Interromper validação dependente se faltar recurso.
- **Recuperação:** mudança aditiva sem persistência/migração; restaurar somente alterações desta tarefa mediante autorização, nunca reset amplo ou exclusão de trabalho alheio. Preservar trabalho parcial e worktree para integração.

## 7. Retomada, progresso e handoff durante Execute

- Conferir primeiro o trabalho existente e executar lacunas; reutilizar decisões/checks somente se conteúdo e revisão factual não mudaram. Não reabrir escolhas sem evidência nova ou mudança de requisito.
- Sequência deste executor: T1 → T2 → T3 → T4 → T5, seguindo as unidades da seção 4. Paralelo futuro só se houver autorização adicional, após estabilizar contrato e com arquivos de escrita distintos. Repassar objetivo, fonte/revisão, decisões, interfaces e aceite mínimo, sem exigir releitura integral em cada tarefa.
- Registrar progresso após marcos e no handoff em `docs/plans/wt-24731b16/execution-state.json`, **somente na fase Execute**. Não criar esse arquivo nesta sessão Plan.
- Calcular SHA256 real do conteúdo de `plan.md` para `planRevision` e hashes reais das revisões factuais de conteúdo das tarefas e do conjunto verificado; documentar ao próximo executor a seleção/ordem de arquivos utilizada. Não usar nomes de branch, rótulos ou SHA Git como SHA256 de conteúdo.

### Contrato estrito do registro, versão 2

- Raiz: somente `{version: 2, planRevision, tasks, verification, updatedAt?, nextAction?}`.
- `tasks`: lista de tarefas T1–T5, cada uma somente `{id, status, files, validations, revision?, nextAction?}`. `validations: []` é obrigatório e pode permanecer vazio; os checks executados são registrados em `verification.checks`, não se inventa um segundo formato de check dentro das tarefas.
- Status de tarefa: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- `verification`: somente `{revision, checks}`. Cada check: somente `{command, revision, result, exitCode?}`.
- Resultado de check/validação: somente `passed`, `failed`, `pending`; `blocked` é status de tarefa, nunca resultado de check.
- `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não admite `exitCode`. Nunca usar `null`.
- `updatedAt`, quando presente, é inteiro positivo em milissegundos, não string ISO. `nextAction` tem no máximo 512 caracteres; comando, no máximo 4.096.
- Proibidos campos adicionais em qualquer nível, inclusive `schemaVersion`, `blocker`, `diagnostic`, `branchSync`, `durableSync`, `followUp`, `title`, `evidence`; não colocar `worktree`, `branch`, `head`, `planPath`, `status` ou `checks` na raiz. Motivos e bloqueios cabem em `nextAction`.
- Registrar comandos realmente executados e todas as falhas, inclusive da suíte completa. Não inferir código de saída de `tool:end.ok`. Check vazio, sem resultado vigente ou com falha vigente impede validação integral. Version 1 é compatível, mas não prova validação integral automaticamente. O registro autodeclarado não prova execução nativa nem detecta checks omitidos.
- Cancelamento/bloqueio preserva resultado parcial e próxima ação concreta. Tarefa manual pendente não é concluída; espera por trabalho assíncrono deve ser limitada, com recuo e sem consultas repetidas sem informação nova.

## 8. Estado desta sessão Plan

Investigação e elaboração documental apenas. Nenhuma implementação, instalação, migração, teste, build, serviço, commit ou integração foi executado. Arquivos novos desta sessão limitam-se a `spec.md` e `plan.md` deste diretório. O plano está pronto para revisão, não representa autorização de execução nem validação verde do código futuro.
