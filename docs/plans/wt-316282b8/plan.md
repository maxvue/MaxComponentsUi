# Plano de execução — Corrigir end-mobile no MaxGrid

## 1. Identificação e autorização

- Data: 15/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree/branch: `wt-316282b8`.
- Diretório obrigatório: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-316282b8`.
- Especificação: [spec.md](./spec.md).
- Estado desta sessão: investigação e planejamento apenas. Nenhum código, teste, configuração ou serviço foi modificado; nenhuma suíte foi executada.
- Este plano não autoriza implementação agora, instalação, troca/criação de worktree, commit, merge, push ou publicação. Execute depende da autorização correspondente do usuário.

## 2. Problema, resultado e preservação

O usuário relata que `s4-max-end-mobile` e `s4-max-mobile-end`, em itens internos do `MaxGrid`, não tornam o item o último da linha. Corrigir as duas grafias para que, no mobile, o próximo item seja colocado em nova linha mesmo se houver espaço restante.

Usuários afetados: aplicações consumidoras que organizam campos/componentes com `MaxGrid` e os tokens `s` do preset.

### Requisitos

- R1: `end-mobile` e `mobile-end` são equivalentes; suportar classe e atributo com as regras de ativação existentes.
- R2: ativar somente em `(max-width: 767.98px)`, com atualização ao cruzar a faixa, sem reload.
- R3: manter dimensionamento e cascata existentes. `max` é teto, não largura obrigatória; não empurrar o próprio item para nova linha por confundir `end` com `start`.
- R4: preservar quebras legadas sem dispositivo, Fragments, aninhamento, conteúdo, eventos, `v-model`, labels, flags e gaps.
- R5: não criar wrappers só por haver um marcador mobile inativo; tokens sem direção continuam apenas dimensionando.
- R6: documentar o novo suporte sem prometer suporte responsivo mais amplo.

### Limites confirmados e escolhas propostas

- Confirmado pelo pedido: somente encerramento mobile; duas ordens de sufixo; worktree já alocada; sem implementação nesta sessão.
- Proposta técnica: extensão pontual do organizador existente com booleano mobile derivado pelo MaxUse. Não mudar o preset, pois ele já aceita e gera corretamente essas variantes.
- Preservar fora do pedido: `start-mobile`, `tablet` e `desktop` permanecem sem quebra estrutural. Não substituir breakpoints existentes nem usar os `768/1024` de `useSystemStore` como equivalentes.
- Não criar store MaxPinia, chamadas API, helpers novos, dependência PrimeVue ou refatoração geral. Não há fluxo de dados/Get/salvamento/cache a acrescentar.
- Não editar planos históricos de outras tarefas, artefatos de distribuição nem exemplos vizinhos do playground.

## 3. Evidências investigadas

| Arquivo existente | Evidência e consequência |
|---|---|
| `src/components/MaxGrid.vue:1-46` | Renderiza `GridSlotRows`; wrappers já têm largura integral, flex-wrap e gap herdado. Pode passar contexto sem mudar API pública. |
| `src/components/base/gridSlotRows.ts:17,69-108` | Regex não aceita dispositivo; classes usam `normalizeClass`; atributos ativos são `''`, `true`, `'true'`. |
| `src/components/base/gridSlotRows.ts:116-173` | Função pura particiona VNodes em linhas; componente funcional chama essa função. Sem marcadores retorna nós originais. Não há outros chamadores em `src`. |
| `src/presetMaxUno.ts:84-117` | Aceita ambas as ordens; mobile é `767.98px`; `break-after` sozinho não quebra flexbox. Fórmulas devem permanecer. |
| `tests/components/MaxGrid.test.ts` | Cobre quebras legadas, condicionais, Fragments, aninhamento e `MaxInputNumber` real. Acrescentar, não substituir asserções. |
| `tests/preset/presetMaxUno.generate.test.ts:163-236` | Já cobre CSS responsivo e rejeita modificadores conflitantes; faltam os dois tokens exatos relatados. |
| `tests/browser/maxGridLineBreaks.browser.ts` | Já mede geometria, gap e input real. Caso responsivo existente usa guards em `page.viewport`; novos casos não podem pular validação silenciosamente. |
| `vitest.browser.config.ts:9-35` | CSS virtual gerado por lista explícita de tokens. Acrescentar os novos casos para não testar sem CSS real. |
| `tests/setup.ts`, `tests/browser.setup.ts`, `vitest.config.ts` | Unitários em happy-dom; setup browser cria Pinia e usa adapter Axios simulado. Nenhuma configuração global de `matchMedia` encontrada no setup unitário. |
| `COMPONENTS.md:1208-1217`, `docs/THEME.md:214-265` | Documentam a limitação atual; revisar somente o contrato afetado e regex/exemplos relacionados. |
| `playground/src/scenarios/layout-grid.vue:9-10` | Nota vigente afirma que todas as quebras com dispositivo são ignoradas; corrigir sem alterar dados do exemplo. |
| `tests/architecture/playgroundCoverage.test.ts:135-155` | Protege exemplos legados e não admite `s7-end-mobile` no bloco atual; não é necessário mudar esse teste ao corrigir apenas a nota. |
| `package.json:556-582` | Scripts reais de testes, lint, tipos, build e verify; build já inclui vue-tsc. Não há pretest/prebuild declarados nesse bloco. |
| `.gitignore:68-69` | `.worktrees/` e `.max-code-worktrees/` já ignoradas. |

### Ambiente e documentação externa

- Raiz e branch conferidas por `git rev-parse --show-toplevel` e `git branch --show-current`; status inicial limpo.
- `node_modules` é symlink para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`, portanto não é isolado da árvore principal. Nenhuma dependência foi alterada.
- MaxUse instalado: `1.1.47`; reexporta `useMediaQuery` por `dist/Helpers/VueUse/index.d.ts` e pelo entry principal. VueUse instalado: `14.4.0`.
- `node_modules/@vueuse/core/dist/index.js:1285-1314` confirma consulta a `matchMedia`, estado reativo, evento `change` e tratamento de ausência da API. Consultada também documentação oficial via Context7 sobre `useMediaQuery`/SSR/cleanup; o resultado foi da documentação corrente, não uma garantia de versão fixada. Código instalado prevalece para assinatura efetiva.
- MaxPinia não estava instalado no caminho verificado; é peer opcional em `package.json:683-685`. Não é, isoladamente, defeito ou motivo para instalação: esta mudança não cria store.
- Não foi investigada a aplicação consumidora do usuário nem a versão que ela efetivamente carrega. Correção no fonte não prova que a aplicação já recebeu o pacote corrigido.
- Achado separado, sem correção neste escopo: [estados demonstrativos sem contrato](../../notifications/wt-316282b8/notifications/max-components-ui-estados-layout-grid.md).

