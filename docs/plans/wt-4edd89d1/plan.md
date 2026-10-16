# Plano de execução — impedir fechamento por arraste em MaxModal e MaxDrawer

## 1. Identificação e autorização

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada 1.1.7.
- Worktree/branch: `wt-4edd89d1`, derivada de `dev` conforme informado pelo usuário.
- Raiz obrigatória: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-4edd89d1`.
- Especificação: `docs/plans/wt-4edd89d1/spec.md`, elaborada antes deste plano.
- Estado desta entrega: **planejamento; implementação e validação de runtime não executadas**.

O usuário relatou que selecionar texto dentro do MaxModal/MaxDrawer e soltar o mouse fora fecha o painel. O resultado solicitado é corrigir esse fechamento acidental, sem remover o fechamento legítimo por clique fora.

Esta sessão só autoriza escrever spec, plano e notificações nos destinos indicados. A sessão Execute depende de autorização posterior. Não criar outra worktree, trocar branch, fazer commit/merge/push ou remover esta worktree. O painel MaxCode/usuário controla integração e limpeza.

## 2. Objetivo, requisitos e preservações

### Comportamento esperado

| ID | Requisito |
| --- | --- |
| R1 | Arraste iniciado em qualquer conteúdo do painel e terminado na máscara não fecha MaxModal nem MaxDrawer. Inclui seleção em input, textarea e texto comum. |
| R2 | Interação ignorada não aciona `beforeClose`, `before-close`, eventos de fechamento, alteração da pilha ou tremor do modal. |
| R3 | Clique primário iniciado e terminado diretamente na máscara continua seguindo `dismissable`; ocorre uma única intenção de fechamento. O próximo clique direto funciona depois de um arraste ignorado. |
| R4 | Arraste inverso, iniciado na máscara e terminado dentro do conteúdo, também não é considerado clique fora. |
| R5 | Escape, botão, APIs, modelos, `beforeClose`, foco, scroll, ARIA e pilha do MaxModal preservam seus contratos. |
| R6 | Cancelamento, perda de foco da janela, conteúdo que interrompe propagação, slot `container`, múltiplas instâncias e reabertura não deixam a guarda incoerente. |
| R7 | Seleção/arraste com mouse real é validada no Chromium usando os componentes reais; Happy DOM sozinho não comprova o defeito corrigido. |
| R8 | Não criar nova API pública, store ou dependência; conservar cliques programáticos isolados existentes sem permitir que eles anulem uma sequência observada como inválida. |

### Fora de escopo e restrições

- Não desativar `dismissable` por padrão, não mudar `closeOnEscape` nem implementar nova política de empilhamento de drawers.
- Não alterar hooks assíncronos de fechamento ou corrigir defeitos independentes neles.
- Não remodelar visual, estilos, classes, slots, foco, rolagem ou posições.
- Não migrar `useModalStore` para MaxPinia: seu contrato deve permanecer. O estado privado de um gesto DOM não é um novo fluxo de Get/cache/salvamento. Qualquer nova camada de dados, se um requisito futuro a exigir, deve usar MaxPinia e terá escopo separado.
- Usar MaxComponentsUi nas fixtures integradas (incluindo MaxInputText); helpers reutilizáveis devem vir do MaxUse. Nenhuma dependência PrimeVue ou referência `file:`/local é permitida.
- Não instalar/atualizar pacotes nem alterar árvore principal/dependências compartilhadas. Bloqueios de ambiente exigem isolamento/autorização específica, não atalhos.

## 3. Investigação e evidências para retomada

### Fluxo atual

1. **MaxModal:** `src/components/MaxModal.vue:8–30` teleporta máscara e painel para `body`; máscara trata clique com `.stop` e o painel bloqueia propagação. Em `331–338`, o handler exige topo da pilha, aplica `dismissable` e chama `requestClose('backdrop')`. Em `235–325`, o pedido centraliza veto, espera e eventos. Não registrar o ponto de pressão permite interpretar um clique retargetado à máscara como ação externa.
2. **MaxDrawer:** `src/components/MaxDrawer.vue:2–22` teleporta máscara com `@click.self`; `189–205` emite `update:visible=false` quando permitido. Slot `container` substitui todo o painel padrão; por isso a correção não pode depender exclusivamente de `panel_el`.
3. **Estado:** `src/stores/useModal.Store.ts` fornece pilha e topo. A correção precisa apenas preservar o estado, não editá-lo diretamente.
4. **Testes existentes:** `tests/components/MaxModal.test.ts` contém testes de `.trigger('click')`, retenção, hooks, pilha, scroll e foco. `MaxDrawer.test.ts` usa `.click()` na máscara e verifica que a prop controlada não é mutada. Preservar esses testes e suas asserções; acrescentar sequências, sem substituir tudo por chamadas a handlers privados.
5. **Harness:** `vitest.config.ts` usa Happy DOM e dedupe de Vue/Pinia/VueUse. `vitest.browser.config.ts` executa Chromium headless, inclui `tests/browser/**/*.browser.ts`, já possui `commands.setPageScaleFactor` e dedupe. `tsconfig.test.json` inclui `tests/**/*`. `tests/browser/MaxFocusStack.browser.ts` é referência de montagem/limpeza, não cobertura dos componentes reais deste defeito.
6. **Helpers:** `src/composables/useBrowserEventListener.ts` fornece ciclo de vida/SSR para listeners existentes de Escape. MaxUse instalado exporta `useEventListener` e `onClickOutside`; manter Escape como está e usar MaxUse para eventual listener novo de janela.
7. **Input real:** `src/components/MaxInputText.vue` recebe `modelValue`, renderiza `.max-input-native` e expõe input/foco. É adequado para a fixture de seleção. Não modificar esse componente.

### Semântica e escolhas

A MDN documenta o clique no ancestral comum quando pressão e soltura atingem elementos distintos. Como a máscara é ancestral do painel, trocar apenas `.stop` por `.self` não elimina o problema. A documentação do Vue confirma a captura antes de listeners internos e a importância da ordem dos modificadores.

**Proposta técnica:** estado transitório local da sequência de ponteiro e verificação de início/fim, observados na máscara em captura, antes de executar os handlers atuais de clique. Não fechar antecipadamente, não impedir seleção nativa e não usar timers. A regra detalhada está na seção 3 da spec.

**Alternativas descartadas:** desativar clique fora; fechar em `pointerdown`; aplicar somente `.self`; substituir por listener global `onClickOutside`; criar helper público/migrar store. Essas alternativas removem funcionalidade, não identificam a origem ou ampliam desnecessariamente o escopo.

### Ambiente e limitações confirmadas

- Raiz/branch conferidas por leitura. `git status --short` estava vazio antes da documentação.
- `.gitignore` já ignora `.worktrees/` e `.max-code-worktrees/`.
- `node_modules` aponta para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`. Isso é compartilhamento observado, não licença para escrita externa nem evidência de dependências quebradas.
- Versões instaladas observadas: Vue `3.6.0-rc.10`, Vitest/provider `4.1.11`, MaxUse `1.1.47`, VueUse `14.4.0`.
- MaxPinia está declarado como peer opcional e não foi encontrado no caminho de pacote instalado consultado. Não há necessidade de usá-lo neste ajuste puramente DOM; não instalar só para este plano.
- Não foram rodados testes, type-check, lint, build, servidores, prehooks ou scripts do projeto. Não foi demonstrada reprodução visual nesta sessão.
- Fonte oficial Vitest consultada via Context7 foi 4.1.6, a versão 4.1.x disponível na consulta; validar os tipos efetivos da 4.1.11 antes de adicionar o comando.
- Não foi feita auditoria de segurança ampla, e não foram identificados segredos na investigação dirigida.

