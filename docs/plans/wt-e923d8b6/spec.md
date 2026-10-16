# Especificação técnica — dez componentes reutilizáveis do ecossistema Max

## 1. Contexto & Objetivo

- Data: 16/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.12`.
- Worktree e branch: `wt-e923d8b6`.
- Raiz confirmada por `pwd` e `git rev-parse --show-toplevel`: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-e923d8b6`.
- Revisão inicial da biblioteca: `8d0a751d69d05996f4eff02592a9a8a32c187c6f`; árvore inicialmente limpa.
- Solicitação: analisar os frontends de engeapp, MaxAiManager, AgenteDeBolso e SocialMedia e sugerir dez novos componentes para centralização e reutilização futura.
- Entrega desta sessão: investigação, propostas e documentos. Não há autorização para implementar, migrar consumidores ou publicar.

A inspeção encontrou padrões locais de feedback, estados de consulta, navegação temporal, filtros, arquivos e conteúdo rico que ainda não constituem componentes públicos equivalentes na biblioteca. O objetivo futuro é centralizar a apresentação e a interação desses padrões, sem transferir regras de negócio, transporte HTTP ou persistência das aplicações para componentes visuais.

### 1.1. Fontes e limites da análise

As aplicações foram inspecionadas somente em suas árvores principais, sem acessar outras worktrees. Prefixos usados nos documentos:

| Prefixo | Raiz somente leitura | HEAD observado | SFCs sob `resources/` |
|---|---|---|---:|
| E | `/home/johnattas/GitHub/engeapp` | `47071e3b2a5233da5d9977041cca74720c956b21` | 361 |
| M | `/home/johnattas/GitHub/MaxAiManager` | `4c797886d62c5fa31ee3a894fe147bba5f46bfc3` | 47 |
| A | `/home/johnattas/GitHub/AgenteDeBolso` | `86adcf426532df4e970549286dd08f786cd251a7` | 166 |
| S | `/home/johnattas/GitHub/SocialMedia` | `8e6cbe1fbc561dde1ef27b143936224d522c49fa` | 23 |

Contagem por inventário de caminhos, não revisão integral de todos os SFCs. A análise aprofundada foi dirigida aos padrões candidatos e seus contratos/testes. `package.json` de M e A já possuíam alterações locais; os valores registrados são os observados no disco, não necessariamente os de HEAD. `resources/` não apresentou alterações no recorte consultado. Nenhum teste, build, aplicação ou integração externa foi executado. Não foram lidos arquivos de ambiente, certificados privados, bancos ou credenciais.

### 1.2. Diagnóstico por aplicação

- **Engeapp:** grande superfície de formulários, atendimento, documentos e projetos. `MarkdownContent`, `DocumentPreviewUpload` e `FileUploadPreview` concentram renderização, miniaturas e adaptações de mídia; filtros locais aparecem em seções de distribuidores e contas. Há componentes de domínio que devem permanecer na aplicação.
- **MaxAiManager:** `FormValidationSummary` e `SelectionButtonGroup` já fornecem bons pontos de extração. `LogsPage` compõe campos, filtros exclusivos e ações. `BoardPage` já usa `MaxStats`, mas desenha barras de consumo e estados de orçamento localmente.
- **AgenteDeBolso:** `AsyncFeedback`, `QueryStatePanel`, `TopMenuPeriodSelector`, `BudgetBar`, `ObjectiveBar`, `ExtractFilters` e grades mensais mostram padrões reutilizáveis. Comentários do código explicitam regras financeiras e diferenças entre formatos de dados que não devem ser fundidos.
- **SocialMedia:** `TabCalendar` agrega FullCalendar, resumo, avisos e planejamento. `EventTabScript` recebe uma função de renderização de Markdown; o renderizador real em `resources/Js/markdown.ts` escapa HTML antes de formatar. `ThemeScheduleBuilder` e `EventTabArtwork` têm decisões editoriais próprias. `GeneralCalendarPage` é apenas uma tela “Em breve”, não evidência de calendário consolidado funcional.

## 2. Escopo

### Incluído na proposta futura

Exatamente dez novos componentes públicos, com contratos mínimos abaixo; tipos públicos; testes unitários, de navegador e SSR pertinentes; exemplos no playground; exports e resolver; documentação de uso dentro dos cenários e contratos tipados. A implementação só começa em sessão Execute autorizada.

