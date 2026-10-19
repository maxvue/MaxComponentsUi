# Plano de execução — impedir repetição ilimitada na busca de ícones

## 1. Identificação e autorização

- Data: 19/10/2026.
- Projeto: `@maxvue/max-components-ui` 1.1.20.
- Worktree/branch: `wt-a13d5b54`, derivada de `dev`.
- Diretório único de execução: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-a13d5b54`.
- SHA investigado: `89f2f0a4125c8c035116cfcde34f02d25840c492`.
- Especificação elaborada antes deste plano: [spec.md](./spec.md).
- Pedido: corrigir a repetição de `Erro na obtenção do ícone iconmind:log-level-duotone-thin` que termina travando a página.
- Público afetado: aplicações consumidoras de `MaxIcon` e da store pública de ícones, especialmente telas com muitas instâncias.

**Esta sessão é somente Plan.** Foram autorizadas apenas spec, plano e notificações nos diretórios desta worktree. Não houve implementação, execução de testes, instalações ou chamadas aos serviços de ícones. A futura implementação depende de autorização de Execute. Não criar outra worktree, trocar branch, commitar, integrar, fazer push/publicação ou remover esta worktree; essas operações cabem ao MaxCode/usuário.

## 2. Diagnóstico fundamentado

### Fatos observados por leitura

| Evidência existente | Observação relevante |
|---|---|
| `src/stores/useIcon.Store.ts:69–77, 220–224` | `getIcon()` considera `''` um cache ausente; o limite de quatro falhas grava exatamente `''`, permitindo reenfileiramento posterior |
| `src/components/MaxIcon.vue:163–174` | `watchEffect()` chama a action que lê o estado reativo; o getter visual já é puro |
| `src/stores/useIcon.Store.ts:168–259` | Watch profundo de fila/erros, debounce 50 ms/maxWait 150 ms; não reserva requisições em andamento |
| `src/stores/useIcon.Store.ts:192–201` | String não sanitizável ainda executa `continue` e limpa erro; não é tratada como ausência |
| `src/stores/useIcon.Store.ts:83–97, 232–255` | Limite global de quatro falhas de transporte, pausa/reset de 30 segundos e fallback também no catch |
| `src/helpers/iconIdb.ts` | Cache IndexedDB `max_icons_db`/`icons`, versão 1, sanitização na leitura e gravação; falhas degradam sem lançar |
| `src/helpers/sanitizeSvg.ts` | Retorna `SanitizedSvg` ou `''`; esta barreira não pode ser contornada |
| `src/helpers/maxAppConfig.ts:21–23` | URLs configuráveis principal, fallback e sync; não são rotas Ziggy neste fluxo especializado |
| `src/stores/index.ts` | Store é exportada publicamente no entry de stores |
| `tests/stores/useIcon.Store.test.ts` | Cobre erros, fallback, rotas customizadas, backoff e POST em lote; teste de ausência manipula a fila e não monta `MaxIcon` |
| `tests/stores/useIconStore.test.ts` | Contratos de retorno síncrono, nome válido/trim, fila e debounce de persistência |
| `tests/stores/useIconStore.cache-sanitize.test.ts` | Usa jsdom; preserva `'waiting'` e `''` do legado, além da sanitização |
| `tests/components/MaxIcon.test.ts` | Testa props/estilos, mas não o esgotamento com o componente real e falhas persistentes |
| `vitest.config.ts`, `tests/setup.ts` | Ambiente happy-dom padrão, alias/dedupe Vue e Pinia, fetch simulado e política de console |
| `vitest.browser.config.ts`, `tests/browser.setup.ts` | Chromium via Playwright; inclui `tests/browser/**/*.browser.ts`; setup pode simular sucesso de URLs contendo `icons` |
| `tests/browser/MaxButtonSlim.browser.ts` | Padrão existente de `createApp`, Pinia e teardown em navegador |
| `tests/helpers/consolePolicy.ts` | Erros esperados precisam de asserções explícitas; silenciar console genericamente não valida o reparo |
| `tests/helpers/indexedDbTestUtils.ts` | Factory IndexedDB em memória e reset de conexão disponíveis para isolamento |
| `package.json`, `package-lock.json` | Scripts reais de qualidade; MaxUse 1.1.47 e Vue 3.6.0-rc.10 no lockfile; MaxPinia peer opcional |
| `.gitignore:68–69` | `.worktrees/` e `.max-code-worktrees/` já ignoradas |

### Interpretação, propostas e limites

- A combinação de sentinela falsy, efeito amplo e fila reativa explica um caminho de repetição compatível com o relato. A proteção precisa estar na store, pois há consumidores além do componente.
- O travamento no consumidor e o status real do ícone não foram reproduzidos. Não afirmar que o nome é inválido nem que o serviço está fora do ar. A correção deve funcionar independentemente da razão de ausência.
- A busca literal pelo nome em `src` não encontrou referência. Não mudar nenhum nome de ícone neste repositório para mascarar o problema.
- Documentação consultada: `https://vuejs.org/guide/essentials/watchers.html` e `https://vuejs.org/api/reactivity-core.html`, via Context7. `watch` acompanha fontes explícitas; `watchEffect` acompanha leituras síncronas. São documentos gerais do Vue 3, não prova de comportamento específico da RC instalada; testes reais devem confirmar.
- Foram inspecionados o manifesto instalado e declarações de MaxUse, que fornecem os helpers utilizados. O subpath opcional `@maxvue/max-use/vueuse` aponta para um arquivo ausente na instalação observada; registro separado em notificação. Não é prova de falha do entry raiz usado aqui nem de defeito do pacote publicado.
- `node_modules/@maxvue/max-pinia/package.json` não estava disponível. Não há evidência de defeito no MaxPinia. `useUser.Store.ts` documenta sua integração como plugin da aplicação. Este reparo não cria nova store/GET de página: mantém a store especializada existente e sua compatibilidade, sem tornar obrigatório um peer opcional ou instalar biblioteca.
- Um guia auxiliar da skill de depuração não estava disponível no caminho indicado; o diagnóstico se apoia no código, nos testes e na documentação oficial consultada.