## 4. Etapas executáveis

### T1 — Readmissão e preflight por leitura

**Entradas:** este plano, spec e `AGENTS.md`. **Escrita prevista em Execute:** registro de progresso autorizado, não código funcional ainda.

1. Confirmar que a sessão Execute tem autorização e está na raiz/branch indicadas. Não mover nem investigar outras worktrees.
2. Conferir status e diff locais. Preservar trabalho existente e localizar implementação parcial antes de repetir tarefas. Se o conteúdo factual mudou, revalidar evidências pertinentes.
3. Reler scripts atuais de `package.json` e prehooks pertinentes, configurações Vitest, setup e resolução de dependências. Conferir identidade efetiva de Vue/Pinia e, para o setup de rede, Axios, sem importar módulos com efeitos colaterais durante a inspeção.
4. Verificar destinos de caches/artefatos de Vite, Vitest, cobertura e build. A dependência compartilhada não pode ser modificada incidentalmente: se cache/otimização escrever fora da worktree, interromper até haver forma suportada e autorizada de isolamento. Não criar cópias ad hoc de `.env`, alterar symlink compartilhado nem instalar pacotes.
5. Confirmar que as fixtures não dependem de banco, storage, cache remoto ou filas e que o setup mantém Axios/ícones sem chamadas involuntárias. Se aparecer dependência externa não isolada, bloquear a validação correspondente.
6. Conferir os tipos instalados dos comandos do provider: documentação descreve `context.iframe` e `commands` de `vitest/browser`, enquanto a configuração existente usa `context.provider.getPage(context.sessionId)`. Não presumir equivalência sem leitura.