### Fora de escopo

- Alterar os quatro consumidores, migrar versões de Pinia/Vue/Vite ou seus arquivos de dependências.
- Reescrever telas, excluir componentes locais, alterar rotas, DTOs, cache, permissões, dinheiro, estados editoriais ou processos de IA.
- Criar outra worktree, trocar branch, fazer commit, merge, push, publicação ou deploy.
- Adicionar PrimeVue, FullCalendar ou um novo parser Markdown à biblioteca.
- Criar scheduler semanal, arrastar/redimensionar eventos, recorrência, geração de publicações, chat completo, OCR ou gerenciador de arquivos.
- Corrigir problemas preexistentes gerais: achados separados em `docs/notifications/wt-e923d8b6/notifications/`.

## 3. Arquitetura & Mudanças Técnicas

### 3.1. Direção comum e preservação de contratos

```text
Backend existente → store MaxPinia da aplicação → adaptação explícita → props/slots Max*
                                            ← eventos de intenção ← interação
Helpers genéricos: @maxvue/max-use → componentes
```

1. Componentes novos são apresentacionais/controlados. Não fazem GET, salvamento, autosave, retry HTTP, polling ou cache próprios. GETs e persistência continuam nas stores MaxPinia; exemplos conectados devem usar essas stores, não substituí-las por `useAsyncState` ou Axios no componente.
2. A biblioteca já tem `useAsyncState` e `useMaxPiniaSaveTracker`. Preservá-los: estado de execução e acompanhamento de save não equivalem a um painel visual de consulta com cache antigo.
3. Usar os componentes Max existentes na composição e `@maxvue/max-use` nos helpers genéricos. Confirmados no código-fonte irmão: `formatBytes`, `addTime`, `useDateFormat`, `useEventListener`, `useObjectUrl`, `useResizeObserver`, `useElementSize`. Confirmar sua disponibilidade na versão npm efetivamente resolvida antes de importar; a biblioteca exige `@maxvue/max-use: ^1.1.47` via npm, nunca `file:` local.
4. Não criar stores artificiais para estado efêmero de seleção/foco. MaxPinia pertence à fronteira de dados da aplicação. Isolamento de cliente/perfil/registro/período continua com o consumidor; não inferir chaves ou prometer que `reload(): void` aguarda resposta.
5. Composition API, TypeScript estrito, props/emits/slots tipados, sem `any` nas APIs novas; SFC em ordem template/script/style; indentação de script em quatro espaços; tags de abertura em uma linha; comentários em pt-BR.
6. Classes novas `.max-*`, SCSS scoped, tokens canônicos de marca/semântica/foco, Quicksand e densidade compacta. Preservar classes `.p-*` e contratos existentes, sem copiá-los para APIs novas. Cores financeiras/editoriais são escolhidas pelo consumidor, nunca inferidas de porcentagem ou texto.
7. Compatibilidade mínima conforme peers atuais: Vue `^3.5.11` ou faixas 3.6 já declaradas, Pinia 4 na biblioteca. Não depender de recursos exclusivos da RC. A documentação oficial de `script setup` confirma props tipadas, emits por tuplas e slots tipados: https://vuejs.org/api/sfc-script-setup (consulta em 16/10/2026; documentação geral, não snapshot exato da RC).

### 3.2. Catálogo proposto e evidências

Todos os caminhos de consumidores nesta seção são relativos aos prefixos E/M/A/S. “Potencial” indica uso futuro, não adoção comprovada. Ordem representa benefício inicial e dependências, não medição quantitativa de retorno.