## 3. Resultado esperado e decisões propostas

### Requisitos funcionais

1. Ícone esgotado permanece sem SVG e fora de novos ciclos na mesma instância da store, mesmo com chamadas repetidas, remontagens ou reset de rede.
2. No cenário principal OK sem SVG utilizável + fallback sem SVG válido, manter quatro ciclos por nome e apenas uma mensagem terminal `Erro na obtenção do ícone` por esgotamento.
3. Principal inválida após sanitização deve tentar fallback e participar do mesmo orçamento; nunca reiniciar silenciosamente o contador.
4. Uma só execução principal/fallback por nome de cada vez; diferentes nomes continuam progredindo e não sobrescrevem sucessos alheios.
5. Falha de transporte conserva o orçamento global e recuperação após 30 segundos. Não transformar indisponibilidade transitória da principal em cache negativo definitivo.
6. O componente solicita somente na criação e na mudança do nome efetivo; leituras/escritas internas da store não viram novos gatilhos.
7. Depois do descarte da store, não há efeitos tardios de rede sobre estado, cache, sync, logs ou agendamento.

### Contratos e comportamentos a preservar

- API da store e representação do mapa: SVG, `'waiting'` e `''`; leitura terminal retorna `null`.
- Fila pública continua listando `'waiting'`; reservas ficam privadas.
- Cache, migração, sanitização, rotas configuráveis, sucesso parcial, agrupamento do GET e do POST, payload de compatibilidade para uma entrada e tolerância à falha de sync.
- Props, precedência `i`/`icon`, cores, layout, tooltip e subícones. Não redesenhar a interface nem criar placeholder novo.
- Usar componentes desta biblioteca e helpers MaxUse existentes. Não adicionar camada paralela de GET/save/cache ao MaxPinia nem migrar seu contrato no consumidor. Não importar PrimeVue, remover classes legadas ou alterar dependências.

### Solução escolhida para a proposta