**Saída/critério:** arquivos e contratos continuam válidos; nenhuma escrita compartilhada ou serviço externo é necessário. Registrar bloqueio com próxima ação concreta se não houver isolamento. Gate de integridade de biblioteca falhado bloqueia checks dependentes; não contornar por comando direto, `ignoreConfig` ou remoção de prehook.

### T2 — Lote de correção e testes unitários dos dois componentes

**Arquivos:** `src/components/MaxModal.vue`, `src/components/MaxDrawer.vue`, `tests/components/MaxModal.test.ts`, `tests/components/MaxDrawer.test.ts`.

1. Adicionar observação em captura de `pointerdown` e `pointerup` nas máscaras, sem wrappers e sem filtrar descendentes com `.self` nessa observação.
2. Usar registro privado por instância com ponteiro/origem/término e estado inválido/cancelado. Aceitar como fechamento físico somente sequência primária correspondente iniciada e terminada diretamente na máscara.
3. Acrescentar a guarda ao clique antes de todos os efeitos existentes. Preservar `.stop` do modal e filtragem de alvo do drawer. Limpar/consumir de forma síncrona no clique; não apagar a origem antes de a decisão ocorrer.
4. Preservar cliques isolados com `detail=0` em estado neutro. Um clique sintético associado ao arraste simulado nos testes deve continuar bloqueado: a origem observada tem precedência. Não criar bypass por `isTrusted`.
5. Invalidar cancelamentos e perda de foco da janela; garantir novo gesto limpo, reset ao ocultar e descarte ao desmontar. Para listener adicional de janela, reutilizar `useEventListener` do MaxUse, sem acesso inseguro a `window` no setup SSR.
6. Manter exatamente as funções finais existentes: `requestClose('backdrop')` no modal e `close()` no drawer. Não mexer nos métodos expostos, estado da store ou veto assíncrono.
7. Acrescentar regressões de sequência realista: pressão no input/descendente → soltura na máscara → clique com alvo máscara. Não basta pressionar e soltar no mesmo elemento e esperar que Happy DOM faça retargeting.
8. Cobrir também máscara → conteúdo → clique no ancestral; clique direto subsequente; `dismissable=false`; ausência de hook/tremor/emissões no arraste; topo da pilha; cancelamento; reabertura; ponteiros incompatíveis e conteúdo com eventos interrompidos. Validar slot `container` do drawer com conteúdo próprio.
9. Ao acrescentar mounts no drawer, desmontá-los explicitamente no cleanup da cobertura nova, sem transformar o arquivo inteiro em refatoração de testes.
10. Manter ordem template/script/style, recuo base de quatro espaços no script e tags de abertura alteradas em uma linha. Não editar CSS por conveniência.

**Saída/critério:** as duas implementações e todos os testes locais do lote estão escritos; efeitos esperados e ausentes têm asserções. Não rodar suíte/tipos/build entre microedições.

### T3 — Regressão de seleção com mouse real

**Arquivos:** novo `tests/browser/MaxOverlayBackdropGesture.browser.ts` e existente `vitest.browser.config.ts`. Depende de T1; implementação da fixture é independente de T2, mas validação depende do lote completo.

