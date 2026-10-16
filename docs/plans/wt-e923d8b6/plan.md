# Plano de execução — centralização de dez componentes Max

## 1. Identificação e autorização

- Data: 16/10/2026.
- Projeto: MaxComponentsUi (`@maxvue/max-components-ui`, versão declarada `1.1.12`).
- Worktree/branch: `wt-e923d8b6`.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-e923d8b6`.
- HEAD inicial: `8d0a751d69d05996f4eff02592a9a8a32c187c6f`.
- Especificação a ler na primeira admissão: [spec.md](./spec.md), especialmente contratos C01–C10 na seção 3.3.
- Estado deste documento: proposta para revisão; **implementação não iniciada e não autorizada por este plano**.

O usuário pediu análise dos frontends engeapp, MaxAiManager, AgenteDeBolso e SocialMedia e dez sugestões fundamentadas. A sessão Plan escreve somente `spec.md`, `plan.md` e notificações sanitizadas nos destinos autorizados. Execute futuro deve confirmar autorização do bloco, usar esta worktree já alocada e não fazer commit/merge/push, publicação ou troca de branch. Não criar outra worktree nem investigar as de terceiros.

## 2. Resultado da investigação e propostas

### 2.1. Dez componentes recomendados

| Ordem | Componente novo | Valor principal | Fonte concreta mais direta |
|---:|---|---|---|
| 1 | `MaxAlert` | Avisos inline persistentes, acessíveis e consistentes | AsyncFeedback (AgenteDeBolso), avisos TabCalendar (SocialMedia) |
| 2 | `MaxQueryState` | Loading, erro, vazio e cache antigo sem ocultar conteúdo útil | QueryStatePanel e queryPresentationState (AgenteDeBolso) |
| 3 | `MaxFormValidationSummary` | Erros de formulário reunidos com navegação até o campo | FormValidationSummary (MaxAiManager) |
| 4 | `MaxSegmentedControl` | Escolha exclusiva com botões e navegação de teclado | SelectionButtonGroup (MaxAiManager), regime do calendário (AgenteDeBolso) |
| 5 | `MaxPeriodNavigator` | Navegar por meses sem conhecer dashboard/store | TopMenuPeriodSelector e MonthGridSection (AgenteDeBolso) |
| 6 | `MaxProgressBar` | Progresso/consumo com semântica acessível e valores excedidos explícitos | BudgetBar/ObjectiveBar (AgenteDeBolso), BoardPage (MaxAiManager) |
| 7 | `MaxFilterBar` | Compor campos e ações de filtro fora de uma listagem específica | ExtractFilters (AgenteDeBolso), LogsPage (MaxAiManager), ClientBills (engeapp) |
| 8 | `MaxFilePreview` | Miniaturas e metadados de arquivos já selecionados ou salvos | FileUploadPreview/DocumentPreviewUpload (engeapp), AttachmentSection (AgenteDeBolso) |
| 9 | `MaxMarkdownViewer` | Leitura e sanitização centralizadas, sem carregar editor | MarkdownContent (engeapp), EventTabScript e markdown.ts (SocialMedia) |
| 10 | `MaxCalendar` | Grade mensal acessível com dias/eventos e slots de domínio | MonthGridSection (AgenteDeBolso), TabCalendar (SocialMedia) |

Não é necessário que cada sugestão já tenha duplicata literal nos quatro projetos: há extrações diretas e oportunidades potenciais, diferenciadas na spec. O pacote centraliza a casca reutilizável; aplicações mantêm seus adapters, regras e dados. A ordem acima é de recomendação; a ordem técnica de construção está na seção 5.

### 2.2. O que não criar novamente

- KPI/StatCard genérico: `MaxStats` já oferece cards/pills, rótulos, valores, prefixos e sufixos. Diferenças visuais do StatCard financeiro não justificam outra API pública agora.
- DataTable, upload, visualizador PDF, lightbox, modal ou wizard genéricos: já existem `MaxTable`, família de uploads, `MaxPdfView`, `MaxImage`, `MaxModal`, `MaxSteps`.
- Agendador editorial completo, simulador Instagram ou checkout completo: negócio/plataforma específicos e baixo reaproveitamento transversal frente às dez lacunas selecionadas.
- Novo estado HTTP/cache: `useAsyncState`, stores MaxPinia e seus status já existem; C02 apenas apresenta estado informado pelo pai.
- Novo parser Markdown: os dois consumidores têm renderizações diferentes, incluindo resolução de anexos Trello. C09 recebe renderer, sanitiza a saída e padroniza apresentação.
- Substituição imediata de FullCalendar: C10 é mensal e não assume paridade de scheduler, timezone, seleção de estratégias ou recorrência.

## 3. Evidências, fatos, decisões e limitações

### 3.1. Base factual

As raízes, revisões dos quatro projetos, contagem do inventário, caminhos/linhas das fontes e contratos propostos estão na spec, seções 1 e 3.2. Todos os caminhos novos estão explicitamente marcados como futuros na seção 3.4. Foram lidos:

- Diretrizes canônicas de MaxComponentsUi e engeapp/MaxAiManager; `CLAUDE.md` de AgenteDeBolso e SocialMedia e guia frontend de AgenteDeBolso.
- `package.json`, estrutura `resources/`, componentes candidatos e testes de referência nas quatro aplicações.
- Componentes existentes de biblioteca: MaxMsgLabels, MaxEmptyDiv, MaxStats, MaxBadgeButtonsGroup, MaxInputToggle, MaxInputDatePicker, MaxInputMarkdown, MaxInputFile, MaxInputFileUpload, MaxCard, MaxCardList, MaxImage e MaxPdfView, além de tipos relacionados.
- `src/index.ts`, `src/types/index.ts`, `src/components-manifest.json`, `src/scripts/generateResolver.ts`, `src/helpers/MaxComponentsUiResolver.ts`, `sanitizeHtml.ts`, `isSafeUrl.ts`, `useAsyncState.ts`, `useMaxPiniaSaveTracker.ts`.
- `vite.config.ts`, configs Vitest unitário/browser/benchmark, `scripts/verify-consumers.mjs`, `tests/index.test.ts`, `tests/components/MaxEmptyDiv.test.ts`, catálogo e registro de cenários do playground.
- Exports e implementação relevante de helpers no MaxUse irmão e tipos de status/configuração MaxPinia, **somente por leitura**.
- Documentação oficial Vue sobre contratos tipados de `script setup`; não foi utilizada API exclusiva da RC como pressuposto.

Testes de consumidores consultados, não executados:

| Projeto | Caminho existente | Contrato que fundamenta a extração |
|---|---|---|
| AgenteDeBolso | `tests/Js/Components/AsyncFeedback.test.ts` | Renderização vazia, role/live, ícones e associação por ID, inclusive SSR |
| MaxAiManager | `tests/Js/formValidationSummary.spec.ts` | Resumo ausente sem erros, alerta, navegação e foco |
| MaxAiManager | `tests/Js/selectionButtonGroup.spec.ts` | Radio/Tab, seleção, opções desabilitadas, setas/Home/End |
| engeapp | `tests/Js/markdownContent.test.ts` | Atributos de wrapper, URL de anexo adaptada, troca de source, clique e Esc do visualizador |

A busca dos dez nomes públicos e aliases sem Max no manifesto atual não encontrou correspondências. O gerador também produz aliases snake/kebab; conferi-los novamente no preflight após qualquer mudança de base.

### 3.2. Decisões propostas

1. Adição sem breaking changes, nenhuma migração de consumidor neste bloco.
2. Props/eventos/slots como fronteira; MaxPinia continua obrigatório para GETs e persistência das aplicações, sem store artificial nos componentes visuais.
3. Reuso de MaxComponentsUi e MaxUse; sem PrimeVue nem novas dependências diretas para os padrões selecionados.
4. Sem taxas, cores financeiras, faixas de consumo, estratégias editoriais ou rotas fixas dentro do pacote.
5. C09 exige renderer explícito e sanitização própria; C10 oferece uma grade mensal, não um wrapper de FullCalendar.
6. O plano pode ser revisado antes de Execute. Detalhes de baixo impacto seguem os padrões existentes; ampliar API, dependências ou escopo exige decisão nova.

### 3.3. Limitações e achados separados

- Pesquisa estática dirigida, não auditoria completa das 597 SFCs inventariadas nem validação visual/runtime.
- Bibliotecas dos quatro consumidores usam symlinks para árvores principais compartilhadas, não para esta worktree. Pacotes de M/A têm mudanças preexistentes; preservar.
- Divergência declarada Pinia 3 em E/A versus peer Pinia 4 da biblioteca: instalação/adaptação real permanece pendente, sem presumir a versão efetivamente carregada.
- Risco no fallback SSR do sanitizador global e caso limite de foco no controle de seleção local M foram notificados. Não houve exploração ou reprodução dinâmica.
- Nenhum problema de MaxPinia ou falta de helper genérico MaxUse foi comprovado. `formatBytes` e os recursos VueUse necessários existem no fonte irmão; a disponibilidade no npm resolvido precisa de preflight.
- Notificações: `max-components-ui-componentes-reutilizaveis.md`, `max-components-ui-sanitizacao-ssr.md`, `max-components-ui-compatibilidade-consumidores.md`, `selecao-segmentada-foco-desabilitado.md`, todas em `docs/notifications/wt-e923d8b6/notifications/`.

## 4. Preflight obrigatório em Execute, antes da implementação dependente

Esta seção é instrução futura; não executar testes/preflight operacional em Plan.

1. Ler os documentos na primeira admissão; conferir se parte do trabalho já existe, HEAD/status/diff e mudanças locais de usuário. Confirmar raiz/branch e autorização recebida. Não sobrescrever arquivos só porque o plano os lista como novos.
2. Por leitura, inspecionar scripts/pre/posthooks, lockfile, resoluções e symlinks efetivos de `node_modules`, Vue, Pinia, Axios e `@maxvue/*`. O código de biblioteca não importa MaxUse de `file:../MaxUse`. Conferir APIs no pacote npm efetivo, não apenas na árvore irmã.
3. Confirmar identidade única de Vue/Pinia e da instância Axios usada pelo MaxPinia no harness. `vitest.config.ts` já faz dedupe Vue/VueUse/Pinia; isso não comprova por si só identidade de Axios nem o transporte do consumidor. Dublês devem ser instalados na instância que o teste usa.
4. Confirmar escrita isolada de build, caches, browser, screenshots, downloads e cenários de consumidor. Nenhum teste deste bloco precisa de banco, cache remoto, fila, storage compartilhado ou fornecedor/modelo de IA. Bloquear boot inesperado desses recursos. Não copiar `.env` nem executar migrations/resets/seeders.
5. Ler `scripts/verify-consumers.mjs`: o gate cria consumidores temporários e instala dependências; em Execute isso exige acesso/permissão compatível. Preferir `CONSUMER_TEMP_DIR` dentro de área isolada desta worktree se a sessão restringir escrita. Não executar instalação em Plan. Não suprimir etapas para declarar gate aprovado.
6. Se futuro escopo incluir um consumidor real, reabrir somente a autorização/contrato dessa integração: E/M têm verificações de integridade de libs e geração de tipos. Gate falhado bloqueia validação dependente. Não remover hook, usar runner direto/ignoreConfig/legacy-peer-deps ou trocar symlinks para passar.
7. Conferir acessibilidade/estilos locais antes de reutilizar subcomponentes; evitar botão interativo dentro de outro botão e assegurar IDs por instância.

Concluir este marco com dependências disponíveis e contratos viáveis. Bloqueio real exige próxima ação concreta e evidência sanitizada; não instalar ou alterar outras árvores silenciosamente.

## 5. Etapas executáveis futuras

### T00 — Conferência de escopo e ambiente

- **Entrada:** autorização Execute, spec/plan, estado da worktree.
- **Ações:** cumprir preflight acima; conferir baseline e arquivos existentes; resolver só impedimentos essenciais ao bloco.
- **Saída:** execução pode ocorrer sem tocar árvores/fontes compartilhadas; ou tarefa `blocked` com próxima ação.
- **Conclusão:** contratos críticos conferidos por leitura, sem afirmar que um teste passou.

### T01 — Alertas e apresentação de consulta (C01/C02)

- **Arquivos novos:** `src/components/MaxAlert.vue`, `MaxQueryState.vue`; `src/types/feedback.ts`; testes correspondentes em `tests/components/`.
- **Ações:** construir C01 e depois C02 conforme spec; reusar loader/empty; definir anúncio único e manutenção de conteúdo montado no estado stale. State e retry vêm do pai.
- **Resultado:** mensagem inline e estado de consulta reutilizáveis sem nova camada de cache.
- **Dependência:** T00. Testes são escritos neste marco, mas executados somente no lote final.

### T02 — Resumo de validação (C03)

- **Arquivos novos:** `MaxFormValidationSummary.vue`, `src/types/validation.ts`, teste unitário correspondente.
- **Ações:** issue type próprio, lista ordenada pelo consumidor, navegação/foco opcional e método explícito de foco do resumo. Não extrair `useServerValidation` inteiro nem normalizar Axios/Laravel no componente.
- **Resultado:** estrutura independente de backend e de campos/abas específicos.
- **Dependências:** T00; composição pode reutilizar C01, sem duas regiões alert aninhadas anunciando o mesmo conteúdo.

### T03 — Seleção e navegação temporal (C04/C05)

- **Arquivos novos:** `MaxSegmentedControl.vue`, `MaxPeriodNavigator.vue`, `src/types/selection.ts`, `src/types/period.ts` e seus testes.
- **Ações:** contratos escalares, rádio acessível, mês 1–12 e limites. Reusar MaxButton/MaxIconButton e helpers de data confirmados; impedir defaults dependentes do relógio em SSR.
- **Resultado:** componentes sem store global e sem perda de Tab por seleção desabilitada/removida.
- **Dependência:** T00; C05 precisa estar concluído antes de C10.

### T04 — Barra e composição de filtros (C06/C07)

- **Arquivos novos:** `MaxProgressBar.vue`, `MaxFilterBar.vue`, `src/types/progress.ts`, `src/types/filters.ts` e testes.
- **Ações:** separar meter/progress, valor visual limitado e descrição real; filtro por slots sem esquema dinâmico, sem form aninhado e sem submissão forçada.
- **Resultado:** primitiva de indicação e layout de filtros reutilizáveis sem regras de orçamento ou reload embutidas.
- **Dependência:** T00. Não modificar `MaxCardList`; demonstrar composição em seu slot existente.

### T05 — Prévia de arquivo (C08)

- **Arquivos novos:** `MaxFilePreview.vue`, `src/types/filePreview.ts`, teste unitário.
- **Ações:** união local/remoto, IDs estáveis, formatos suportados, fallback, URLs permitidas por contexto, `formatBytes`, lifecycle de object URL. Compor MaxImage e MaxPdfView sem instanciar PDF antes da abertura.
- **Resultado:** mesma apresentação para anexo local e remoto, sem upload/exclusão automática.
- **Dependência:** T00; conferir métodos/props reais de MaxImage/MaxPdfView antes de conectar abertura.
- **Marco de risco:** revisão de URLs, liberação de recursos e troca rápida de arquivo antes da integração final, por leitura do lote pronto.

### T06 — Leitor Markdown (C09)

- **Arquivos novos:** `MaxMarkdownViewer.vue`, `src/types/markdownViewer.ts`, `src/helpers/sanitizeMarkdownHtml.ts`, testes unitários de componente/helper.
- **Ações:** renderer obrigatório, saída sanitizada, política de elementos e URLs restrita, texto escapado em erro/SSR inseguro, hidratação estável, overflow e emissão de imagem aprovada. Não ampliar sanitizador global nem carregar editor.
- **Resultado:** leitura segura centralizada com adaptação explícita de renderizador do consumidor.
- **Dependência:** T00; não depende de implementar/corrigir o achado global fora de escopo.
- **Marco de risco:** revisão independente de XSS/SSR/hidratação antes do fechamento. Se indisponível outro revisor, registrar limitação e fazer revisão explícita baseada em casos adversariais; não alegar revisão independente inexistente.

### T07 — Grade mensal (C10)

- **Arquivos novos:** `MaxCalendar.vue`, `src/types/calendar.ts`, teste unitário.
- **Ações:** grade mensal pt-BR, eventos por dia civil, slots e payload de intervalo com fim exclusivo. Compor C05 e preservar seleção/foco acessíveis, inclusive dia sem eventos. Distinguir alvo de dia e de evento sem botão aninhado.
- **Resultado:** calendário neutro com dois exemplos de shapes distintos, financeiro agregado e editorial; nenhum cálculo monetário, geração ou timezone de domínio na biblioteca.
- **Dependências:** T00 e C05 em T03. Não migrar TabCalendar nem MonthGridSection.

### T08 — Contratos públicos, exemplos e testes transversais

- **Existentes a editar:** `src/index.ts`, `src/types/index.ts`, `package.json`, `src/components-manifest.json`, `playground/src/catalog.ts`, `playground/src/scenarios/index.ts`, `tests/index.test.ts`, `scripts/verify-consumers.mjs`.
- **Novos:** cenário `playground/src/scenarios/reusable-components.vue`; testes de browser, SSR/hidratação, tipos e benchmark listados na spec 3.4.
- **Ações:** adicionar dez exports canônicos e tipos sem remover aliases. Preservar plugin que registra tooltip, sem forçar registro global. Subpaths seguem `./components/Nome` existentes e wildcard; refletir entradas explícitas conforme padrão atual. Rodar o gerador de manifesto apenas em Execute, após conferir acesso ao tsx já disponível; não instalar ferramenta implicitamente.
- **Playground:** dez cenários no catálogo apontam para o cenário novo, com estados e dois formatos de dados por abstração relevante; dados fictícios, sem pessoas/credenciais reais. Registrar famílias existentes, sem nova taxonomia desnecessária.
- **Cobertura:** teste de exportação para todos; root/subpath/resolver/tipos e consumidor empacotado sem opcionais. SSR e browser devem importar componentes reais, não somente stubs de interação.
- **Dependências:** T01–T07 concluídas. Não executar gates com tarefas de implementação ainda abertas.

### T09 — Validação agrupada, revisão e handoff

- **Comando confirmado:** `npm run verify`, a partir da raiz desta worktree e com isolamento/permissões do preflight.
- O comando já agrega tipos, lint, build, suíte unitária, cobertura, browser, benchmark, consumidores, bundle e segurança. Não rodar antes outro lote inteiro equivalente nem duplicar comandos componentes por rotina. A implementação do próprio script de consumidores pode fazer build interno; não alterar o gate existente só para otimizar isso.
- Consolidar todas as falhas, inclusive da suíte completa, separar baseline/ambiente/regressão com evidência e corrigir em lote somente o escopo autorizado. Diagnóstico do harness/bootstrap vem antes de repetição equivalente sem progresso.
- Revalidar após correção relevante; reaproveitar checks da mesma revisão factual quando ainda válidos. Checks anteriores não validam arquivos alterados posteriormente.
- Fazer revisão final dos contratos, APIs públicas e segurança, depois verificações manuais da matriz. Deixar `manualPending`, `validationFailed` ou `blocked` quando faltar evidência; não declarar conclusão integral.
- Handoff inclui arquivos, comandos/exit codes reais, hashes de revisão, pendências e próxima ação; preservar worktree. Git, publicação, migração de consumidores e correções fora de escopo não são executados.

### 5.1. Paralelismo e conflitos

Não há delegação executada neste Plan. Se Execute optar por múltiplos executores autorizados, T01, T03, T04, T05 e T06 podem ocorrer em paralelo com arquivos novos distintos, após T00. T02 aguarda C01 se o reutilizar; T07 aguarda C05. **T08 tem um único responsável** por exports, manifesto, package e catálogo; ninguém mais escreve esses arquivos compartilhados. T09 só começa depois de todos entregarem código e testes. Contexto delegado mínimo: trecho da tarefa, contratos pertinentes da spec e caminhos, sem releitura integral compulsória de todos os projetos.

## 6. Matriz de aceite por tarefa

Nenhuma linha desta matriz foi validada por execução nesta sessão.

| Tarefa/requisito | Evidência esperada de implementação | Testes pertinentes futuros | Revisão pelo risco e manual |
|---|---|---|---|
| T00: isolamento | Resoluções/scripts reais e autorização do bloco; sem mutação compartilhada | Preflight por leitura; nenhum banco/fornecedor necessário | Conferir paths e hooks; bloquear libs inconsistentes |
| T01/C01: avisos | Quatro severidades, id/slots, vazio não renderizado, close apenas emite | Unitário e SSR de texto/roles; browser de close/foco | Conferir um único anúncio; dark/contraste e mensagem longa |
| T01/C02: estado | Cinco estados, stale preserva instância de conteúdo, retry controlado | Matriz state, retry bloqueado e erro sem dados; exemplo com status MaxPinia | Não confundir cache vazio com sucesso fresco; nenhuma rede automática |
| T02/C03: erros | Issues estáveis, foco explícito e alvo opcional | Unitário de navegação/ordem/alvo ausente/disabled; browser com InputBase real e duas instâncias | Aba assíncrona pelo adaptador, movimento reduzido e anúncio sem foco roubado |
| T03/C04: seleção | String/número/null distintos, Tab único, sem mutar opção | Teclado setas/Home/End/Space/Enter, zero opções, todas disabled, seleção removida/desabilitada | Browser sem stubs de MaxButton; foco visível e sem submit involuntário |
| T03/C05: período | Janeiro/dezembro, limites, atual injetado, objeto imutável | Unitário com limites/valores inválidos; SSR determinístico e browser | Rótulo pt-BR e navegação sem perda de foco |
| T04/C06: barra | Meter e progress distintos; excedente textual preservado | Negativo, zero, 100, 130, null, NaN, infinito, max inválido; roles/ARIA | Objetivo alcançado não herda vermelho; sem orçamento não vira zero; reduced-motion |
| T04/C07: filtros | Slots independentes da lista e sem form próprio | Apply opt-in, clear condicionado, disabled/loading, slot com MaxGrid/inputs reais | Pai decide instantâneo/aplicar/paginação; testar dentro de form e slot MaxCardList |
| T05/C08: arquivo | DTO local/remoto estável, fallback, sem preload PDF | Troca rápida/ID, formatos, falha de imagem/PDF, rejeição de URL, criação/liberação de blob | Revisão segurança/lifecycle; abrir imagem/PDF por teclado, SSR sem File global |
| T06/C09: Markdown | Renderer separado, DOMPurify restrito ou texto seguro, sem editor | Script/evento/esquema executável/iframe/SVG/style, tabelas/headings, source vazio/trocado, renderer lança, SSR e hidratação | Revisão de segurança; URL relativa/autenticada preservada pelo adaptador, texto longo e imagem sem alt |
| T07/C10: calendário | Grade e range com fim exclusivo, eventos e slots, IDs estáveis | Fevereiro bissexto, mês de 28/30/31 dias, limites, sem eventos, range único e clique isolado de evento | Teclado/foco real, dias vazios, 320px/dark; demonstrar dados financeiros e editoriais sem fundi-los |
| T08: distribuição | Dez nomes e tipos no root/subpath/resolver/catalog | Testes de exports/tipos, consumidor empacotado, snapshot sem mudança de aliases antigos | Import sem MaxPinia opcional quando não usado; nenhum PrimeVue/dependência nova |
| T09: entrega | Gate completo e resultados vinculados à revisão final | `npm run verify` e inspeções manuais acima | Sem pendência/falha omitida; revisão final e handoff honestos |

### 6.1. Desempenho e acessibilidade

- Benchmark novo cobre montagem/desmontagem dos componentes leves, atualização do mês/eventos e troca de arquivo/source; usar padrões/limites do harness existente e registrar a baseline da mesma máquina. Não inventar SLA em milissegundos sem medição.
- C09 não deve importar editor/Monaco; C08 não deve carregar worker PDF sem abertura. Confirmar no gate de bundle e pela inspeção de imports.
- Testes manuais: viewport de 320px e desktop, zoom 200%, claro/dark, foco visível, Tab/Shift+Tab/setas, nomes acessíveis, live regions com tecnologia assistiva quando disponível, preferência de movimento reduzido e montagem em aba inicialmente oculta. Ausência de leitor de tela real fica registrada como pendência, não comprovada por teste DOM.
- Calendário precisa degradar com muitos eventos sem cortar acesso a eles; usar slot/resumo acessível, sem virtualizar grade fixa de um mês. Definir volume de ensaio a partir das fixtures do teste, sem promessa de escala infinita.

## 7. Operação, compatibilidade e reversão

Não há migrations, endpoints novos ou efeitos em serviços. O risco principal é publicar uma API que assuma dados de um app ou dependências não satisfeitas. Sem migração de consumidor, o rollback do bloco futuro é retirar apenas as adições próprias ainda não integradas, mediante autorização e preservando trabalho preexistente; nunca reset destrutivo da árvore inteira. Após publicação, reversão passa por política de versão e autorização próprias, não contempladas aqui.

A adoção nos quatro projetos é uma próxima proposta: confrontar wrappers/estilos/estado e seus testes, resolver versões e pins com os responsáveis, preservar aliases locais e regras de negócio. Não desativar o gate de integridade de bibliotecas nem declarar adoção a partir dos fixtures desta biblioteca. Nenhuma chamada IA/publicação é necessária para validar apresentação.

Tarefas assíncronas devem aguardar evento de conclusão/mudança com prazo e recuo limitados, sem polling repetitivo sem informação nova. Cancelamento mantém resultados parciais e pendência explícita; autorização de fornecedor/credenciais não se infere de mocks.

## 8. Retomada e registro de execução futuro

1. Na primeira admissão, ler spec e plano. Nas retomadas, consultar somente o trecho pertinente, conferir alterações já feitas e revisão atual, e executar as lacunas. Não reabrir decisões sem evidência nova/requisito alterado.
2. Durante Execute, após marcos/handoff, registrar `docs/plans/wt-e923d8b6/execution-state.json`. **Não criar esse arquivo durante Plan.**
3. Usar version 2 estrita, conforme schema efetivamente consumido pelo fluxo Execute. Localizar esse schema/contrato antes da escrita; não inventar campos de topo ou preencher revisão com rótulo. Vincular o documento ao SHA256 real de `plan.md` e as tarefas às revisões factuais reais de seu conteúdo/arquivos.
4. Registrar tarefas, estados, arquivos e próxima ação. Estados de tarefa permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. Motivos ficam em `nextAction`, até 512 caracteres. Proibidos campos adicionais como `blocker`, `diagnostic`, `branchSync`, `durableSync` e `followUp`.
5. Comandos registrados têm até 4.096 caracteres. `verification` contém `{ revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`; resultados estritos `passed`, `failed`, `pending`, nunca `blocked` como resultado de validação/check. `passed` exige exitCode 0; `failed`, inteiro diferente de 0; `pending`, sem exitCode.
6. Registrar somente comandos executados e todas as falhas, inclusive da suíte completa; não inferir exit code de `tool:end.ok`. Checks vazios/ausentes, resultado desatualizado ou falha vigente impedem validação integral. V1 permanece compatível sem provar validação integral automaticamente. Registro autodeclarado não prova execução nativa nem detecta comandos omitidos.
7. Se o schema não estiver disponível, registrar o impedimento no handoff e obter o contrato do executor, sem improvisar um JSON supostamente válido. Bloqueios/validação manual sempre têm próxima ação concreta; falha repetida sem mudança exige diagnóstico antes de outra tentativa.

## 9. Revisão final desta proposta

- Pedido atendido por análise dirigida dos quatro projetos e exatamente dez sugestões com fontes rastreáveis.
- Escopo separado: documentos agora; implementação futura somente no MaxComponentsUi; adoção/migrações/correções de baseline fora do bloco.
- APIs novas explicitamente propostas, não apresentadas como existentes; componentes existentes preservados, sem PrimeVue.
- MaxComponentsUi/MaxUse/MaxPinia considerados nos lugares corretos, sem acoplar componente visual ao transporte/cache de aplicação.
- Dependências e contratos críticos de arquivo, data, estado, foco e HTML tratados; symlinks e divergências de versões não mascarados.
- Etapas ordenadas e independências delimitadas; validação em lote vinculada à revisão, matriz de aceite e limitações manuais explícitas.
- Nenhum teste/build/instalação executado nesta sessão; nenhuma aprovação de runtime ou de adoção afirmada.
- Documentação e notificações apenas nos destinos autorizados; sem Git de integração ou limpeza da worktree.