| ID | Novo componente | Evidência existente | Reutilização e diferença para a biblioteca atual |
|---|---|---|---|
| C01 | `MaxAlert` | A `resources/Vue/Components/AsyncFeedback.vue:1–72`; S `resources/Vue/Sections/SocialMedia/TabCalendar.vue:3–10`; M `resources/Vue/Pages/BoardPage.vue:3` | Aviso persistente inline em qualquer projeto. `MaxToast` é flutuante e `MaxMsgLabels` é mensagem de campo; nenhum substitui essa região semântica. |
| C02 | `MaxQueryState` | A `resources/Vue/Components/QueryStatePanel.vue:1–78` e `resources/Functions/queryPresentationState.ts:1–105`; M `resources/Vue/Pages/BoardPage.vue:35–39`; S estados em `EventTabScript.vue:1–27` | Loading/erro/vazio/cache antigo, preservando conteúdo útil. Compõe `MaxAlert`, `MaxLoader` e `MaxEmptyDiv`; não duplica seus renderizadores. |
| C03 | `MaxFormValidationSummary` | M `resources/Vue/Components/FormValidationSummary.vue:1–73`, `resources/Helpers/useServerValidation.ts:3–53` | Resumo navegável de erros de formulário; potencial em modais/cadastros dos quatro projetos. `InputBase` trata campo individual; normalização de erro Laravel continua fora. |
| C04 | `MaxSegmentedControl` | M `resources/Vue/Components/SelectionButtonGroup.vue:1–149`, `resources/Vue/Pages/LogsPage.vue:71–109`; A `resources/Vue/Sections/Calendar/MonthGridSection.vue:26–42` | Escolha exclusiva com botões e teclado. `MaxInputToggle` é binário; `MaxBadgeButtonsGroup` usa array e semântica de grupo, não rádio escalar. |
| C05 | `MaxPeriodNavigator` | A `resources/Vue/Components/TopMenuPeriodSelector.vue:1–69`, `MonthGridSection.vue:3–24`; S `resources/Vue/Sections/SocialMedia/TabCalendar.vue:463–483` | Anterior/próximo/atual para mês, desacoplado de dashboard. Potencial para relatórios em E/M. Não substitui input de data. |
| C06 | `MaxProgressBar` | A `resources/Vue/Sections/Budget/BudgetBar.vue:1–75`, `Objective/ObjectiveBar.vue:53–98`, `Transaction/AttachmentSection.vue:8–30`; M `resources/Vue/Pages/BoardPage.vue:48–80` | Barra de tarefa ou medidor de consumo; valor visual limitado, legenda real preservada. `MaxStats` e `MaxChart` não são essa primitiva. |
| C07 | `MaxFilterBar` | A `resources/Vue/Sections/Extract/ExtractFilters.vue:1–149`; M `resources/Vue/Pages/LogsPage.vue:45–128`; E `resources/Vue/Sections/Project/ClientBills/ClientBills.vue:42` | Estrutura reutilizável de campos e ações, independente da lista. `MaxCardList` tem slot de filtros/busca/categoria próprios; o novo componente cabe nesse slot sem alterar sua API. |
| C08 | `MaxFilePreview` | E `resources/Vue/Sections/supportChat/FileUploadPreview.vue:1–108`, `Components/DocumentPreviewUpload.vue:1–48`; A `resources/Vue/Sections/Transaction/AttachmentSection.vue:33–88` | Miniatura/metadados/abertura para arquivo local ou remoto já existente. Reutiliza `MaxImage`/`MaxPdfView`; não é outro uploader. Uso potencial em artes S. |
| C09 | `MaxMarkdownViewer` | E `resources/Vue/Components/MarkdownContent.vue:1–58`; S `resources/Vue/Sections/SocialMedia/EventTabScript.vue:21–38`, `resources/Js/markdown.ts:1–30` | Leitura com apresentação e sanitização centralizadas, sem instanciar editor. `MaxInputMarkdown` é editor; renderizador Trello/editorial continua adaptável. |
| C10 | `MaxCalendar` | A `resources/Vue/Sections/Calendar/MonthGridSection.vue:45–162`; S `resources/Vue/Sections/SocialMedia/TabCalendar.vue:40–42,463–509` | Visão mensal de dias e eventos com slots, não seletor popup `MaxInputDatePicker`. Adapta dados sem fundir agregados financeiros e eventos editoriais. Não é drop-in de FullCalendar. |

### 3.3. Contratos mínimos propostos — não são APIs existentes

Tipos compartilhados novos: `MaxMonthPeriod = { year: number; month: number }` (mês 1–12); `MaxLocalDate = string` com validação efetiva `YYYY-MM-DD` e existência do dia; severidades visuais `info | success | warning | danger`. Strings de data civil não passam por `new Date('YYYY-MM-DD')` nem UTC implícito.