- Reconhecer a entrada própria `''` antes de enfileirar. Não apenas remover o log ou aumentar o número de retries.
- Trocar `watchEffect` por `watch(icon_name, callback, { immediate: true })`, mantendo o computed visual puro.
- Reservar nomes selecionados em conjunto interno por instância antes de qualquer operação assíncrona. Filtrar por reserva/orçamento e liberar em `finally`, inclusive no catch, somente depois do fallback.
- Garantir um agendamento com debounce após liberação quando ainda houver trabalho elegível; não perder pedidos recebidos durante o ciclo. Não criar loop de polling ou timer para reviver terminal.
- Atualizar resultados sobre o estado atual por nome, sem substituir tudo por snapshot obsoleto. Integrar principal/fallback aos mesmos pontos de sucesso/ausência, evitando duplicação de contagem, cache e POST.
- Preservar o reset global de rede. Terminal não participa dessa recuperação; uma nova store é a fronteira proposta para tentar novamente um ícone esgotado. Não persistir cache negativo.
- Adicionar proteção de descarte aos callbacks/timers, reaproveitando `onScopeDispose`. Não introduzir API pública de cancelamento ou timeout nesta correção.

**Alternativas descartadas:** esconder apenas `console.error` não para a rede; trocar o nome relatado não corrige outros ícones; retry ilimitado com mais atraso não estabelece estado terminal; persistir ausência/TTL alteraria cache e recuperação; migrar toda a store para outra infraestrutura amplia o escopo sem necessidade.

## 4. Execução futura por etapas

### T1 — Preflight por leitura e confirmação de contratos

**Arquivos:** nenhum arquivo de produção deve ser escrito nesta etapa.

1. Ler este plano e a spec na primeira admissão. Confirmar raiz, branch, SHA e `git status`; investigar trabalho prévio antes de editar e preservar alterações de terceiros.
2. Reler somente trechos relevantes do `AGENTS.md`, scripts do `package.json`, configs Vitest e setup. Conferir prehooks atuais antes de executar qualquer comando; os comandos agregados podem já incluir gates.
3. Conferir libs e symlinks efetivos de Vue, Pinia, MaxUse e Axios. Não apontar dependências para outra worktree/pacote irmão nem resolver com `file:`. Confirmar identidade única Vue/Pinia no harness; Axios não é o transporte desta store, mas seu adapter global no browser não substitui mocks de `fetch`.
4. Confirmar isolamento do IndexedDB e localStorage por caso. Em Node usar factory em memória/reset de conexão ou mocks locais dos helpers; no browser usar contexto/origem de teste exclusivos. Não apagar storage de aplicação real. Não há banco servidor, filas ou anexos envolvidos; testes não devem passar a depender deles.
5. Confirmar que todas as requisições principal/fallback/sync do cenário serão interceptadas. Não copiar `.env`, instalar dependências, executar migrações/reset, chamar endpoint externo nem modificar node_modules para desbloquear o harness.
6. Revalidar o achado de subpath MaxUse. Não o consumir; se uma verificação de integridade aplicável falhar, bloquear validação dependente e registrar próxima ação, sem bypass por comando direto, ignoreConfig ou remoção de prehook.

**Conclusão:** contratos e ambiente suficientes para implementar sem nova dependência; impedimentos reais registrados. Ausência do peer opcional MaxPinia não justifica inventar integração executada.

### T2 — Implementar o lote funcional e testes completos

**Depende de:** T1 e autorização Execute. **Responsável de escrita:** um executor para store, componente e testes, evitando conflitos.