## 4. Solução técnica executável

### T1 — Preflight por leitura e isolamento

1. Ler `AGENTS.md`, spec e plano na primeira admissão. Nas retomadas, consultar os trechos pertinentes, sem releitura integral compulsória.
2. Confirmar raiz/branch, estado Git e eventuais alterações posteriores. Não sobrescrever trabalho alheio ou limpar worktree pelo terminal.
3. Revalidar os arquivos citados; conferir scripts, hooks, versões, symlinks e configurações reais antes de implementar contratos dependentes.
4. Antes de validar, confirmar que caches Vite/Vitest, build, relatórios e temporários não escrevem pela ligação de `node_modules` na árvore principal. Não instalar ou remover dependências nesse symlink. Se não houver estratégia isolada já autorizada, bloquear as validações dependentes e solicitar preparação segura do ambiente, sem improvisar bypass.
5. Confirmar resolução única de Vue/Pinia e identidade Axios do harness: as configs declaram dedupe e o setup browser configura um adapter, mas isso não comprova todos os imports transitivos. Não permitir rede real de fixtures.
6. Não copiar `.env`, não executar migrations/resets nem usar banco/cache/filas/storage compartilhados. Não são necessários para esta correção. Se um script exigir integridade prévia, falha no gate bloqueia suas dependências, sem ignorar configuração ou prehook.

Conclusão: ambiente compreendido e saídas das validações isoladas, ou pendência objetiva registrada. Nada disso foi executado como testes nesta sessão Plan.

### T2 — Implementação e testes em um lote

Arquivos: `src/components/MaxGrid.vue`, `src/components/base/gridSlotRows.ts`, `tests/components/MaxGrid.test.ts`, `tests/preset/presetMaxUno.generate.test.ts`, `tests/browser/maxGridLineBreaks.browser.ts`, `vitest.browser.config.ts`.

