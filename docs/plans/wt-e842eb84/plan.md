# Plano de execução — build com versão e pendência de commit explícita

## 1. Identificação e resultado esperado

- Data: 19/10/2026.
- Projeto: `@maxvue/max-components-ui`.
- Worktree exclusiva: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-e842eb84`.
- Branch existente: `wt-e842eb84`, originada de `dev`.
- SHA investigado: `89f2f0a4125c8c035116cfcde34f02d25840c492`.
- Especificação prévia: [spec.md](./spec.md).
- Estado desta entrega: apenas investigação e documentos; nenhuma implementação, instalação, suíte, build ou operação de entrega executada.

O usuário quer tratar o bloqueio de deploy observado depois de usar o botão **NPM RUN BUILD**. Consultado sobre a decisão que muda o resultado, escolheu **manter o aumento da versão**, ciente de que isso exige commit posterior antes de sincronizar a biblioteca com consumidores.

**Consequência obrigatória:** este plano não promete eliminar a recusa de deploy enquanto houver arquivos versionados modificados. A correção proposta é tornar o estado real explícito no botão e orientar a entrega, sem mudar o versionamento escolhido nem enfraquecer a rastreabilidade do consumidor.

## 2. Problema, usuários e decisões

### Diagnóstico fundamentado

1. `.vscode/tasks.json:7` executa `npm version patch --no-git-tag-version --ignore-scripts` antes de `npm run build`.
2. O comando modifica `package.json` e `package-lock.json`, mas não cria commit/tag. Suas flags não significam “não modificar arquivos”.
3. A notificação afirma “Build, Commit e Push realizados!”, e a barra exibe “BUILD, COMMIT & PUSH”. A tarefa não executa commit nem push.
4. Engeapp resolve sua biblioteca local por symlink e executa `git status --porcelain --untracked-files=no`. Qualquer alteração versionada impede sincronização do manifesto.
5. O bloqueio ocorre em `local-libs:verify`, antes de o consumidor poder atestar commit, árvore e hash coerentes da biblioteca.

Afeta quem desenvolve a biblioteca e realiza entrega de projetos que a consomem localmente. Não há alteração de interface de usuário final da aplicação, de banco de dados ou de comportamento dos componentes.

### Decisões confirmadas e preservadas

- Manter incremento patch antes de cada execução pelo botão, inclusive a possibilidade de saltar versões ao repetir um build que falhou.
- Manter terminal `npm run build` sem incremento.
- Não automatizar Git, publicar pacote, integrar branch ou contornar o gate do consumidor.
- Usar apenas a worktree já fornecida, sem criar outra, trocar branch ou mexer em outras sessões.
- Preservar tarefa de release, dependências, classes legadas, stores e helpers.

### Proposta de implementação a revisar

Alterar somente a comunicação do botão, seus testes e a orientação operacional do README. O incremento já existe e não precisa ser reimplementado. Um procedimento de commit autorizado pelo usuário/MaxCode é parte necessária da entrega operacional, não uma automação a ser adicionada ao botão.

Alternativas descartadas: retirar incremento (não escolhido pelo usuário), commit automático (não autorizado), ignorar apenas os dois manifestos no gate (quebraria correspondência entre arquivos e commit), bypass de validação (proibido), reverter versões após compilar (apagaria o incremento escolhido e não resolveria a rastreabilidade).

## 3. Evidências, contratos e limites

### Arquivos existentes inspecionados

| Arquivo | Informação necessária à execução |
|---|---|
| `AGENTS.md` | Uso da worktree pré-alocada, pt-BR, gates em lote, proibição de operações de entrega sem pedido explícito. |
| `.vscode/tasks.json:4–40` | Contrato do build e da tarefa de release; somente dois textos do build serão alterados. |
| `package.json:845–882` | Node declarado `>=20`, npm `>=10`, gerenciador `npm@10.8.2`, scripts e gates disponíveis. |
| `package.json:889–998` | MaxUse via npm; peers de Vue/Pinia e ausência de necessidade de nova dependência. |
| `README.md:214–240` | Local exato da orientação de desenvolvimento e nota de incremento. |
| `tests/architecture/npmBuildTask.test.ts` | Fixtures em `.execution-tmp`, cache npm local e offline, timeout de subprocessos, testes estáticos e cenários de falhas. |
| `vitest.config.ts` | Vitest com `happy-dom`, setup global, aliases/dedupe e inclusão de `tests/**/*.test.ts`. |
| `tests/setup.ts:1–140` | Bootstrap importa Vue/Pinia/MaxUse indiretamente e fornece mocks; falha de bootstrap pode impedir até testes arquiteturais. |
| `tsconfig.test.json` | Inclui testes e scripts na verificação específica de tipos. |
| `vite.config.ts` | Build de biblioteca e cópia de temas em `dist`, sem incremento próprio de versão. |
| `.gitignore` | `dist/`, `.worktrees/` e `.max-code-worktrees/` ignorados. |
| `scripts/check-lockfile.mjs` | Gate de integridade de manifestos e proibição de dependências locais na biblioteca. |
| `scripts/verify-consumers.mjs` e `scripts/verify-package-consumer.mjs` | Validadores de pacote podem instalar dependências, criar temporários e recompilar; não são simples leituras nem necessários a este ajuste textual. |

Arquivos do consumidor lidos, **sem autorização de escrita**: `/home/johnattas/GitHub/engeapp/scripts/sync-local-libraries.mjs`, `scripts/verify-local-libraries.mjs`, `config/local-libraries.json`, `package.json` e trecho `deploy.php:395–479`.

### Observações de ambiente

- A worktree estava limpa no começo. Não havia spec/plano anterior no destino autorizado.
- O symlink de Engeapp para MaxComponentsUi apontava para a raiz principal `/home/johnattas/GitHub/MaxComponentsUi`. Alterar esta worktree não altera automaticamente a biblioteca que ele consome.
- No momento da inspeção a raiz principal não tinha arquivos versionados modificados; o erro histórico não foi reproduzido. Não é possível atribuir diferenças passadas sem o diff daquele instante.
- `node_modules` desta worktree é um symlink para o `node_modules` da raiz principal. Não executar instalações ou permitir caches/escritas de testes nessa árvore compartilhada sem resolver isolamento e autorização.
- `node_modules/.bin/vitest` existe. Uma consulta conjunta a caminhos retornou código 2 porque `node_modules/.bin/npm` não existe; npm é ferramenta de sistema e esse caminho ausente não comprova falta do npm no PATH. Nenhum gate foi executado nessa consulta.
- Não se comprovou o executor nativo do botão no MaxCode, nem disponibilidade de `notify-send`, serviço de notificações, `paplay` ou áudio. Dublês não comprovam integração visual/sonora real.
- Não se inspecionaram credenciais, bancos, filas ou serviços de produção. Não são necessários a esta mudança.

### Referências e achados separados

Documentação oficial consultada: [npm CLI v10 — npm version](https://docs.npmjs.com/cli/v10/commands/npm-version), servida como 10.9.9. Confirma a escrita nos manifestos e a ausência de commit quando `git-tag-version` é falso; não comprova a versão instalada, declarada no projeto como 10.8.2.

Achados fora do escopo, somente notificados:

- [Diagrama legado de PrimeVue no README](../../notifications/wt-e842eb84/notifications/max-components-ui-documentacao-primevue-legada.md).
- [Faixas de Pinia diferentes entre biblioteca e Engeapp](../../notifications/wt-e842eb84/notifications/max-components-ui-compatibilidade-pinia-engeapp.md). Pode haver outro bloqueio independente; não atribuir o erro relatado a essa divergência sem validação própria.

## 4. Especificação da alteração

### Tarefa de build

Em `.vscode/tasks.json`, manter o encadeamento atual e trocar apenas:

| Campo | Valor proposto |
|---|---|
| Corpo da notificação de sucesso | `✅ MAX COMPONENTS UI - Build concluído e versão incrementada. Faça commit pelo MaxCode antes do deploy.` |
| `options.statusbar.label` do build | `✅ BUILD + VERSÃO` |

Manter exatamente o prefixo `npm version patch --no-git-tag-version --ignore-scripts && npm run build`. Preservar rótulo `NPM RUN BUILD`, quatro segmentos shell, título `VS Code`, ícone, som, apresentação e demais opções. Não alterar o comando `NPM RUN RELEASE` ou `scripts.release`.

Não criar helper MaxUse, store MaxPinia, componente MaxComponentsUi ou script Node para duas mudanças textuais. Não criar dependências nem modificar versões no pacote real como parte da implementação.

### Testes

Em `tests/architecture/npmBuildTask.test.ts`:

- Ajustar o teste estático do sufixo e o rótulo da barra às mensagens propostas, sem relaxar asserções de flags, ordem e opções.
- Provar que o comando de build não contém operações de commit/push/tag/publicação e que a tarefa de release segue inalterada.
- Preservar todos os cenários atuais: incrementos consecutivos, passagem de `1.1.9` para `1.1.10`, três campos sincronizados, hooks de versão não executados, falha de incremento, falha de build com versão mantida e build de terminal sem incremento.
- Acrescentar teste que lê o comando real do build, executa-o numa fixture e substitui apenas `notify-send` e `paplay` por executáveis locais controlados no PATH. Eles devem registrar argumentos/ordem dentro da fixture, sem notificação/áudio reais.
- No sucesso, verificar incremento, execução do build e mensagem com pendência de commit, sem alegação de commit/push concluídos.
- Na falha controlada do build, verificar status não zero, nenhuma notificação/som e permanência da versão incrementada.
- Manter execução npm offline, caches dentro da fixture, timeout limitado e limpeza apenas do diretório criado pelo próprio teste. Não executar release nem Git de entrega em fixtures ou no projeto.
- Não invocar o botão real nem incrementar o pacote desta worktree para validar testes de versão.

### README e procedimento operacional

Ampliar a nota `README.md:239–240`, sem corrigir incidentalmente o restante do README:

1. Diferenciar botão (incrementa e compila), terminal (compila sem incremento) e release (fluxo distinto de publicação).
2. Explicar por que os dois manifestos ficam modificados e por que o consumidor exige árvore limpa; isso é esperado com a opção mantida.
3. Após build bem-sucedido, solicitar ao MaxCode commit/integração conforme autorização do usuário. Revisar os arquivos antes; não recomendar `git add -A` ou commit indiscriminado. Alterações preexistentes devem ser investigadas/preservadas.
4. Confirmar que a biblioteca **efetivamente apontada pelo symlink** recebeu a revisão e está limpa. Commit em outra worktree não atualiza o destino por si só; push também não limpa arquivos locais modificados.
5. Somente depois, no fluxo de entrega autorizado do consumidor, sincronizar e verificar manifesto. Identificar `npm run sync:local-libs` como escrita em `config/local-libraries.json`; não sugerir executá-lo durante Plan nem usar versões de hash inventadas.
6. Explicar que fazer outro build pelo botão depois do commit cria nova pendência de versão. Se for necessário somente recompilar a mesma revisão já versionada, o comando de terminal existente não incrementa; isso não substitui o botão nem sua política escolhida.
7. Se o build falhar, o incremento já ocorreu. Investigar antes de nova tentativa; não restaurar/resetar os arquivos automaticamente.
8. Não recomendar bypass, remoção de prehooks, alterações de symlink ou deploy com banco como diagnóstico.

## 5. Etapas executáveis e dependências

### T0 — Preflight por leitura

**Sem alterações de produto.** Ler este plano/spec e as diretrizes; conferir branch, SHA e diff atual. Revalidar os três arquivos-alvo e identificar trabalho já feito. Ler scripts/prehooks, configuração de testes e caminhos efetivos de libs, executáveis e caches.

Conferir identidade/resolução de Vue, Pinia, Axios e MaxUse no bootstrap; não tratar mocks ou a presença de pastas como prova de árvore íntegra. Não criar alias ou dependência local para mascarar divergências. A ausência de npm em `.bin` não é motivo para instalar pacotes às cegas.

O symlink de `node_modules` exige verificar se ferramentas escreverão fora da worktree. Se isso não puder ser evitado com configuração já suportada, interromper validações dependentes e pedir autorização para preparar ambiente isolado. Não remover/trocar o symlink nem instalar na raiz compartilhada automaticamente. Banco, cache remoto, filas e storage externos não devem ser acessados; nenhuma cópia ad hoc de `.env`.

**Conclusão:** ambiente compreendido, arquivos e contratos revalidados; pendências concretas registradas. Falha de integridade bloqueia validações dependentes, sem comando direto de bypass ou `ignoreConfig`.

### T1 — Comunicação e documentação

**Depende de T0. Arquivos:** `.vscode/tasks.json`, `README.md`.

Aplicar somente os dois textos e a nota operacional descritos na seção 4. Revisar por leitura a preservação do prefixo, opções, tarefa de release, scripts e restrição de escrita. Não executar build/testes ainda.

**Conclusão:** comunicação não promete commit/push; README explica o caminho necessário para o consumidor, inclusive symlink e pendências reais.

### T2 — Testes de contrato e comunicação

**Depende de T1. Arquivo:** `tests/architecture/npmBuildTask.test.ts`.

Atualizar expectativas e acrescentar as fixtures descritas na seção 4. Preservar regressões existentes e não executar comandos gráficos reais. Revisar timeout, PATH, cache e cleanup por leitura. Concluir o lote inteiro antes de validar.

**Conclusão:** testes cobrem tanto comportamento preservado como mensagem nova, vinculados à tarefa real.

### T3 — Validação agrupada e revisão final

**Depende de T2 e de ambiente íntegro/isolado.** Usar os comandos da seção 6; aguardar conclusão e registrar saída/código reais. Corrigir falhas em lote e executar novamente só os checks afetados pela mudança. Não repetir equivalentes para obter resultado diferente sem diagnóstico.

Revisar o diff completo, os critérios da matriz, os contratos não alterados e os achados separados. Revisão independente é pertinente neste marco, não a cada microedição; não exige agentes paralelos. Se houver delegação explicitamente autorizada depois, T1/T2 continuam sequenciais e cada executor recebe só os trechos/documentos necessários, com propriedade de escrita delimitada.

**Conclusão:** resultado técnico local demonstrado ou falha/bloqueio descrito com próxima ação. Nenhuma integração Git ou operação no consumidor.

### T4 — Aceite operacional externo, manual e condicionado

**Depende de T3, de pedido próprio do usuário e do MaxCode/operador. Não executar automaticamente.**

- Confirmar que o MaxCode carregou os textos novos da tarefa e mostra a mensagem/rótulo corretos; apenas dublês não provam isso.
- Qualquer execução real do botão modifica os manifestos e precisa de autorização e destino correto; não executá-la na raiz principal pelo agente desta tarefa.
- Commit/integração no destino consumido continuam a cargo do MaxCode/usuário. Só depois verificar por leitura o symlink e a limpeza da biblioteca no consumidor.
- Verificar `npm run verify:local-libs` no contexto operacional autorizado do consumidor; se o manifesto estiver desatualizado, o operador deve autorizar sua sincronização e depois verificar novamente. Não escrever arquivos fora da worktree por conta desta tarefa.
- Não prometer que esse gate comprova deploy completo ou compatibilidade geral. Outros gates, inclusive Tiptap e possíveis peers divergentes, continuam independentes.
- **Não executar `composer deploy:fast-db-all` para validar:** seu escopo inclui sincronização de banco. Nem o log fornecido nem este plano autorizam operação em dados/produção.

Enquanto esses itens não tiverem evidência real, manter T4 como `manualPending`, com próxima ação concreta. Pode haver implementação técnica local entregue sem aceite operacional integral; não declarar o problema operacional totalmente resolvido nessa condição.

## 6. Matriz de aceite e verificações

Todas as verificações a seguir são **futuras**. Nesta sessão só houve leitura e escrita dos documentos autorizados.

| Tarefa/requisito | Evidência esperada | Testes/gates pertinentes | Revisão pelo risco e manual |
|---|---|---|---|
| T0: isolamento e integridade | Caminhos efetivos, scripts e ausência de escrita compartilhada confirmados | `npm run check:lockfile`, após implementação, antes das validações dependentes | Bloquear se ambiente/árvore incoerentes; não corrigir baseline sem causalidade e autorização. |
| T1: comunicação verdadeira | Diff dos dois textos; nenhuma promessa de commit/push concluídos | Asserções estáticas em `npmBuildTask.test.ts`, via suíte completa | Conferir tarefa de release intacta; mensagem/barra no MaxCode em T4. |
| T1: orientação operacional | README diferencia build, commit, integração e deploy; não recomenda bypass | Revisão documental contra scripts reais do consumidor | Não exigir alteração do consumidor; leitura do destino do symlink pelo operador. |
| T2: incremento preservado | Três versões sincronizadas; flags/ordem inalteradas | Regressões existentes de incrementos, hooks, release e build de terminal | Inspecionar que testes não incrementam o projeto real nem criam ações Git. |
| T2: sucesso/falha da comunicação | Dublês registram mensagem/ordem só após build; falha não notifica | Novas fixtures com comando real, som/notificação locais | Dublês não comprovam desktop/áudio reais. |
| T3: coerência do lote | Códigos de saída e revisão factual registrados | Suíte completa, tipos de testes, lint e build | Revisar diff e falhas agrupadas; sem repetição desnecessária. |
| T4: entrega rastreável | Biblioteca realmente consumida limpa e manifesto coerente | Gate existente do consumidor, com autorização separada | `manualPending` até evidência; sem deploy de banco, publicação ou integração automática. |

### Sequência local após implementação integral

Executar a partir da worktree exclusiva, depois de confirmar isolamento. Não usar `npx` que baixe ferramentas como forma de contornar dependências ausentes.

```bash
npm run check:lockfile
npm run test
npm run type-check:test
npm run lint
npm run build
```

- Parar validações dependentes se o gate de integridade falhar. Os demais resultados independentes podem ser registrados, mas não comprovam entrega integral.
- `npm run test` já inclui o arquivo arquitetural; não executar também o teste focado na mesma revisão sem falha/dúvida concreta.
- `npm run build` já chama `vue-tsc`; não repetir `npm run type-check` sobre o mesmo conteúdo.
- Não executar `npm run verify` rotineiramente para esta alteração sem impacto em distribuição/runtime. Havendo expansão para release ou contrato público, reavaliar e preservar o gate completo, consumidores, browser, benchmark, integridade e segurança; não somar componentes isolados já cobertos por ele na mesma revisão.
- Se bootstrap falhar, agrupar diagnóstico de dependências/aliases/setup antes de repetir a suíte. Não mudar configuração de teste apenas para obter verde.
- Cancelamento mantém resultados parciais e pendências explícitas. Processos assíncronos aguardam conclusão/mudança com limite e recuo, sem consultas repetitivas sem nova informação.

## 7. Riscos, compatibilidade e recuperação

- **Rastreabilidade:** manter incremento sem commit mantém a pendência do gate. Isso é escolha confirmada, não falha a silenciar.
- **Alterações preexistentes:** o gate considera todos os arquivos versionados, não apenas versão. Fazer commit só dos manifestos não resolve se houver outros arquivos pendentes. Não descartar ou incluir trabalho desconhecido.
- **Worktree versus consumidor:** entregar uma mudança aqui não integra a raiz consumida. Integração só por autorização posterior do usuário/MaxCode; não alterar o symlink como atalho.
- **Ambiente compartilhado:** dependências estão ligadas à raiz principal; não presumir que worktree isola cache/escritas de ferramentas. T0 pode bloquear testes até preparação autorizada.
- **Mensagens longas:** a notificação pode ser truncada pelo desktop; conferir em T4 e ajustar texto sem mudar o sentido se houver evidência real.
- **Falhas pós-build:** notificação/áudio podem falhar depois de versão/build concluídos; preservar semântica existente e não desfazer manifestos automaticamente.
- **Compatibilidade:** nenhum contrato runtime, dependência, export, store, helper ou classe muda. Achados de peers ficam separados e podem impedir validação externa por causa independente.
- **Rollback:** eventual reversão textual deve atingir somente as alterações desta tarefa, sem reset/checkout destrutivo e sem reverter versões ou commits alheios. Não há migração ou dados a reverter.
- **Observabilidade:** evidência da tarefa, retornos dos processos e registros de aceite bastam; não criar telemetria, integração externa ou coleta de dados.

## 8. Progresso, retomada e handoff

Durante Execute, após marcos, registrar progresso em `docs/plans/wt-e842eb84/execution-state.json`. **Não criar esse arquivo em Plan Mode.** Ler o esquema vigente do executor antes de escrever; não inventar campos de um esquema não disponível.

Regras obrigatórias para o registro futuro:

- Novos registros em `version: 2` estrita, sem campos adicionais; não usar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`. Motivos/encaminhamento cabem em `nextAction` de até 512 caracteres.
- Vincular ao SHA256 real do conteúdo de `plan.md` e a revisões SHA256 reais do conteúdo das tarefas, nunca rótulos ou nomes de branch. Atualização do plano invalida vínculo anterior até recalcular.
- Registrar tarefas, estados e arquivos. Estados permitidos de tarefa: `pending`, `running`, `completed`, `blocked`, `manualPending`, `validationFailed`.
- Registrar `verification` como `{revision: SHA256, checks: [{command, revision: SHA256, result, exitCode?}]}`. Comandos com até 4.096 caracteres e somente os realmente executados.
- Resultados de validação/check: apenas `passed`, `failed`, `pending`; `blocked` é estado de tarefa, não resultado de check. `passed` exige `exitCode: 0`; `failed` exige inteiro não zero; `pending` não aceita `exitCode`.
- Registrar todas as falhas, inclusive suíte completa; não inferir código zero de `tool:end.ok`. Checks vazios, resultado sem revisão vigente ou falha vigente impedem validação integral.
- Version 1 continua compatível, mas não comprova validação integral automaticamente. O registro é autodeclarado: não comprova execução nativa nem detecta checks omitidos.
- Se o esquema estrito não estiver disponível, pedir a referência ao executor em vez de produzir JSON incompatível. Usar `manualPending` para T4 até evidência e autorização operacional apropriadas.

Na primeira admissão, ler plano/spec e diretrizes. Nas retomadas, conferir trabalho já realizado, diff, alterações locais e resultados vinculados à mesma revisão; consultar apenas os trechos pertinentes. Executar lacunas, sem reabrir o incremento escolhido ou repetir checks aprovados sem mudança relevante. Repetição da mesma falha sem progresso exige diagnóstico da causa e próxima ação, nunca relato de conclusão total.

Encerrar a implementação com resumo dos três arquivos afetados, verificações reais, limitações e pendência de integração/aceite externo. Não fazer commit, merge, push, publicação, deploy nem remover esta worktree; o painel/usuário gerencia sua integração e limpeza.
