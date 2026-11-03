# MaxIcon: requisições em lotes de até 5 ícones sem duplicação

## 1. Identificação e autorização

- Data: 03/11/2026.
- Projeto: `@maxvue/max-components-ui`, versão declarada `1.1.36`.
- Worktree e branch: `wt-4c799d8e`.
- Diretório exclusivo: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-4c799d8e`.
- Revisão investigada: `c01e00d204c66970bcd93cb29837aab6f979749f`; working tree inicialmente sem alterações.
- Esta sessão autoriza somente este plano. Implementação, testes e registro de execução ficam para Execute autorizado. Não criar outra worktree, trocar branch, instalar dependências, commitar, integrar, publicar ou limpar a worktree.

## 2. Objetivo, escopo e preservação

Dividir os ícones pendentes em múltiplas requisições com no máximo 5 nomes por chamada e controlar o ciclo de cada ícone para impedir chamadas duplicadas. Exemplo de aceite: 12 nomes distintos sem cache, todos resolvidos na API principal, geram 3 GETs com tamanhos `5, 5, 2` e cada nome aparece apenas uma vez.

Incluído: agendamento e processamento de lotes na store compartilhada, reserva de nomes durante requisição/fallback, escoamento de novos itens, regressões de cache, falha e descarte; verificação com instâncias reais de MaxIcon.

Preservar:
- Contrato público da store: `getIcon`, `icons_data`, `list_icons_waiting_request`, `saveCache`, `debouncedSaveCache`; `getIcon` retorna SVG ou `null` de forma síncrona.
- Estados públicos atuais: chave ausente, `'waiting'`, SVG sanitizado e `''` terminal. Não mudar o formato de `icons_data` para objetos de status.
- GET principal com parâmetros repetidos `icons[]` e resposta por nome; rotas de `getMaxAppConfig()` e prioridades de `iconServer`, `routeIcons`, `routeIconsFallback`, `routeIconsSync`.
- Fallback individual por SVG, sanitização antes de exibir/persistir e POST de sincronização não bloqueante. POST com um ícone mantém `icon`, `svg` e `icons`; com vários mantém `icons`.
- Cache IndexedDB, migração do localStorage legado, persistência incremental e tolerância a erro de storage.
- Debounce de 50 ms, maxWait de 150 ms, limites atuais de 4 falhas de transporte/4 tentativas por ícone ausente e reset de transporte após 30 s. Tentativa legítima após falha não é duplicação.
- Props, aliases, estilos, classes, tamanhos e comportamento visual de MaxIcon; getter de SVG puro e solicitação apenas ao montar/mudar nome.

Excluído: backend, novo endpoint de lote, migração de cache, correção da corrida preexistente entre hidratação assíncrona e entrada em waiting, timeouts novos, deduplicação entre abas ou instâncias Pinia distintas, refatoração geral de stores, alteração de dependências e release. O limite de 5 é de itens por chamada, não de quantidade de chamadas concorrentes.

## 3. Evidências e viabilidade

| Arquivo inspecionado | Comportamento relevante |
|---|---|
| `src/stores/useIcon.Store.ts` | Linhas 178–289 selecionam todos os pendentes elegíveis, reservam em `inFlightIcons` e fazem um único GET sem limite. A reserva já cobre fallback e é removida em finally. `queueTrigger` reativa pendentes. |
| `src/components/MaxIcon.vue` | Usa a store compartilhada; watcher explícito solicita o nome e computed apenas lê `icons_data`. Não há transporte no componente. |
| `src/helpers/iconIdb.ts` | Banco `max_icons_db`, store `icons`; leitura e gravação sanitizadas, persistência incremental e degradação sem IndexedDB. |
| `src/helpers/maxAppConfig.ts` | Configuração central dos endpoints e overrides; não alterar para implementar lotes. |
| `tests/stores/useIcon.Store.test.ts` | Casos de reserva concorrente, descarte, retry/backoff, fallback, rotas e POST agrupado com 2/3 ícones. Falta cobertura de mais de 5 e de lotes concorrentes com respostas fora de ordem. |
| `tests/stores/useIconStore.test.ts` | Estados públicos, nomes inválidos, trim, cache e terminal preservado. |
| `tests/components/MaxIcon.test.ts` | Watcher sem realimentação pelo cache, troca de prop e múltiplas instâncias terminais. |
| `tests/browser/MaxIconRetry.browser.ts` | Teste real Chromium com MaxIcon/MaxButton, quatro ciclos e página interativa; estender sem enfraquecer esse caso. |
| `tests/architecture/icon-server-consumer.test.ts` | Consome `dist`, verifica isolamento/configuração de consumidores; exige build prévio e cria somente fixtures sintéticas locais. |
| `tests/setup.ts`, `tests/helpers/indexedDbTestUtils.ts` | Fetch e localStorage simulados; IndexedDB em memória disponível. Isolar e descartar stores/timers nos novos testes. |
| `package.json`, `vitest.config.ts`, `vitest.browser.config.ts`, `.gitignore` | Scripts reais, configuração Chromium, caminhos ignorados e gates. `npm test` já inclui build. |
| `src/stores/useUser.Store.ts` e referência local `vue-max-ecosystem-api-reference/references/maxpinia.md` | MaxPinia é plugin do boot consumidor; user store opta por ele via `isCached`/`options`. A store de ícones atual não opta pelo plugin. |

Ambiente observado por leitura: Node `v24.18.0`, npm `12.2.1`; `node_modules` é link para dependências da raiz. Vitest, vue-tsc, ESLint e MaxUse estão disponíveis; `@maxvue/max-pinia/package.json` não está disponível. Diretório de cache Playwright existe, mas a disponibilidade do executável Chromium não foi comprovada. Não houve testes, build nem chamadas aos servidores de ícones. Não se presume baseline verde.

### Aplicação das diretrizes de frontend

Usar os próprios MaxIcon e demais MaxComponentsUi nos cenários; helpers continuam vindo de MaxUse, inclusive `watchDebounced`. Não introduzir biblioteca de batching: pequenos slices nativos bastam.

MaxPinia permanece a camada de GET/salvamento/cache das telas consumidoras, registrada no boot, sem criar uma store de tela paralela. Este ajuste é na infraestrutura interna já compartilhada de ícones: preservar o transporte/cache especializado e a compatibilidade com consumidores sem o peer opcional. Não ativar `isCached` ou auto-save nessa store apenas para marcar status: isso introduziria um segundo executor/cache e mudaria o contrato fora do pedido. Se a obrigatoriedade de MaxPinia for estendida à migração dessa infraestrutura, obter autorização específica antes dessa ampliação; o plano não apresenta a store atual como sendo MaxPinia.

Referência externa consultada: documentação Pinia `v4.0.3`, `packages/docs/core-concepts/plugins.md` via Context7: plugins dependem do registro no Pinia/app antes da criação da store. A versão instalada de cada dependência deve ser conferida no Execute; faixas do package.json não comprovam instalação.

## 4. Solução proposta e contratos internos

1. Definir uma constante privada de tamanho máximo igual a 5 na store. Não adicionar prop ou configuração pública.
2. Manter o snapshot de pendentes elegíveis: nomes em `'waiting'` que não estejam no `Set` de requisições ativas. Dividir em fatias não vazias de até 5, preservando a ordem de entrada.
3. Reservar sincronamente todos os nomes do snapshot antes de iniciar os transportes, sem await entre seleção e reserva. O Set existente é a fonte de verdade do status em andamento; não criar mapa redundante com risco de divergência.
4. Extrair o processamento existente para uma função assíncrona privada por lote, com snapshot próprio e try/catch/finally. Disparar os lotes independentemente, sem await serial no laço e sem rejeições não tratadas. Isso evita que um fallback lento bloqueie ícones de outros lotes; não introduzir limite de concorrência adicional.
5. Cada GET usa exclusivamente os nomes do seu lote. Processar apenas essas chaves na resposta; não incorporar chaves extras não solicitadas. Cada fluxo tem seus próprios deltas de persistência, ausentes e recuperados.
6. Manter a reserva até finalizar a leitura/sanitização e os fallbacks daquele lote. Uma resposta principal incompleta não libera o ícone antes do fallback; novos getIcon/watchers não podem disparar outra tentativa dele nesse intervalo.
7. Persistir sucessos incrementalmente; sincronizar recuperados por lote. Como todo lote possui até 5, cada POST derivado também terá até 5 entradas. Fallback já carrega apenas um ícone por chamada e não precisa de API nova. Não recombinar recuperados de lotes diferentes em um POST maior.
8. No finally, liberar somente nomes pertencentes ao lote; em store ativa, reavaliar pendentes elegíveis e sinalizar `queueTrigger` conforme o orçamento existente. Novos nomes durante requisições devem escoar sem esperar um lote alheio e sem duplicar nomes reservados.
9. Manter `errors.fetch` global: cada conclusão atualiza como hoje (sucesso zera, falha incrementa), na ordem efetiva de conclusão. Ao atingir o limite, bloquear novos despachos, não descartar lotes já iniciados; o reset existente permite retomada. Não mudar para contador por lote nem usar número de ícones como número de falhas.
10. Respeitar `isDisposed` em toda continuação assíncrona, não agendar fila, persistir, sincronizar ou mutar estado após descarte. Não adicionar cancelamento/timeout novo nesta mudança.

Transições conceituais, sem alterar dados públicos: ausente → waiting elegível → waiting reservado → SVG pronto; ausência não recuperada → waiting elegível para retry ou `''` terminal no limite atual. O status em voo não é persistido. A garantia de deduplicação vale por store Pinia e por tentativa ativa, não para as tentativas de recuperação intencionais.

## 5. Etapas e matriz de aceite

Executar sequencialmente no mesmo worktree. Escrever implementação e todos os testes do bloco antes da validação em lote; não validar após cada microedição.

| Tarefa | Requisito/arquivos | Testes pertinentes | Evidência de conclusão |
|---|---|---|---|
| T1 — Preflight por leitura | Conferir branch/status, arquivos deste plano, scripts, dependências e navegador. Não tocar em node_modules compartilhado, .env ou serviços. | Inspeção de configs e recursos; nenhuma chamada de API real. | Ambiente/revisão reais registrados; limitações impedem declarar gates aprovados. |
| T2 — Lotes e ciclo de requisição | `src/stores/useIcon.Store.ts`; adicionar casos em `tests/stores/useIcon.Store.test.ts`. Aplicar seção 4 sem mudar exports. | Tamanhos 0, 1, 5, 6, 10 e 12; contar só GET principal. Para sucesso sem cache: `ceil(N/5)` chamadas, 1–5 nomes por chamada e união exata sem repetição. | 12 itens resolvidos em 5/5/2; nenhum lote vazio e nenhuma perda de nomes. |
| T3 — Concorrência e recuperação | Mesmo teste de store; manter casos públicos de `tests/stores/useIconStore.test.ts`. | Promises controladas para fetch/json/fallback; chegada de nomes novos e repetidos durante voo; respostas fora de ordem; reatividade antes de resolver; falha HTTP/rede e JSON inválido; resposta parcial/SVG rejeitado; falha do POST. | Cada nome tem no máximo uma tentativa ativa; fallback não abre janela de duplicação; sucesso de um lote não é revertido por outro; POSTs têm no máximo 5 ícones; retries continuam limitados conforme políticas atuais. |
| T4 — Integração e fechamento | `tests/components/MaxIcon.test.ts` e `tests/browser/MaxIconRetry.browser.ts`; produção de `MaxIcon.vue` deve permanecer intacta salvo necessidade comprovada no contrato. | Montar mais de 5 nomes distintos e várias instâncias repetidas, capturar chamadas e verificar SVGs renderizados; manter interação MaxButton e retry terminal. Descartar store com múltiplos lotes pendentes. | Todas as instâncias recebem SVG correto sem multiplicar GETs; após dispose não há novos efeitos; gates da seção 6 registrados com revisão. |

Complementos obrigatórios nos testes de T3: cache já presente não dispara GET; nome terminal não reabre fila; snapshots de lotes são disjuntos; quatro falhas bloqueiam novos despachos e reset de 30 s retoma fila; lotes já iniciados podem terminar durante bloqueio. Em sucesso/falha mistos, controlar explicitamente ordem de resolução e conferir a semântica global, sem asserções dependentes da velocidade da máquina.

Usar timers falsos/avanço limitado e promises resolvidas pelo teste para concorrência, evitando loops infinitos de runAllTimers diante de retries. Restaurar timers, fetch, configuração global e fechar stores no teardown. Não mockar a própria store nos testes de integração. Os fallbacks de mocks devem falhar localmente para URL inesperada, nunca delegar a rede real. Isolar IndexedDB com os utilitários existentes e, no navegador, usar contexto/cache de teste isolado; não limpar dados de consumidores.

## 6. Validação em lote

Somente no Execute autorizado, com cwd na worktree. Os comandos abaixo correspondem aos scripts/configurações inspecionados:

```bash
npm run type-check
npm run type-check:test
npm run lint
npm test
npm run test:browser -- tests/browser/MaxIconRetry.browser.ts
```

`npm test` executa build e suíte unitária/arquitetural completa sobre a mesma revisão; não repetir build ou testes unitários isolados sem alteração/falha que justifique. O teste arquitetural usa dist produzido nesse comando. O teste Chromium continua necessário porque watcher/debounce reais não são comprovados pelo mock de watchDebounced da suíte da store.

Corrigir falhas relacionadas em lote e revalidar somente os gates afetados. Investigar causalidade antes de corrigir baseline fora do escopo. Se Chromium não estiver disponível, registrar pendência e solicitar preparação autorizada; não instalar navegador/dependências silenciosamente. A instalação compartilhada não pode ser modificada pela sessão.

Não executar `npm run verify` como rotina deste ajuste: é gate de pré-release, agrega tipos/lint/build/testes/cobertura/browser/benchmarks/consumidores/auditoria. Se uma futura autorização exigir release, executar o gate completo sem repetir seus componentes na mesma revisão. Nenhuma publicação está autorizada por este plano.

## 7. Riscos e operação

- Dividir um GET em vários aumenta o número de chamadas e expõe conclusões fora de ordem. Por isso snapshots, reservas e contadores devem ter testes controlados; não alterar política global de falha silenciosamente.
- Um finally que remova todo o Set ou libere nomes antes do fallback reabre duplicações. Remover somente o snapshot correspondente.
- O watcher deep também reage a erros e à fila: reservar antes de disparar e reavaliar elegibilidade em cada ciclo; não chamar getIcon no computed visual.
- Cache é dado local do navegador; sem mudança de banco, versão, schema ou migração. Não persistir estados transitórios novos, não enfraquecer sanitizeSvg e não enviar SVG não sanitizado ao backend.
- Nenhum acesso a banco/backend real é necessário. Configurações e testes usam dados sintéticos; não copiar .env nem expor tokens. Corrida de hidratação preexistente não deve ser confundida com regressão do batching.
- MaxPinia não instalado limita comprovação com plugin real; a mudança não deve torná-lo obrigatório para MaxIcon nem alterar boot de aplicações fora deste repositório. Migração dessa infraestrutura exige escopo/autorização próprios.

## 8. Retomada e registro no Execute

Na admissão, ler este plano e AGENTS.md, verificar trabalho já feito e mudanças desde a revisão investigada; reler trechos alterados e não sobrescrever trabalho alheio. Reutilizar decisões e autorização do bloco sem pedir aprovação por microalteração. Manter a worktree com integração pendente para o MaxCode.

Durante Execute, após marcos e no handoff, registrar `docs/plans/wt-4c799d8e/execution-state.json`. **Não criar este arquivo no Plan Mode.** Confirmar no executor o contrato version 2 estrito antes da primeira escrita. Referência encontrada nos planos versionados desta worktree, em particular `docs/plans/wt-2e1ae3c1/plan.md:226–238`:

- Raiz somente `{version: 2, planRevision, tasks, verification, updatedAt?, nextAction?}`; planRevision é SHA256 real dos bytes deste plano; updatedAt, se usado, inteiro positivo em milissegundos.
- Tarefas T1–T4 com `{id, status, files, validations, revision?, nextAction?}`; files relativos, validations obrigatório, inicialmente `[]`. Não inventar formato para itens de validations sem consultar schema do executor.
- Status permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- `verification` somente `{revision, checks}`; checks somente `{command, revision, result, exitCode?}`. Comandos reais da seção 6; resultados `passed`, `failed`, `pending`. Passed exige exitCode 0; failed exige inteiro não zero; pending sem exitCode.
- Revisões de tarefa/verificação são SHA256 reais de conteúdo factual, com conjunto de arquivos e ordenação determinísticos, sem incluir o próprio registro circularmente. Não substituir por branch, HEAD ou rótulos.
- command até 4096 caracteres e nextAction até 512; registrar razões e próximas ações ali, sem campos extras. Não usar schemaVersion nem status/checks soltos na raiz.
- Não declarar validação integral com checks vazios, falhas vigentes ou navegador pendente. Registrar saídas reais, incluindo falhas e revalidações; alterações relevantes invalidam evidências afetadas.

## 9. Revisão do plano

Escopo limitado à store e regressões: lotes até 5, múltiplas chamadas e reserva por ícone cobertos. API pública, fallback, cache e retries preservados. Não há exigência de backend novo nem criação de configuração. O limite de itens foi separado de concorrência e de retries intencionais. Ambiente e ausência de validações estão explícitos; nenhuma implementação foi executada nesta sessão.