1. Criar no setup do `MaxGrid` uma única consulta `useMediaQuery('(max-width: 767.98px)')`, importada de `@maxvue/max-use`. Passar o resultado como prop interna tipada ao `GridSlotRows`.
2. Declarar a prop no componente funcional, inclusive a declaração runtime necessária ao Vue. Não deixar essa prop vazar para DOM ou herdar atributos involuntariamente.
3. Acrescentar contexto opcional mobile à função pura `renderGridSlotRows`; manter default equivalente ao comportamento legado para chamadas sem contexto.
4. Manter a gramática legada e acrescentar um reconhecimento estrito equivalente a `^s-?(\d+)(?:-(full|max|\d+))?-(?:end-mobile|mobile-end)$`. Não usar busca de substrings como `includes('end')` para decidir marcadores.
5. Somar o marcador mobile aos existentes somente se ativo. Um marcador inativo não cancela outro marcador legado no mesmo item. Não alterar `flattenFragments`, keys e algoritmo de segmentação além do necessário.
6. Acrescentar casos unitários para ambas as grafias como classe e atributo; `s4`, `s-4`, extensão ausente/numérica/full/max; classes em array/objeto; atributos inativos e mudança reativa de classe/atributo. Testar fronteiras redundantes, ausência de wrappers com mobile inativo, combinação com legado, negativos e aninhamento.
7. Usar um dublê local de `matchMedia` com `matches`, eventos `change`, registro/remoção de listeners e restauração após cada teste. Validar a query literal, não usar somente `innerWidth`. Testar também ausência de `matchMedia` sem exceção. Não alterar indiscriminadamente o setup global.
8. Acrescentar testes de CSS gerado para os dois tokens exatos, preferencialmente classe e attributify. Confirmar query e declarações dentro dela, sem dimensões globais e sem alterar o preset de produção.
9. Incluir os tokens das fixtures no gerador CSS virtual de `vitest.browser.config.ts`.
10. Em navegador, usar A/B/C com alturas e larguras controladas que cabem juntas; aplicar o marcador em B. As larguras de controle não podem tornar a quebra natural inevitável nem mascarar o contrato CSS. Cobrir as duas grafias, classe/atributo e uma fixture com `MaxInputNumber` real.
11. Usar `page.viewport` obrigatório e sequência na mesma montagem `1280 → 375 → 1280`; testar também `767` e `768`. Se API de viewport não funcionar, falhar/registrar bloqueio, não pular. Restaurar viewport e desmontar fixtures em `finally`/cleanup, inclusive em falha.
12. Assertar A/B na mesma linha e C abaixo de B no mobile; C na mesma linha quando inativo e houver espaço. Medir gap de 13px, tolerância de 1px; preservar teste de gap customizado.
13. Cobrir `v-model`, listeners e contagem de mounts: resize dentro da faixa não remonta; testar valores após cruzamento de faixa. Medir foco/estado local de um filho com estado e registrar resultado para o gate de compatibilidade abaixo.

Não rodar testes/tipos/build entre estes passos. O lote inclui implementação e regressões antes da validação consolidada.

### T3 — Documentação vigente

Arquivos: `docs/THEME.md`, `COMPONENTS.md`, `playground/src/scenarios/layout-grid.vue`.

1. Trocar a afirmação absoluta de ausência de quebras responsivas pela exceção explícita de `end-mobile`/`mobile-end`.
2. Explicar que a faixa usa viewport, não largura do `MaxGrid`; listar `767.98px` e as duas ordens.
3. Manter explícito que `start-mobile`, `tablet`/`desktop`, tokens sem direção e flexbox externo não ganham quebra estrutural nesta tarefa.
4. Acrescentar exemplo mínimo com o item seguinte e esclarecer `max-width` versus encerramento. Tags de abertura sempre em uma linha.
5. Ajustar somente a nota introdutória do playground; não criar novo estado, store ou fixture visual nesse arquivo. Preservar as asserções arquiteturais existentes.
6. Corrigir no trecho de sintaxe de `docs/THEME.md` a regex genérica permissiva para refletir a gramática real do preset, sem sugerir que a gramática do organizador ficou idêntica à dele.

Conclusão: exemplos, tabelas e limitações concordam com o comportamento implementado, sem editar documentação histórica.

### T4 — Validação consolidada e revisão