1. Alterar `src/stores/useIcon.Store.ts` conforme a máquina de estados da spec: sentinela estável, orçamento correto, reserva, liberação e continuidade de fila. Preservar debounce, maxWait, rotas e política global de rede.
2. Tratar string rejeitada pelo sanitizador como ausência, sem limpar erro até receber SVG válido. Cobrir resultado misto: válido, ausente e rejeitado no mesmo lote.
3. Centralizar conclusão por nome; contar somente um ciclo de ausência após principal utilizável como resposta HTTP/JSON e fallback fracassado. Falhas HTTP/JSON/rede da principal seguem o contador global e fallback de transporte. Emitir log de ausência só na transição terminal.
4. Aguardar/acompanhar o fallback também no caminho de erro antes de liberar a reserva. Garantir que sucesso não seja rebaixado a `'waiting'` ou `''` por resultado anterior.
5. Impedir efeitos após descarte, incluindo a conclusão tardia da leitura de cache e respostas de rede. Limpar timers novos/existentes sem alterar o esquema persistente.
6. Alterar `src/components/MaxIcon.vue` para `watch` da fonte explícita. Manter template e estilos salvo necessidade estrita comprovada; conservar ordem template/script/style, indentação base de quatro espaços e tags de abertura em linha única.
7. Atualizar `tests/stores/useIcon.Store.test.ts`: substituir simulação artificial de retries por avanço determinístico da política real. Expectativas antigas de log a cada falha precisam refletir log terminal único, sem enfraquecer asserções de orçamento.
8. Acrescentar em `tests/stores/useIconStore.test.ts` o contrato terminal, incluindo chamadas repetidas sem mutação da fila. Preservar sanitização/migração nos testes existentes, atualizando `useIconStore.cache-sanitize.test.ts` somente se necessário.
9. Atualizar `tests/components/MaxIcon.test.ts` para montar o componente real com Pinia real, dependências locais controladas e nome relatado. Testar remontagem, várias instâncias, troca de `i`/`icon` e mudanças de cache sem nova action pelo mesmo nome.
10. Criar `tests/browser/MaxIconRetry.browser.ts`, seguindo o padrão de montagem/teardown existente. Usar `MaxIcon`, `MaxButton` e um campo nativo apenas como instrumentação de teste, não como novo componente de produto. Sobrescrever localmente o fetch de sucesso do setup para principal ausente/fallback 404; interceptar também sync, sem rede real.
11. Usar temporizadores controlados e promises diferidas nos testes de store; incluir ao menos um cenário com `watchDebounced` real de MaxUse, pois o mock antigo não representa maxWait nem reatividade integral. Não usar espera ilimitada ou `runAllTimers` com backoff recorrente.
12. Cobrir resposta lenta, alteração da fila durante fallback, resposta fora de ordem, descarte com promises pendentes e retomada da rede. Restaurar timers, fetch/config, desmontar componentes, descartar Pinia e isolar IDB em teardown.

**Conclusão:** todo o bloco e seus testes escritos antes das validações. Não executar suíte/tipos/build após cada microedição. Revisar por leitura o lote e comunicar o marco.

### T3 — Revisar e validar o lote

**Depende de:** T2 concluída; nenhuma implementação concorrente em andamento.

1. Revisar o diff por transições, budgets, concorrência, segurança e compatibilidade pública. Quando houver outro revisor disponível/autorizado, fornecer apenas spec, este plano e diff, concentrando revisão independente nesses riscos e na entrega; não criar ciclos por microedição.
2. No Execute, executar `npm run check:lockfile` antes de validações dependentes. Não contornar falhas; diagnosticar por leitura e solicitar autorização se o reparo necessário exceder este escopo.
3. Executar o conjunto abaixo uma vez sobre a revisão completa, capturando resultado e código de saída reais de cada comando. Se optar pelo `npm run verify` por exigência de release, não repetir suas partes isoladas e preservar todos os gates dele.

```bash
npm run test
npm run type-check
npm run type-check:test
npm run lint
npm run build
npm run test:browser
```

4. Corrigir falhas causalmente relacionadas em lote; reexecutar checks afetados somente após concluir as correções. Reaproveitar verificações aprovadas quando a revisão correspondente não mudar. Não corrigir baseline sem estabelecer causalidade e autorização.
5. Falha repetida sem progresso exige diagnóstico agrupado de bootstrap, mocks, identidade Vue/Pinia, temporizadores e isolamento antes de repetir testes equivalentes. Não desabilitar política de console, asserts ou sanitização.
6. Testes de segurança devem rodar em jsdom ou navegador real, não confiar apenas em happy-dom. Contagens de console/rede precisam de asserções explícitas; ausência de travamento sozinha não comprova orçamento correto.

**Conclusão:** resultados vigentes registrados, sem afirmar validação integral se algum check faltar/falhar. `npm run verify` completo fica reservado ao gate de pré-release, com cobertura, consumidores, benchmark, integridade e segurança, quando esse escopo for autorizado.

### T4 — Aceite observável e entrega

**Depende de:** T3 aprovada para a mesma revisão.