1. Criar fixture no próprio teste com `createApp`, Pinia e componentes reais MaxModal, MaxDrawer e MaxInputText. Usar dados fictícios, nome acessível e texto longo no input. Não criar página de produto nem alterar playground.
2. Para o drawer, ligar `visible` a um `ref` atualizado pelo evento do componente; para o modal, usar um modo de controle já suportado. Espionar contadores de intenção/hook e conferir estado visível, não só existência durante transição de saída.
3. Adicionar à configuração um novo comando **proposto** `dragOverlaySelection`, preservando comandos existentes. Tipar via `BrowserCommand`/`BrowserCommands` conforme versão instalada e declarar os tipos do comando no próprio arquivo de teste quando suficiente.
4. O comando deve localizar entrada e máscara no iframe de teste, obter coordenadas verificadas e usar o mouse real da página Playwright: mover → pressionar botão primário → mover em passos até ponto diretamente sobre a máscara → soltar. Coordenadas do iframe precisam ser compatíveis com o espaço da página; usar os bounding boxes fornecidos pelo provider. Verificar que o destino realmente é máscara, não painel.
5. Liberar o botão em `finally` mesmo se falhar. Usar seletores/argumentos limitados à fixture e não oferecer execução arbitrária de JavaScript como comando. Esperas automáticas/limitadas para montagem e transição, sem polling agressivo ou sleeps fixos como prova de correção.
6. Assegurar que a seleção efetiva tem extensão maior que zero (`selectionEnd > selectionStart`) e valor intacto, que o painel segue aberto, sem intenção/hook. Repetir para ambos; input próximo de borda facilita uma seleção que termine fora.
7. Validar clique direto normal após o arraste, um fechamento apenas, e o arraste inverso. O clique de aceite deve ser físico, não `.click()` DOM. Para modal com veto, verificar que clique direto chama hook com razão `backdrop` e pode manter aberto.
8. Garantir desmontagem da app, liberação do mouse, remoção do host e restauração das condições globais/foco/scroll. Não retirar a política de console do setup.

**Saída/critério:** teste reproduz gesto de seleção real nos dois componentes. Dispatch manual de PointerEvent no Chromium é útil para casos de borda, mas não substitui esta evidência física. Se o provider impedir esse comando, registrar bloqueio e resolver o harness antes do aceite; não reduzir silenciosamente a força da prova.

### T4 — Revisão do lote, validação e correções agrupadas

**Dependências:** T1–T3 concluídas. **Escrita:** correções causais no escopo e registro de resultados reais.

1. Revisar diff do lote: início/fim em captura, estado privado, SSR, cleanup, slots e manutenção das chamadas finais de fechamento. Revisão independente é recomendada neste marco por envolver descarte de formulário; não criar revisão por microedição.
2. Executar os gates abaixo só depois de implementar todo o escopo e testes. Antes, reconfirmar prehooks e isolamento de artefatos. Todas as execuções ocorrem dentro da worktree.

| Ordem | Comando existente | Finalidade |
| --- | --- | --- |
| 1 | `npm run check:filenames` | Integridade de nomes rastreados. |
| 2 | `npm run check:lockfile` | Integridade das dependências declaradas, sem bypass se falhar. |
| 3 | `npm run test` | Suíte unitária completa, incluindo os dois arquivos alterados. |
| 4 | `npm run type-check:test` | Tipagem de testes e declaração do comando. |
| 5 | `npm run lint` | ESLint e Stylelint sem autofix global. |
| 6 | `npm run build` | Já executa `vue-tsc` e build Vite. Não repetir `npm run type-check` sobre o mesmo conteúdo sem motivo concreto. |
| 7 | `npm run test:browser` | Suíte Chromium, incluindo seleção física e regressões existentes de foco. |

3. Diagnosticar falhas agrupadas de harness/bootstrap/console antes de repetir testes equivalentes. Falhas anteriores não causadas pelo lote não autorizam corrigir baseline ou desativar asserções; registrar localização, evidência sanitizada e impacto como notificação.
4. Corrigir as falhas causais em um lote. Reexecutar checks invalidados pela mudança; reaproveitar resultados ainda válidos e registrar sua revisão factual. Falha repetida sem progresso exige investigação da causa, não repetição cega.
5. Não executar cobertura/benchmarks/consumidores apenas por hábito para um ajuste de eventos sem nova API. Se a revisão revelar impacto nesses contratos, justificar e ampliar validação pertinente antes do aceite. `npm run verify` é gate completo obrigatório antes de eventual pré-release, fora desta solicitação; se autorizado mais tarde, executá-lo em vez de repetir seus componentes isolados na mesma revisão.