Depois de T1–T3, executar na worktree e com o ambiente isolado:

```bash
npm run test
npm run test:browser
npm run type-check:test
npm run lint
npm run build
```

- Não executar aqui na sessão Plan. Comandos estão confirmados em `package.json`.
- `build` já executa `vue-tsc`; não adicionar `npm run type-check` sobre a mesma revisão sem necessidade concreta.
- Classificar falhas em lote, separar regressão de baseline com evidência e corrigir somente o que tiver causalidade e autorização. Não remover asserções para obter verde.
- Repetição da mesma falha exige diagnóstico agrupado de bootstrap/harness/dependências antes de nova execução equivalente.
- Reaproveitar resultados aprovados se o conteúdo relevante não mudou. Depois de correções, revalidar os gates afetados e registrar todas as falhas, inclusive da suíte completa.
- Não fazer benchmark, publicação ou pré-release como consequência implícita deste bugfix. Se a entrega evoluir para pré-release, `npm run verify` é obrigatório e substitui o lote parcial quando apropriado; não repetir componentes já aprovados sem justificativa factual. O verify inclui consumidores, navegador, cobertura, integridade e segurança e pode exigir permissões adicionais.
- Revisar o diff bruto e os requisitos com `jev_check` antes da entrega. Julgamento não substitui exit codes ou testes.
- Revisão independente recomendada no gate de resize/estado e na entrega, não em cada edição. Não há delegação autorizada por este plano; eventual paralelismo futuro exige autorização e arquivos de escrita distintos. T2 é um lote acoplado; não executar validações enquanto implementação estiver em andamento.

## 5. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência exigida | Testes pertinentes | Revisão pelo risco / manual |
|---|---|---|---|
| T1 / ambiente seguro | Resoluções e destinos reais conferidos por leitura | Configs/setup e gates de integridade aplicáveis | Interromper se saída atingir dependências compartilhadas ou exigir instalação não autorizada |
| T2 / R1 | Duas grafias ativam `hasEnd` somente com valor ativo | Unitários parametrizados e browser com classe/atributo | Rejeitar aceitação por substring ou sufixos inválidos |
| T2 / R2 | Query exata; resize atualiza sem reload | Dublê MediaQueryList; viewport 375/767/768/1280 e ida/volta | Conferir ausência de guards que tornem testes falsamente verdes |
| T2 / R3 | CSS mobile preservado, A/B juntos e C abaixo | CSS gerado e geometria real, gap 13px ±1px | Não confundir wrap natural com quebra forçada; revisar max não integral |
| T2 / R4 | Suíte legada preservada; valores/eventos mantidos | Fragments, grids aninhados, input real, v-model e gap customizado | Testar foco e estado local ao cruzar breakpoint; gate abaixo |
| T2 / R5 | Zero wrappers se apenas mobile inativo ou token sem direção | Unitários de árvore e casos negativos | Marcador legado não pode ser cancelado pelo mobile inativo |
| T3 / R6 | Fonte, docs e nota do playground coerentes | Teste arquitetural existente incluído em `npm run test` | Ler exemplos e limites; não prometer tablet/desktop/start-mobile |
| T4 / entrega | Resultados vigentes para o conteúdo final e diff revisado | Suítes, tipos de teste, lint e build acima | Aplicação consumidora só será validada manualmente quando pacote corrigido estiver disponível |

### Gate de compatibilidade no resize

A segmentação altera pais DOM. VNodes com keys podem remontar quando passam entre pais distintos; o código atual não oferece uma garantia de identidade nessa transição. Não declarar essa garantia sem evidência.

- Obrigatório: preservar valores controlados e callbacks, não duplicar efeitos/listeners e não remontar por alterações de largura dentro da mesma faixa.
- Inspeção obrigatória: digitar em um campo focado e cruzar o breakpoint; verificar foco e estado local de filho não controlado.
- Se houver perda de foco/estado local decorrente da nova segmentação, não concluir a entrega como integral. Registrar o caso, bloquear o aceite desse gate e solicitar decisão entre aceitar explicitamente a limitação ou autorizar uma estratégia estrutural diferente. Não inserir silenciosamente uma refatoração extensa ou afirmar que keys resolvem reparenting.

### Validação manual na aplicação consumidora