#### C01 — MaxAlert

- Props: `severity = 'info'`, `title?: string`, `message?: string | null`, `id?: string`, `live?: 'polite' | 'assertive' | 'off'`, `closable = false`.
- Slots: `default`, `actions`, `icon`; evento `close: []`, apenas pedido de fechamento, controlado pelo pai.
- Sem texto/título/slot útil, não renderizar caixa vazia. Texto é interpolado, nunca HTML cru.
- Danger usa `role=alert` e anúncio assertivo por padrão; demais usam `role=status` e polite. Override de `live` é explícito. Uma única região anuncia conteúdo; ícone decorativo, fechamento com nome acessível.

#### C02 — MaxQueryState

- Props: `state: 'loading' | 'stale' | 'ready-empty' | 'ready-with-data' | 'error'`, `title?`, `message?`, `retryable = false`, `retrying = false`.
- Eventos: `retry: []`; slots: `default`, `loading`, `empty`, `error`, `stale`, `actions`.
- `stale` mantém o mesmo conteúdo montado de `ready-with-data` e acrescenta aviso. Loading de revalidação não apaga dados: o adaptador mantém `ready-with-data`. Vazio só depois de consulta concluída; falha sem dados não vira vazio.
- Não derivar estado de arrays por conta própria; pai informa o estado. Retry depende do pai/MaxPinia e fica bloqueado enquanto `retrying`; rejeições e sucesso de recarga são tratados pelo status real da store, sem `await store.reload()`.

#### C03 — MaxFormValidationSummary

- Tipo novo `MaxValidationIssue`: `{ key: string; label: string; message: string; inputId?: string }`. Array já ordenado pelo consumidor; `key` único por ocorrência.
- Props: `errors = []`, `generalError?: string | null`, `title` com texto pt-BR, `focusField = true`.
- Evento `navigate: [inputId: string]`; método exposto `focusSummary(): void` para o pai chamar após tentativa inválida. Sem roubar foco automaticamente ao montar ou a cada alteração.
- Clique em erro emite intenção e, após atualização Vue, tenta focar o campo habilitado correspondente quando `focusField`. `inputId` ausente/inexistente não lança erro. Busca por ID sem interpolar seletor não confiável; respeitar movimento reduzido no scroll.
- Consumidores que precisem abrir aba/modal de forma assíncrona usam `focusField=false` e fazem navegação/foco no adaptador. Não embutir esse fluxo ou o shape Laravel no componente.

#### C04 — MaxSegmentedControl

- Tipo `MaxSegmentOption`: `{ value: string | number | null; label: string; icon?: string; disabled?: boolean }`.
- Props: `modelValue: string | number | null`, `options`, `ariaLabel: string`, `disabled = false`, `size: 'small' | 'normal' | 'large' = 'normal'`.
- Evento `update:modelValue: [value: string | number | null]`; slot `option` com opção/selecionada. Comparação estrita: `0`, `'0'` e `null` são distintos; valores repetidos são entrada inválida documentada.
- `radiogroup`/`radio`, um Tab por grupo habilitado; setas/Home/End pulam desabilitados; Space/Enter selecionam sem submissão de formulário. Seleção removida ou desabilitada devolve Tab ao primeiro habilitado sem emitir mudança automática; todos desabilitados ficam fora de Tab.

#### C05 — MaxPeriodNavigator

- Props: `modelValue: MaxMonthPeriod`, `currentPeriod?: MaxMonthPeriod`, `minPeriod?`, `maxPeriod?`, `disabled = false`, `ariaLabel = 'Selecionar mês'`.
- Evento `update:modelValue: [period: MaxMonthPeriod]`; slot `label` com período e rótulo formatado.
- Navega meses, cruza dezembro/janeiro, não altera objeto recebido. A ação “Mês atual” só existe com `currentPeriod` informado e fica desabilitada se já atual ou fora dos limites.
- Dados inválidos/limites invertidos bloqueiam ações, sem emitir período inválido. Não consultar relógio/store global; o consumidor injeta o mês atual, também para SSR determinístico.

#### C06 — MaxProgressBar