**Saída/critério:** todos os gates aplicáveis vigentes aprovados, ou pendências/falhas explícitas sem conclusão total. Não executar `release`, `prerelease`, `npm version`, `npm publish`, commit ou integração Git.

### T5 — Aceite manual, revisão final e handoff

1. Em ambiente isolado com o playground já suportado (`npm run dev:playground`, somente se necessário e autorizado em Execute), testar input/textarea/texto longo com soltura externa nos lados disponíveis. Nenhuma mudança no playground é necessária por padrão.
2. Conferir drawer left/right/top/bottom e modalidade não modal; `full` não tem máscara livre e deve manter seleção interna. Não mudar tamanhos/posições de produção para produzir o teste.
3. Conferir toque simples fora, rolagem interna e cancelamento; mouse real Chromium é o gate automatizado disponível. Firefox/Safari não estão configurados: fazer verificação manual quando houver acesso, sem instalar browsers nesta tarefa. Na falta de ambiente, registrar a verificação correspondente como `manualPending` com próxima ação concreta.
4. Rever o diff final contra R1–R8 e a matriz abaixo. Conferir que nenhuma mudança externa, segredo, API nova ou refatoração adjacente entrou no lote.
5. Registrar progresso/checks reais, resultados, revisão, arquivos e pendências; preservar worktree e não integrar. Só declarar entrega integral quando os gates previstos estiverem concluídos.

## 5. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência exigida | Testes pertinentes | Revisão pelo risco | Verificação manual |
| --- | --- | --- | --- | --- |
| T1 / ambiente | Resolução e isolamento documentados; prehooks lidos | Gates de integridade antes de testes dependentes | Não escrever em dependências compartilhadas ou serviços | Resolver acesso/ambiente se bloqueado |
| T2 / R1–R2 | Nenhuma intenção, hook, tremor ou pop por arraste interno | Unitários nos dois componentes: pressão interna, soltura/click na máscara | Guarda antes de qualquer efeito de fechamento | Selecionar input, textarea e texto |
| T2 / R3–R4 | Clique direto fecha uma vez; arraste inverso não fecha; gesto seguinte funciona | Sequências diretas/inversas e repetidas | Não fechar no down/up; não reaproveitar gesto | Clique direto após selecionar |
| T2 / R5 | Contratos públicos e políticas existentes conservados | Testes existentes + beforeClose com razão `backdrop`, topo e `dismissable=false` | Não alterar store/hook nem ampliar política do drawer | Escape, botão e veto |
| T2 / R6,R8 | Estados locais descartados; clique programático neutro preservado | Cancelamento, stopPropagation, reabertura, container e instâncias distintas | SSR/listeners/ponteiros incompatíveis | Perda de foco e novo clique |
| T3 / R7 | Mouse físico gerou seleção e painel ficou aberto em ambos | Novo teste browser, clique físico subsequente e inverso | Coordenadas do iframe, cleanup e captura do gesto real | Toque/rolagem e outros navegadores disponíveis |
| T4 / R1–R8 | Comandos reais com resultado e revisão vigente | Suítes, tipos, lint e build da tabela | Revisão final do diff e falhas causais | Sem warnings novos |
| T5 / entrega | Estado/handoff honesto; nenhum gate pendente oculto | Reaproveitar checks vigentes | Não declarar conclusão total com falha ou pendência | `manualPending` se houver lacuna |

## 6. Riscos, compatibilidade e recuperação