Somente em sessão/ambiente autorizado, após disponibilização real da correção: confirmar versão efetivamente resolvida de MaxComponentsUi, imports de estilos e preset; abrir o formulário afetado em viewport mobile e desktop; conferir os dois aliases, campo seguinte, espaçamento, conteúdo e resize. Não editar dependências nem publicar por conta própria. Se esse ambiente não estiver disponível, registrar `manualPending`, sem confundir o browser local da biblioteca com prova da aplicação externa.

## 6. Riscos, reversão e limites

- **Remontagem/foco:** principal risco funcional, tratado no gate acima; não comprovado nem descartado nesta sessão.
- **Divergência CSS/runtime:** evitar arredondar a query; testes de CSS e query literal cobrem o limite decimal.
- **SSR:** sem viewport, manter fallback seguro e marcadores legados; não ler window no topo do módulo. A hidratação real não foi testada. Se testes revelarem mismatch no bootstrap, diagnosticar antes de aceitar, sem inventar largura de servidor.
- **Listeners:** criar a consulta no setup do SFC para descarte automático; não registrar a cada render. Testar desmontagem.
- **Escopo:** manter outros dispositivos/direções como antes; eventual expansão é outra solicitação.
- **Ambiente compartilhado:** symlink de dependências exige preflight; a worktree sozinha não prova isolamento de caches.
- **Reversão futura:** correção é local, sem migração de dados. Reverter somente os hunks próprios de código/testes/docs, mediante autorização, sem reset/checkout destrutivo ou descarte de alterações de terceiros.
- **Operação:** sem endpoints, credenciais, jobs, migrations, deploy ou observabilidade nova. Build local aprovado não significa publicação ou integração em dev.

## 7. Retomada e registro durante Execute

1. Conferir trabalho existente antes de implementar; não repetir tarefas concluídas nem reabrir decisões sem evidência nova ou mudança de requisito.
2. Validar alterações locais contra este documento e executar apenas lacunas. Respeitar dependências T1 → T2 → T3 → T4; permitir elaboração documental em paralelo somente com autorização e sem conflito de escrita.
3. Registrar progresso após marcos e handoff em `docs/plans/wt-316282b8/execution-state.json` **somente durante Execute**. Esse arquivo não foi criado e não está autorizado para escrita nesta sessão Plan.
4. Usar o contrato version 2 estrito do executor, vinculado ao SHA256 real de `plan.md` e às revisões factuais de conteúdo das tarefas; não usar nomes/rótulos no lugar de hashes. Incluir tarefas, estados e arquivos conforme o esquema efetivo, sem inventar propriedades adicionais.
5. Status de tarefa permitidos: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`. Não criar campos `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`; motivos e próxima ação concreta cabem em `nextAction` até 512 caracteres.
6. Verificação usa `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`; comandos até 4.096 caracteres. Resultados de validação/check: somente `passed`, `failed` ou `pending`, nunca `blocked`.
7. `passed` exige exitCode 0; `failed` exige inteiro diferente de zero; `pending` não admite exitCode. Registrar comandos realmente executados e todas as falhas. Não deduzir exitCode de `tool:end.ok`.
8. Checks vazios, falha vigente ou ausência de resultado vigente impedem validação integral. Version 1 permanece compatível, mas não prova aprovação automática. O registro autodeclarado não comprova execução nativa nem detecta checks omitidos.
9. Em bloqueio, cancelamento ou validação externa indisponível, manter resultado parcial e próxima ação explícitos; não afirmar conclusão total. Tarefas assíncronas exigem espera limitada com recuo e informação nova, sem consultas repetidas de status.

## 8. Revisão deste plano

- Pedido atendido no desenho: encerramento depois do item, dois aliases, somente mobile.
- Simplicidade: reaproveita MaxGrid, MaxUse e segmentação existentes; sem novo componente público, store ou dependência.
- Preservação: não altera dimensões, semântica legada, outros dispositivos ou exemplos vizinhos.
- Dependências: helper conferido no pacote instalado; browser harness e scripts reais identificados.
- Cobertura: cada requisito tem evidência unitária/CSS/browser ou revisão manual explícita.
- Pendências honestas: risco de reparenting/foco, isolamento dos caches e validação da aplicação consumidora não foram comprovados por execução. Gates dizem quando interromper.
- Esta revisão não equivale a testes aprovados. A próxima sessão deve seguir o plano somente após autorização para Execute.