1. Em Chromium local isolado, montar várias instâncias do nome relatado com respostas controladas: principal OK sem SVG e fallback 404. Confirmar quatro ciclos totais por nome, uma mensagem terminal e interface ainda interativa.
2. Após terminal, remontar componentes, solicitar outro ícone válido e observar uma janela finita de pelo menos 35 segundos: o nome terminal não faz novas requisições/logs; o válido aparece. Automatizar o avanço de 30 segundos em testes de store; observação em tempo real não deve virar polling de status.
3. Simular principal indisponível, verificar pausa após quatro falhas, restaurar respostas válidas e confirmar recuperação após 30 segundos. Separar esse resultado do cenário de ausência terminal.
4. Se houver acesso autorizado à tela consumidora original, verificar a mesma interação em homologação, sem gravar segredos e sem forçar POSTs de sync em produção. Sem acesso, registrar `manualPending` para essa confirmação externa e próxima ação concreta; mocks não comprovam existência do ícone no fornecedor. A disponibilidade real do nome não é requisito para o reparo de tolerância à falha.
5. Entregar arquivos alterados, resultados, limitações e pendências. Não afirmar que o incidente no consumidor foi reproduzido/resolvido externamente sem essa evidência. Preservar worktree e alterações para o MaxCode.

## 5. Matriz de aceite por tarefa

| Tarefa/requisito | Evidência exigida | Testes pertinentes | Revisão por risco / manual |
|---|---|---|---|
| T1 — integridade/isolamento | Paths e versões efetivos, mocks sem saída de rede e IDB exclusivo; check de lockfile vigente em T3 | Harness existente, leitura dos setups | Interromper dependência se integridade falhar; não resetar dados reais |
| T2 — terminal estável | `''`, `getIcon() === null`, fila sem nome, contagens constantes após repetição/remontagem/35 s simulados | Store e componente real, nome `iconmind:log-level-duotone-thin` | Conferir que falha não persiste em IDB e nova store pode tentar |
| T2 — orçamento/logs | Quatro principais + até quatro fallbacks no cenário controlado; um log terminal por nome; nenhum POST por falha | Store com fake timers e console assertado | Browser confirma ausência de tempestade de logs/rede |
| T2 — concorrência/progresso | Uma execução por nome, novos nomes não esquecidos, resposta atrasada não apaga sucesso | Promises diferidas, dez instâncias, lotes mistos e ordem invertida | Revisão do `finally`, reserva antes do await e agendamento de saída |
| T2 — SVG rejeitado/segurança | Principal rejeitada tenta fallback; sem XSS, persistência ou sync de conteúdo rejeitado | jsdom e regressões de sanitize/cache | Inspecionar todos os caminhos de sucesso antes de `v-html` |
| T2 — compatibilidade | SVG válido aparece, rotas e payloads preservados, POST consolidado e falha de sync tolerada | Casos existentes de cache, fallback e configuração | Não alterar API, props, exports ou dependências |
| T2 — transporte/descarte | Pausa global e recuperação funcionam; terminal fica terminal; descarte não gera efeitos tardios | Fake timers, fallback no catch, promises pendentes e `$dispose()` | Conferir limpeza de timers e leitura IDB tardia |
| T3 — qualidade do lote | Códigos de saída reais, checks da revisão atual e falhas documentadas | Suíte completa, tipos, lint, build e browser | Sem bypass ou correção não autorizada de baseline |
| T4 — interface utilizável | Cliques/campo funcionam depois de terminal; ícone válido independente aparece | Novo teste Chromium com componentes reais | Homologação original somente com acesso; caso contrário `manualPending` explícito |

## 6. Riscos, operação e recuperação