- Props: `value: number | null`, `max = 100`, `mode: 'progress' | 'meter' = 'progress'`, `severity = 'info'`, `ariaLabel: string`, `valueText?: string`.
- Slots: `label` com valor real/limitado/máximo, `details`; sem eventos de negócio.
- Limitador visual entre zero e max. `valueText`/legenda podem anunciar 130% com barra em 100%. Não calcular faixas “saudável/estourado” nem inferir meta alcançada.
- `null` significa indeterminado somente em progress, sem `aria-valuenow`; em meter significa indisponível, sem inventar valor zero. `NaN`, infinito ou max inválido resultam em estado indisponível seguro. Valor acessível numérico sempre dentro dos limites. Movimento reduzido e sem anúncios contínuos a cada frame.

#### C07 — MaxFilterBar

- Props: `ariaLabel = 'Filtros'`, `activeCount = 0`, `loading = false`, `disabled = false`, `showApply = false`.
- Slots: `default` para campos Max, `summary`, `actions`; eventos `apply: []`, `clear: []`.
- Container sem formulário próprio: pode ser inserido em um form existente sem aninhamento inválido. Limpar só aparece com filtros ativos; aplicar é opt-in para não transformar filtros instantâneos em submissão obrigatória.
- Slots recebem estado disabled/loading; os campos devem vinculá-lo explicitamente. Ações padrão usam MaxButton. Não limpar dados por conta própria, sincronizar URL, disparar HTTP, aplicar debounce global ou resetar paginação: o pai mantém essas decisões.
- Não usar esquema dinâmico de filtros neste MVP; compor `MaxGrid` e campos existentes pelo slot. Integração com `MaxCardList` por `#filters`, preservando sua busca/categoria atual.

#### C08 — MaxFilePreview

- União nova `MaxPreviewFile`: local `{ kind: 'local'; id: string; file: File }` ou remoto `{ kind: 'remote'; id: string; name: string; mimeType?: string; size?: number; url?: string; thumbnailUrl?: string }`.
- Props: `file: MaxPreviewFile`, `preview = true`, `disabled = false`; slots `metadata`, `actions`, `fallback`; eventos `open: [file: MaxPreviewFile]`, `error: [payload: { id: string; reason: 'invalid-url' | 'load-failed' }]`.
- IDs são estáveis e fornecidos pelo pai; índice/nome não são identidade. Mapeamentos de `Media`, DBFile, comprovante e URLs autenticadas ficam nos consumidores. Nada de fallback para endpoints de aplicação.
- Imagem usa MaxImage; PDF abre MaxPdfView sob demanda; arquivo sem formato conhecido usa MaxIcon e metadados. MaxUse formata bytes e gerencia object URL local. Reagir à troca de `file`/ID e liberar somente URLs criadas pela instância, nunca URLs remotas/emprestadas.
- Aceitar HTTP(S) e URLs relativas para recursos remotos; rejeitar esquemas executáveis e `data:`. `blob:` apenas gerado internamente para File local, não aceito cegamente no DTO remoto. Sem pré-carregar PDF ou baixar arquivo ao montar; tratar falha de imagem e documento.
- Upload, exclusão, download autorizado, OCR, quotas e e-mail permanecem ações do pai pelo slot; não há nova operação destrutiva.

#### C09 — MaxMarkdownViewer

- Props: `source?: string | null`, `renderMarkdown: (source: string) => string` obrigatório; evento `image-click: [payload: { src: string; alt: string }]` para URLs aprovadas. Sem alteração do texto original ou `update:modelValue`.
- O renderer é código confiável do consumidor; sua saída HTML é sempre não confiável e passa por política restrita do viewer. Erro síncrono de renderer degrada para texto escapado, sem HTML parcial não sanitizado.
- Não inventar parser próprio, instalar outro pacote ou carregar TipTap/EditorContent só para leitura. E adapta renderer Trello existente; S reutiliza seu renderer simples. Novos projetos fornecem seu renderer explicitamente.
- Política própria admite formatação, headings, listas, tabelas, links e imagens; proíbe scripts/eventos/iframe/SVG/estilos arbitrários e valida URL por contexto. Links externos com `noopener noreferrer`; imagens com alt e lazy loading. Não alargar `sanitizeHtml` global e alterar todos os seus consumidores.
- No cliente, reutilizar dependência DOMPurify instalada. Sem sanitizador seguro em SSR, escapar como texto; não usar fallback por regex. Hidratação deve manter a mesma saída segura inicial e ativar HTML sanitizado depois do mount quando necessário. Diferença de fidelidade SSR é documentada, não mascarada como sanitização equivalente.
- Centralizar tipografia/overflow e emissão acessível para imagem. Lightbox não é reimplementado: o adaptador pode compor MaxImage. Preservar clique/Esc/atributos do wrapper local numa eventual migração E, que não está autorizada neste bloco.