- **Regressão de fechamento legítimo:** neutralidade e consumo do gesto exigem testes do primeiro clique subsequente e de `.click()`/`.trigger('click')` existentes.
- **Cancelar tarde demais ou limpar cedo demais:** não limpar em `pointerup` antes do clique; não permitir que clique sintético anule origem interna. Testar estados cancelados e novos gestos.
- **Slot customizado:** medir origem na máscara, não exigir o ref do painel padrão. Não adicionar wrappers que alterem CSS/slots.
- **Dispositivos de toque/captura implícita:** não usar captura forçada nem inferir seleção real a partir de eventos sintéticos; testar taps e rolagem e registrar limitações.
- **Perda de dados:** o defeito pode interromper edição, mas não se comprovou perda persistente. Não inventar autosave como parte da correção.
- **Desempenho:** poucos listeners sem loop de `pointermove` na implementação de produção, estado constante por instância; sem observer global de todos os elementos.
- **Ambiente compartilhado:** artefatos/caches podem escapar pela resolução de `node_modules`; interromper execução insegura antes de escrever. Não corrigir isso incidentalmente alterando outras worktrees.
- **Recuperação:** nenhuma migração nem dado persistente. Em Execute, eventual reversão deve ser seletiva e autorizada, limitada às próprias alterações; jamais reset/checkout amplo ou descarte de trabalho alheio. Não reintroduzir o defeito como atalho de validação.
- **Operação:** nenhuma implantação, comunicação com fornecedor, credencial externa ou publicação é necessária para validar esse contrato DOM.

## 7. Retomada e registro de execução

Na primeira admissão, ler plano e spec; nas retomadas, consultar apenas as tarefas e decisões relevantes, conferir trabalho já realizado e executar lacunas. Não reabrir decisões sem evidência nova ou mudança do requisito. Preservar instruções locais e resultados vinculados ao conteúdo factual atual.

Durante **Execute**, registrar marcos e handoff em `docs/plans/wt-4edd89d1/execution-state.json`. **Não criar esse arquivo nesta sessão Plan.** Usar o esquema estrito version 2 do executor, sem inventar campos adicionais. Vincular ao SHA256 real do `plan.md` salvo e às revisões factuais das tarefas/arquivos; hashes devem derivar dos bytes reais, nunca de rótulos como “final”. Não improvisar esquema incompatível se o contrato do executor não estiver acessível.

Regras obrigatórias do registro:

- Tarefas identificáveis T1–T5, estado e arquivos; estados permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- `verification` no formato `{ revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`, com revisão real do conteúdo correspondente.
- Resultado de validação/check somente `passed`, `failed` ou `pending`; `blocked` não é resultado de validação.
- `passed` exige código de saída 0; `failed` exige inteiro não zero; `pending` não aceita `exitCode`. Não inferir exit code a partir de `tool:end.ok`.
- Comandos de até 4.096 caracteres, somente se realmente executados. Registrar todas as falhas, inclusive suíte completa; não apagar evidências para aparentar aprovação.
- Motivos e próxima ação concreta em `nextAction`, até 512 caracteres; proibidos campos adicionais `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`.
- Checks vazios, ausência de resultado vigente ou falha vigente impedem validação integral. Version 1 existente é compatível, mas não comprova validação integral automaticamente. Registro autodeclarado não prova execução nativa nem ausência de verificações omitidas.
- Para execução assíncrona, aguardar evento de conclusão/mudança com limite e recuo; sem consultas repetidas de status sem informação nova. Cancelamento mantém progresso parcial e pendência explícita.

Execução sequencial é suficiente para esse ajuste. Se uma sessão futura usar múltiplos executores autorizados, T2 escreve apenas nos quatro arquivos dos componentes/unitários e T3 apenas no teste browser/configuração; T1 e T4–T5 pertencem ao integrador. Fornecer contexto mínimo, referências aos documentos e contratos, sem releitura integral obrigatória por microetapa. Nenhum teste/tipo/build deve rodar enquanto executores ainda escrevem o lote.

## 8. Revisão do plano e estado de entrega

- Proposta concreta identificada: corrigir origem do fechamento em dois componentes; não é necessária entrevista adicional.
- Spec exigida por múltiplos arquivos e etapas, salva antes deste plano.
- Solução restringe a ação acidental sem retirar os meios de fechamento existentes nem alterar aparência/dados.
- Arquivos existentes e novos estão diferenciados; dependências T1 → lote T2/T3 → T4 → T5 estão explícitas.
- R1–R8 têm evidência de aceite e revisão de risco; execução real, navegador e checks futuros não são apresentados como aprovados.
- Notificação do defeito em `docs/notifications/wt-4edd89d1/notifications/max-components-ui-fechamento-por-arraste.md`.
- Nenhuma implementação, teste, serviço, instalação ou operação de integração foi executada nesta sessão.

### Fontes

- Código e configurações listados na seção 3 e manifesto `package.json:556–582`.
- https://vuejs.org/guide/essentials/event-handling.
- https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event.
- https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/browser/commands.md.