- **Terminal excessivo:** reservar `''` para ausência esgotada, não para falha temporária da principal. Não persistir a ausência; recriar a store permite nova tentativa sem migração ou exclusão de dados.
- **Fila perdida:** qualquer guarda de execução precisa de agendamento ao finalizar; incluir teste que recebe novo nome enquanto fallback está pendente.
- **Sobreposição/estado antigo:** snapshot define nomes pedidos, não deve ser reaplicado como estado completo após await. Contagens por nome e resultados precisam ser idempotentes por ciclo.
- **Rede completamente fora:** a política global pode continuar tentando em janelas de 30 segundos; isso é recuperação limitada, não o loop rápido do incidente. Não declarar zero requisições para sempre nesse cenário.
- **Requisição que nunca resolve:** a deduplicação deve impedir multiplicação para aquele nome sem bloquear nomes independentes. Timeouts gerais de transporte são melhoria separada; não assumir garantias que o fetch atual não fornece.
- **Harness enganoso:** mock global retorna sucesso, `MaxIcon` tem stub global e suites antigas substituem debounce. Os novos cenários precisam usar o componente real e respostas efetivamente fracassadas, além do helper real em ao menos um teste.
- **Segurança:** manter sanitização, validação de nome e informações de console sem novos dados sensíveis. Não chamar serviços reais para testar fallback/sync.
- **Recuperação operacional:** não há alteração de dados/esquema. Reversão futura deve remover apenas as alterações deste reparo com revisão e autorização, preservando trabalho alheio; nunca reset amplo, limpeza de storage real ou remoção da worktree.
- **Achados separados:** notificações de loop da biblioteca e export opcional MaxUse estão em `docs/notifications/wt-a13d5b54/notifications/`. O segundo não integra a implementação deste reparo.

## 7. Registro de execução e retomada

Somente em Execute, registrar marcos e handoff em `docs/plans/wt-a13d5b54/execution-state.json`; **não criar esse arquivo nesta sessão Plan**.

- Novos registros devem seguir estritamente a versão 2 do esquema nativo do MaxCode, sem campos extras. Usar o validador/esquema disponibilizado pelo executor; não inventar uma estrutura JSON alternativa.
- Vincular o registro ao SHA256 real do conteúdo de `plan.md` e às revisões factuais das tarefas/arquivos. Revisões são hashes reais de conteúdo, nunca nome de branch, rótulo ou descrição.
- Registrar tarefas, estado, arquivos e `nextAction` de até 512 caracteres. Status de tarefa: `pending`, `running`, `completed`, `blocked`, `manualPending` ou `validationFailed`.
- Não adicionar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`; razões e ações cabem em `nextAction`.
- Verificação usa `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`, nos locais definidos pelo esquema. Comandos até 4.096 caracteres. Resultado de validação/check somente `passed`, `failed` ou `pending`; `blocked` é status de tarefa, não resultado.
- `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não admite exitCode. Registrar apenas comandos efetivamente executados e todas as falhas, inclusive da suíte completa. `tool:end.ok` não comprova aprovação nem código de saída.
- Checks vazios, sem resultado vigente ou com falha vigente impedem validação integral. Version 1 permanece compatível, mas não prova validação integral automaticamente. Registro autodeclarado não comprova execução nativa nem detecta verificações omitidas.
- Nas retomadas, conferir trabalho já realizado, diff e hashes; consultar trechos pertinentes em vez de reler tudo. Reutilizar checks válidos, executar lacunas e seguir dependências sem reabrir decisões sem evidência nova.
- Se houver delegação futura autorizada, passar contexto mínimo e referências; paralelo somente para arquivos de escrita distintos. T2 permanece coeso; não rodar gates enquanto implementação estiver em andamento.
- Para execução assíncrona, aguardar conclusão/mudança com espera limitada e recuo, sem consultas repetidas sem informação nova. Cancelamento mantém resultados parciais e próxima ação; bloqueio/manualPending não permite conclusão total.

## 8. Revisão final do planejamento

- Pedido atendido no escopo proposto: parar a realimentação de falhas, não apenas esconder o erro.
- Spec anterior ao plano, arquivos existentes diferenciados do teste browser novo e nenhuma dependência/serviço inventado.
- Comportamentos preservados explicitamente: API, props, segurança, cache, fallback, sync e recuperação de rede.
- Decisões de terminal e log são propostas revisáveis; não foram deduzidas como desejo do usuário apenas por existirem no código.
- Dependências T1 → T2 → T3 → T4 e critérios observáveis permitem retomada por outra sessão.
- Nenhuma pergunta indispensável permanece: disponibilidade real do nome não bloqueia planejar tolerância à ausência.
- Validações e aceite externo estão planejados, não executados. Só documentos autorizados foram escritos; nenhum estado de execução foi criado.