#### C10 — MaxCalendar

- Props: `period: MaxMonthPeriod`, `selectedDate?: MaxLocalDate | null`, `today?: MaxLocalDate`, `events = []`, `minDate?`, `maxDate?`, `disabled = false`, `ariaLabel = 'Calendário'`.
- Item novo `MaxCalendarEvent`: `{ id: string; date: MaxLocalDate; label: string; severity?: 'info' | 'success' | 'warning' | 'danger' }`. MVP de eventos associados a um dia civil, sem inferir timezone/duração.
- Eventos: `update:period: [period: MaxMonthPeriod]`, `update:selectedDate: [date: MaxLocalDate]`, `event-click: [id: string]`, `range-change: [range: { start: MaxLocalDate; endExclusive: MaxLocalDate }]`.
- Slots tipados `day` (data/seleção/hoje/eventos), `event`, `header`, `footer`. Navegação padrão compõe C05, sem duplicar eventos de navegação. Datas de outros meses não são selecionáveis no MVP; range é primeiro dia do mês até primeiro do mês seguinte, fim exclusivo, emitido uma vez no mount e por mudança válida.
- Semana inicia domingo, rótulos pt-BR; cabeçalhos de coluna reais, dias vazios ainda selecionáveis; setas/Home/End e uma parada Tab na grade, sem botões aninhados. Eventos têm alvo separado acessível. Clique em evento não seleciona dia acidentalmente. Limites bloqueiam seleção e navegação; ano bissexto e troca de mês preservam foco previsível.
- A fornece agregados por slots; S precisa adaptar `start_at/end_at/all_day` e tratar timezone na aplicação. O componente não expande recorrência nem reparte intervalos automaticamente. Troca do FullCalendar só em proposta posterior com paridade explicitamente validada.

### 3.4. Arquivos futuros

- **Novos:** `src/components/{nome}.vue` e `tests/components/{nome}.test.ts` para cada um dos dez nomes C01–C10; tipos por domínio em `src/types/feedback.ts`, `validation.ts`, `selection.ts`, `period.ts`, `progress.ts`, `filters.ts`, `filePreview.ts`, `markdownViewer.ts`, `calendar.ts`.
- **Novo de segurança específico de UI:** `src/helpers/sanitizeMarkdownHtml.ts` e seu teste em `tests/helpers/`; não modifica o sanitizador global. Validadores/seletores de datas estritamente internos podem ficar no arquivo de tipos/domínio adjacente ou helper interno, sem criar API genérica concorrente de MaxUse.
- **Testes novos propostos:** `tests/browser/ReusableComponents.browser.ts`, `tests/ssr/reusableComponents.ssr.test.ts`, `tests/ssr/reusableComponents.hydration.test.ts`, `tests/types/reusableComponents.test.ts`, `tests/benchmarks/reusableComponents.benchmark.ts`. O config de benchmark descobre `tests/benchmarks/**/*.benchmark.ts`.
- **Playground novo:** `playground/src/scenarios/reusable-components.vue`, com os dez exemplos e fixtures sintéticas; integrações de stores simuladas devem preservar a forma do contrato MaxPinia, sem rede real.
- **Existentes a atualizar:** `src/index.ts`, `src/types/index.ts`, `src/components-manifest.json`, `package.json` (somente subpaths, sem versão/deps), `playground/src/catalog.ts`, `playground/src/scenarios/index.ts`, `tests/index.test.ts`, `scripts/verify-consumers.mjs` para cobrir os exports novos.
- `vite.config.ts` já descobre os SFCs da raiz automaticamente. Não alterar sem necessidade constatada. `src/scripts/generateResolver.ts` gera o manifesto; aliases antigos permanecem. Conferir colisões dos aliases sem Max antes de regenerar; não introduzir alias que substitua resolução preexistente.

## 4. Plano de Execução Faseado

1. **Preflight por leitura:** conferir worktree, conteúdo já realizado, dependências efetivas, isolamento e avisos; confirmar APIs npm dos helpers e ausência de colisões públicas.
2. **Fundação de contratos:** congelar tipos mínimos propostos, critérios de acessibilidade e fronteiras de dados. Sem tocar consumidores.
3. **Primitivas:** C01, C04, C05 e C06 com testes; depois C02/C03/C07, respeitando suas composições.
4. **Mídia/conteúdo/calendário:** C08 e C09 com políticas de segurança próprias; C10 após C05, com slots de agregados/eventos e sem prometer paridade FullCalendar.
5. **Integração pública:** exports, subpaths, manifesto, playground, testes de tipos/SSR/browser/consumidor e benchmarks pertinentes. Implementar todo o bloco e seus testes antes de rodar gates.
6. **Validação agrupada e revisão:** executar gate completo de biblioteca uma vez no conteúdo consolidado; diagnosticar/corrigir em lote, revalidar conteúdo alterado e registrar pendências reais. Nenhuma publicação implícita.

Dependências, tarefas detalhadas, matriz de aceite e regras de retomada estão em `plan.md`.

## 5. Critérios de Aceite & Validação

1. Exatamente dez novas APIs públicas, sem equivalentes duplicados de MaxStats/MaxTable/uploads e sem breaking changes nos contratos antigos.
2. C01–C10 satisfazem seus contratos observáveis da seção 3.3 e a matriz de testes do plano.
3. Nenhum componente novo acessa stores específicas, rotas, banco, IA, cache ou APIs de aplicação. Exemplos de integração respeitam MaxPinia e usam helpers MaxUse confirmados.
4. Navegação real de teclado, foco visível, leitor de tela, redução de movimento, viewport estreita, modo dark e duas instâncias simultâneas são verificados.
5. Arquivos e Markdown tratam conteúdo não confiável; SSR não injeta HTML desprotegido; não há vazamento de object URL ou mudança de documento para resultado antigo.
6. Imports pela raiz, subpath e resolver passam com tipos; consumidor empacotado sem dependências opcionais segue utilizável conforme peers, sem novos imports PrimeVue.
7. Em Execute, o comando existente `npm run verify` é o gate completo: nomes/lockfile/SVG, tipos de fonte e testes, lint, build, testes, cobertura, navegador, bundle do playground, benchmark, consumidores, árvore npm e audit. Não executar nesta sessão Plan nem repetir seus componentes isolados sobre a mesma revisão por rotina.
8. Os cenários dos projetos reais são oportunidades de adoção, não aprovação já obtida. Aprovação de integração nos quatro projetos exige escopo/autorização posterior e compatibilidade resolvida; não declarar essa migração concluída com playground ou mocks.

### 5.1. Riscos e interrupção

- Os quatro `storage/libs/MaxComponentsUi` apontam para a árvore principal compartilhada, não esta worktree; alterações aqui não chegam automaticamente aos consumidores. Não trocar symlinks ou pins por conta própria.
- E/A declaram Pinia 3, enquanto a biblioteca pede Pinia 4. Isso impede assumir compatibilidade de instalação; não usar `--legacy-peer-deps`, remover hooks ou atualizar apps como atalho.
- `sanitizeHtml` tem fallback SSR por regex; C09 não pode reutilizá-lo como sanitização segura. O achado preexistente foi notificado, não corrigido.
- Seleção local M pode perder a parada Tab se a opção selecionada se tornar desabilitada. Não copiar esse comportamento para C04; correção do consumidor é separada.
- Escopo mensal de C10 não cobre tudo que FullCalendar faz. Adaptadores de timezone, intervalo e metadados pertencem às aplicações; nenhuma migração automática.
- Se faltar helper npm necessário, registrar notificação `max-use-<helper>.md` no destino autorizado e propor contrato separado; não editar MaxUse local nem contornar o contrato de distribuição.
- Sem decisões abertas bloqueantes para estas recomendações. As APIs acima são propostas revisáveis, não compromissos existentes ou autorização de implementação.
