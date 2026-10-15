# Plano de execução — incrementar versão pelo botão de build do MaxCode

## 1. Identificação e orientação de retomada

- Data: 15/10/2026.
- Projeto: MaxComponentsUi, pacote `@maxvue/max-components-ui`.
- Worktree/branch obrigatória: `wt-91c313d0`.
- Raiz: `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-91c313d0`.
- Especificação: [spec.md](./spec.md), elaborada antes deste plano.
- Estado desta entrega: somente planejamento. Implementação, testes, builds e incremento real **não executados**.
- Usuários afetados: mantenedores que usam o botão de build do MaxCode neste projeto.

Na primeira admissão, ler este plano, a especificação e as instruções aplicáveis do projeto. Nas retomadas, consultar os trechos pertinentes e o progresso existente, sem releitura integral compulsória. Conferir trabalho já realizado e alterações locais antes de editar. Revalidar evidências que mudaram. Não reabrir decisões sem novo requisito ou evidência concreta.

Não criar outra worktree, trocar de branch, investigar worktrees alheias, editar a raiz principal, commitar, criar tag, fazer merge/push ou remover esta worktree. Sua integração e limpeza pertencem ao painel/usuário. A autorização desta sessão foi apenas para documentos; o executor deve receber autorização de Execute antes de implementar.

## 2. Problema, requisitos e preservações

O botão `NPM RUN BUILD` atualmente compila, mas não incrementa a versão. O usuário pediu incremento unitário no último número a cada acionamento, por exemplo `1.1.2 → 1.1.3`.

| ID | Requisito |
|---|---|
| R1 | Uma execução iniciada da tarefa de build incrementa `patch` uma vez, antes da compilação. |
| R2 | Manifest e lockfile permanecem sincronizados: `package.json.version`, `package-lock.json.version` e `package-lock.json.packages[''].version`. |
| R3 | A ação não faz commit, tag, push, publicação ou hooks de versionamento. |
| R4 | Build comum, CI/verify e release mantêm seus contratos anteriores, sem novo incremento indireto. |
| R5 | Falhas interrompem o encadeamento; falha no build não desfaz o incremento já realizado. |
| R6 | Permanecem rótulo, opções da tarefa, avisos e som existentes; execução real deve ocorrer na worktree correta. |
| R7 | Há testes isolados, documentação do comportamento e aceite manual identificável. |

Fora do escopo: modificar frontend/estado/helpers, dependências, release, UI da extensão ou mensagens preexistentes. Não introduzir MaxPinia ou MaxUse em uma tarefa shell sem fluxo de aplicação; não há alteração de componentes Vue. Achados separados estão em `docs/notifications/wt-91c313d0/notifications/`.

## 3. Investigação realizada e limites

### Evidências locais

1. `pwd`, `git rev-parse --show-toplevel` e `git branch --show-current` confirmaram a raiz acima e a branch `wt-91c313d0`. O `git status --short` inicial estava vazio.
2. `.gitignore:68–69` já ignora `.worktrees/` e `.max-code-worktrees/`; não alterar.
3. `.vscode/tasks.json:3–22` contém uma tarefa shell com rótulo `NPM RUN BUILD`. Seu comando atual é `npm run build`, seguido de `notify-send` e `paplay`, unidos por `&&`.
4. `package.json:559` define `build` como `vue-tsc && vite build`. Não há hooks de build/versionamento no bloco de scripts inspecionado. `package.json:572` define `verify` com build; `package.json:575–576` restringe release à `main` e já possui incremento, push e publicação.
5. `.github/workflows/quality.yml:25–33` executa `verify` e reprova arquivos gerados não commitados. Logo, um `prebuild` que incremente a versão violaria a CI.
6. `package.json:3` e `package-lock.json:3,9` estão em `1.1.2`, lockfile versão 3.
7. `scripts/check-lockfile.mjs` valida integridade dos requisitos de dependências e caminhos; não compara os campos de versão do próprio pacote. Não atribuir ao gate essa cobertura inexistente nem ampliar seu escopo nesta tarefa.
8. `vitest.config.ts` inclui os testes arquiteturais no ambiente happy-dom e carrega `tests/setup.ts`. O setup importa Vue/Pinia e componentes mesmo para testes de tooling; uma falha de bootstrap pode impedir a suíte antes dos testes novos.
9. `tests/architecture/lockfileValidation.test.ts` e `tracked-filenames.test.ts` mostram o padrão de Vitest, fixtures e verificação arquitetural. `tsconfig.test.json` inclui testes e scripts. `eslint.config.js` exige quatro espaços, aspas simples e ponto e vírgula nos arquivos TS.
10. `vite.config.ts` gera `dist` e copia temas; não executado. `README.md:210–233` é o local apropriado para a nota de desenvolvimento.

### Integração MaxCode e documentação

- Foi lido um trecho específico do bundle instalado `~/.vscode/extensions/johnattas.maxcode-1.1.134/dist/extension.js`, sem alteração. `uS.build` reconhece `NPM RUN BUILD`; `Nj` lê `.vscode/tasks.json`; `cS`/`xa` aproveitam comando e diretório de execução. Não é necessário alterar a extensão para a proposta.
- Essa leitura não prova a versão ativa do editor, o projeto selecionado ou o diretório usado no clique real. Estes são critérios do aceite manual, não fatos já validados.
- Fonte oficial: <https://docs.npmjs.com/cli/v10/commands/npm-version/>. Confirma atualização de arquivos de versão e que `git-tag-version=false` impede commit/tag.
- O npm encontrado em `/home/johnattas/.nvm/versions/node/v24.18.0/bin/npm` declara versão `12.0.1` em seu manifest; o projeto declara `npm@10.8.2`. Foi lida a implementação local de `libnpmversion/lib/version.js`: a flag evita o fluxo Git e `ignoreScripts` evita hooks. Não foi feita troca de versão ou instalação.
- A mesma implementação atualiza primeiro o manifest e tolera falha ao atualizar o lockfile. Não há garantia transacional; erros de escrita/interrupção exigem inspeção, nunca relato automático de sucesso.
- `readlink -f node_modules` aponta para `/home/johnattas/GitHub/MaxComponentsUi/node_modules`. Dependências são compartilhadas: não instalar, apagar, regenerar ou escrever nessa árvore sem autorização.
- Uma consulta que incluía o nome `.npmrc` foi bloqueada. Conteúdo e configuração sensível não foram lidos. Não repetir essa consulta nem contornar a proteção; caso informação bloqueada seja essencial, interromper e solicitar um meio autorizado, sem revelar segredos.

Nenhum teste, comando npm, build, clique real ou gate foi executado no planejamento. Não há prova de suíte verde ou ambiente integralmente apto.

## 4. Solução e decisões

### Alteração mínima

Em `.vscode/tasks.json`, localizar a tarefa por `label === 'NPM RUN BUILD'` e prefixar seu `command` com:

```bash
npm version patch --no-git-tag-version --ignore-scripts && npm run build
```

Preservar após isso o sufixo atual `&& notify-send ... && paplay ...`, sem reescrever mensagens nem mudar apresentações. Não alterar a tarefa `NPM RUN RELEASE`.

Não adicionar script ao `package.json`, `prebuild`, biblioteca SemVer, wrapper próprio ou edição manual de JSON. O npm já oferece incremento e sincronização de versões; o ponto de entrada específico evita que `verify` e release incrementem duas vezes por esta mudança.

### Decisões confirmadas, propostas e limites

- **Confirmado pelo pedido:** incremento unitário no último número para o botão; worktree e restrições Git.
- **Decisão técnica proposta:** `npm version patch` exclusivo na tarefa shell, com flags explícitas para não criar commit/tag ou executar hooks de versão.
- **Decisão técnica proposta:** incrementar antes de compilar. Falha de build mantém o incremento; nova execução avança novamente. Não implementar rollback automático, nem reservar versão publicada.
- **Preservação:** build comum não incrementa; release continua com seu incremento próprio. Não executar release como verificação.
- **Preservação:** sem `options.cwd` absoluto novo. Respeitar a seleção de execução do MaxCode, confirmando manualmente que é esta worktree. Se não for, bloquear o teste em vez de escrever na raiz principal ou editar a extensão.
- **Limite:** execução concorrente forçada da mesma tarefa não é suportada nem garantida por este ajuste; respeitar o controle de tarefa ativa do editor. Cliques que não iniciam tarefa não consomem versão.
- **Limite:** se o npm falhar parcialmente, interromper e inspecionar os três campos. Não usar `--force`, reset Git ou novo clique como recuperação.
- **Limite:** `--ignore-scripts` pertence somente à chamada de versionamento. Não desabilitar hooks/gates de build, integridade ou testes.

Alternativas descartadas: `prebuild` ou mudança de `scripts.build` afetariam CI/verify/release; incrementar depois do build não disponibilizaria a versão nova durante a compilação; usar `npm version` sem flags criaria operações Git e poderia disparar hooks; atualização manual do número duplicaria lógica já disponível no npm.

## 5. Tarefas executáveis

### T1 — Admissão e preflight por leitura

**Dependência:** autorização de Execute. **Escritas:** nenhuma nesta etapa.

1. Confirmar raiz e branch com os comandos Git de leitura usados na investigação e inspecionar `git status --short`/diff atual. Preservar alterações de terceiros e qualquer implementação parcial.
2. Revalidar o bloco de scripts de `package.json`, tarefa, lockfile, configs de Vitest/TS e hooks relevantes. Mudança que acrescente comportamento externo exige diagnóstico antes de executar scripts.
3. Confirmar ferramenta npm suportada e os caminhos efetivos de dependências, symlinks e caches. Não instalar, copiar arquivos de ambiente ou escrever em dependências compartilhadas para “ajustar” o harness.
4. Para o novo teste, a operação é de arquivos/processos: não há Axios, banco, cache de aplicação, filas, storage de produção, fornecedor ou credencial necessários. O setup global usa Pinia; se houver falha de identidade/bootstrap, diagnosticar o harness de forma agrupada sem criar configuração alternativa que contorne os gates.
5. Verificar por leitura que a pasta de fixtures proposta está dentro da worktree e não é symlink externo. Identificar limites da validação manual no editor.

**Saída:** lista de diferenças em relação às evidências, ambiente apto ou bloqueio concreto. Não avançar se a implementação/teste depender de escrita fora da worktree ou informação sensível bloqueada.

### T2 — Implementar configuração, regressões e documentação em um lote

**Dependência:** T1. **Arquivos de escrita:** `.vscode/tasks.json`, novo `tests/architecture/npmBuildTask.test.ts` e seção Desenvolvimento de `README.md`.

1. Alterar somente o comando da tarefa de build, conforme seção 4. Manter todas as outras propriedades e a tarefa de release intactas.
2. Adicionar testes de contrato que leiam os arquivos pela raiz do próprio teste, não pelo diretório corrente incidental:
   - existe uma tarefa de build inequívoca com rótulo preservado;
   - os dois primeiros segmentos shell são exatamente versionamento com flags e `npm run build`, nesta ordem, ligados por `&&`;
   - o sufixo de notificação/som e opções da tarefa permanecem os observados no baseline;
   - `scripts.build` não recebeu incremento e não foi criado `prebuild` de versionamento;
   - release permanece com seu encadeamento original, sem invocá-lo no teste.
3. Adicionar testes de integração sem instalar dependências, usando o mesmo prefixo do comando da tarefa, após conferir que os segmentos correspondem à lista estrita esperada. Não duplicar uma implementação fictícia de incremento nem executar o sufixo de notificações.
4. Cada caso cria fixture exclusiva com `package.json`, lockfile v3 mínimo e um pequeno script de build que registra as versões lidas. A fixture fica sob `.execution-tmp/` **desta worktree**, criada com identificador único. O cache/log npm deve ficar dentro da própria fixture, nunca em `node_modules` compartilhado. Não copiar configurações de ambiente ou credenciais; não acessar rede ou registry.
5. Usar subprocesso com `cwd` da fixture, ambiente mínimo necessário, timeout limitado e captura dos códigos de saída. O build da fixture é um stub local, não `vite`/`vue-tsc`. Hooks `preversion`, `version` e `postversion` usam marcadores de arquivo para demonstrar que não foram executados. Não criar hooks que façam Git ou comunicação externa.
6. Cobrir todos os casos da matriz da seção 6, incluindo sucesso repetido, número acima de 9, falha de versionamento e falha posterior de build. Limpeza em `finally` somente das fixtures criadas pelo teste, com verificação do caminho; nunca remover `.execution-tmp` inteira, executar `git clean` ou limpar diretórios de outros trabalhos.
7. Atualizar README apenas no trecho de desenvolvimento: botão incrementa antes de compilar, build comum não; os três campos ficam sincronizados; não há commit/tag/push/publish; falha de build consome incremento. Não corrigir outras divergências do README nesta tarefa.

**Saída:** lote inteiro implementado e testes completos, ainda sem rodar testes/tipos/builds entre microedições. `package.json` e `package-lock.json` não devem receber incremento antecipado para instalar esta funcionalidade.

### T3 — Validar o lote e diagnosticar falhas em conjunto

**Dependência:** T2 concluída. **Escritas esperadas durante comandos:** apenas fixtures/caches locais autorizados e artefatos normais na worktree; nunca a raiz principal.

Revalidar scripts/hook antes do primeiro comando. Com ambiente íntegro, usar os comandos já existentes, nesta ordem lógica:

```bash
npm run check:lockfile
npm run test
npm run type-check:test
npm run lint
npm run build
```

- Gate de integridade reprovado bloqueia validações dependentes. Não chamar binários diretamente, remover prehook, usar `ignoreConfig` ou ignorar a falha como bypass.
- `npm run test` é a suíte completa: inclui os testes novos e os arquiteturais existentes. Não executar também um teste focal sobre a mesma revisão sem uma falha ou dúvida concreta.
- `npm run build` já executa `vue-tsc`; não repetir `npm run type-check` para a mesma revisão sem motivo.
- Observar versões antes/depois do build comum; não deve haver incremento. O fato de a CI chamar esse script é revisado por leitura, sem disparar pipeline ou release.
- Corrigir falhas em lote e revalidar os checks afetados após concluir o lote. Registrar todas as falhas, inclusive da suíte completa. Falhas persistentes exigem diagnóstico de causa; não ampliar escopo para corrigir baseline sem estabelecer causalidade e autorização.
- Se a suíte falhar no setup, agrupar diagnóstico de resoluções/Pinia/dependências antes de repetir testes equivalentes. Não adulterar a configuração global para fazer só o novo teste passar.
- Não executar `npm run verify` além desses componentes sobre a mesma revisão como rotina. Se houver pedido posterior de pré-release, usar o gate completo `verify`, incluindo consumidores, navegador, cobertura, benchmarks, árvore e segurança, sem alegar que esta validação parcial o substitui.

**Saída:** verificações com comando, revisão real de conteúdo e exit code, ou bloqueio explícito com próxima ação.

### T4 — Aceite pelo botão e revisão de entrega

**Dependência:** T3 aprovada. **Escritas esperadas:** incremento em `package.json`/`package-lock.json` e artefatos do build dentro desta worktree.

1. Antes do clique, verificar no editor qual projeto/tarefa/diretório será executado. Se houver seleção de raiz principal ou outra worktree, não clicar. Não hardcodificar caminho absoluto nem mudar a extensão para forçar o teste.
2. Registrar a versão inicial real `V`, os três campos, `HEAD`, tags e estado do índice. Não presumir ainda ser `1.1.2`. Informar que o aceite manual produz um incremento real; não executar um comando separado de versionamento para preparar o teste.
3. Acionar o botão uma vez, aguardar conclusão com limite de espera e consultar logs/resultados quando houver informação nova. Confirmar `V → patch(V)`, build iniciado depois da atualização e nenhum commit/tag/push/publicação. Comparar também índice para detectar staging indevido. O fato de arquivos de versão ficarem modificados é esperado.
4. Não executar segundo clique apenas para confirmar o que as fixtures já cobrem. Se o editor não estiver acessível, registrar T4 como `manualPending` com próxima ação: abrir esta worktree no MaxCode e realizar o procedimento acima. Dublês não comprovam o clique real.
5. Se o build falhar, registrar `validationFailed` e preservar versão já incrementada. Se apenas notificação/som falhar, separar esse resultado do build e do incremento, sem repetir automaticamente a tarefa. Cancelamento preserva resultados parciais e pendências.
6. Revisar diff contra R1–R7: nenhum incremento global, alteração de dependência, mudança de release ou escrita fora de escopo. Fazer revisão independente no marco de entrega quando houver revisor disponível; não exige agentes paralelos nem revisões a cada microedição. Submeter o diff bruto à verificação de entrega configurada no projeto, sem usá-la como substituto de testes.
7. Entregar resumo fiel e pendências; preservar worktree e alterações para integração pelo usuário/MaxCode. Não commitar, mergear, publicar ou limpar worktree.

## 6. Matriz de aceite por tarefa

| Tarefa / requisito | Evidência observável | Testes ou checks pertinentes | Revisão pelo risco / manual |
|---|---|---|---|
| T1 / isolamento | Raiz/branch corretas, mudanças preservadas e fixture/cache dentro da worktree | Leitura Git, scripts e caminhos efetivos | Dependências compartilhadas não podem ser modificadas; bloquear se necessário. |
| T2–T3 / R1 | Prefixo real da tarefa avança `1.1.2 → 1.1.3 → 1.1.4`; stub lê nova versão | Novo teste arquitetural e fixture com duas execuções | Revisar ordem `version && build`, sem prefixo duplicado. |
| T2–T3 / R1, extremos | `1.1.9 → 1.1.10`, sem mudar major/minor | Fixture específica | Não usar soma decimal ou versão hardcoded. |
| T2–T3 / R2 | Os três campos são iguais após cada execução; árvore de dependências da fixture não muda | Asserções explícitas dos JSONs, `check:lockfile` no projeto | Leitura do diff dos manifests após aceite; gate existente sozinho não cobre igualdade da versão. |
| T2–T4 / R3 | Flags presentes, marcadores de hooks ausentes; HEAD/tags/índice preservados | Contrato da tarefa e fixtures com hooks inofensivos | Comparação Git antes/depois do clique; não testar via release. |
| T2–T3 / R4 | `scripts.build`, `verify`, release e tarefa de release intactos; build comum mantém versão | Teste estático, leitura do workflow e `npm run build` | Não introduzir `prebuild`; não rodar release/CI externos. |
| T2–T3 / R5 | Versão inválida na fixture falha antes do stub de build; nenhum marcador de build criado | Fixture de falha do npm e código não zero | Não contornar com `--force`. |
| T2–T3 / R5 | Stub de build falha com código conhecido; incremento permanece e passo de sucesso não roda | Fixture do prefixo com marcador local após o build | Não executar notificações reais nos testes; evitar rollback automático. |
| T2–T4 / R6 | Sufixo/opções iguais ao baseline; botão executa no diretório certo | Contrato estático e logs de execução manual | Versão instalada lida não comprova versão ativa. Botão sem acesso fica pendente. |
| T2–T4 / R7 | README coerente, suíte/tipos/lint/build com evidências da revisão atual | Comandos da T3 e revisão de documentação | Nunca declarar validação integral com falha vigente ou T4 pendente. |

## 7. Riscos, operação e recuperação

- **Incrementos após falha:** decisão explícita desta proposta. Eles não equivalem a versões publicadas, e lacunas são possíveis. Não decrementar automaticamente.
- **Lockfile parcialmente gravado:** npm não garante transação. Se os três campos divergirem, interromper, preservar evidências sem segredos e estabelecer correção mínima dos campos com autorização; não reinstalar dependências ou sobrescrever manifest completo.
- **Concorrência:** duas execuções forçadas podem disputar arquivos. Não adicionar concorrência; aguardar a tarefa anterior terminar. Garantia multiexecutor exigiria outro escopo.
- **Working directory:** ponto crítico de segurança. Confirmação manual bloqueia execução em raiz principal. O plano não autoriza corrigir a extensão se a seleção não permitir a worktree.
- **Git e hooks:** flag explícita impede commit/tag no versionamento; nenhuma publicação é necessária. Não usar `npm run release`, `git add .` ou comandos de integração para testar.
- **Notificação enganosa existente:** anuncia commit/push que não acontecem. Está registrada separadamente e não será corrigida disfarçadamente nesta tarefa.
- **Ferramentas compartilhadas:** npm encontrado difere da declaração e dependências são compartilhadas. Confirmar compatibilidade antes da validação; não instalar nem mutar ferramentas silenciosamente.
- **Recuperação:** remover o prefixo da tarefa desativa o comportamento futuro, mas isso exige edição autorizada e não desfaz versões já incrementadas. Nunca usar reset/checkout amplo ou apagar arquivos alheios.
- **Operação externa:** não há endpoints, migrações, credenciais ou fornecedores a habilitar. Não há deploy ou publicação neste plano.

## 8. Progresso, evidências e handoff em Execute

Somente durante Execute, registrar progresso após marcos e no handoff em `docs/plans/wt-91c313d0/execution-state.json`. Esse arquivo **não é autorizado nem criado nesta sessão Plan**.

- Vincular o registro ao SHA256 real do conteúdo de `plan.md` e às revisões factuais do conteúdo de cada tarefa; nunca usar nomes de branch, rótulos ou hashes inventados como revisão.
- Novos registros devem obedecer ao esquema estrito `version: 2` do executor/MaxCode, sem campos extras. Validar pelo contrato real antes de escrever; não inventar campos para preencher lacunas. Não usar `blocker`, `diagnostic`, `branchSync`, `durableSync` ou `followUp`. Motivos e próxima ação cabem em `nextAction`, com até 512 caracteres.
- Registrar tarefas, estado e arquivos com status de tarefa apenas `pending`, `running`, `completed`, `blocked`, `manualPending` ou `validationFailed`.
- A verificação deve usar `verification: { revision: SHA256, checks: [{ command, revision: SHA256, result, exitCode? }] }`, respeitando o restante do esquema estrito. Comandos têm limite de 4.096 caracteres.
- Resultado de validação e de check aceita somente `passed`, `failed` ou `pending`; `blocked` é status de tarefa, não resultado de validação/check. `passed` exige `exitCode: 0`; `failed` exige inteiro diferente de zero; `pending` não aceita exitCode.
- Registrar comandos realmente executados e todas as falhas. Não inferir aprovação ou exit code de `tool:end.ok`. Checks vazios, falha vigente ou ausência de resultado vigente impedem validação integral.
- Resultados são vinculados ao conteúdo verificado. Reaproveitar checks aprovados sem alteração relevante; se o aceite manual mudar versões, registrar a revisão nova e distinguir checks sobre a revisão anterior, inspecionando o delta antes de decidir revalidação. Não executar novo clique só por mudança de hash.
- Registro versão 1 preexistente continua compatível, mas não prova validação integral automaticamente. Registro autodeclarado não comprova execução nativa nem identifica checks omitidos.
- Handoff informa T1–T4, arquivos alterados, verificações válidas, falhas e próxima ação concreta. Retomada executa lacunas, não repete cegamente toda a esteira.

Não há necessidade de delegação para este escopo. Se futuramente houver múltiplos executores, T1 precede T2; configuração/testes e README podem ser separados apenas com arquivos de escrita distintos e contexto mínimo com referências a estes documentos. T3 começa depois de concluir todo o lote; T4 depende de T3. Revisões independentes ficam nos marcos de risco/entrega.

## 9. Revisão do plano

- O ponto de alteração corresponde ao botão identificado no projeto e reconhecido no bundle instalado, sem exigir mudança no frontend.
- A solução é pequena: uma alteração de comando, uma suíte de regressão e uma nota documental; sem dependências ou wrappers novos.
- Os contratos fora do pedido permanecem preservados, especialmente o build comum, a CI limpa e o incremento próprio do release.
- Dependências críticas, efeitos de falha, isolamento, limitações de acesso e pendência do botão real estão explícitos.
- Cada requisito R1–R7 está ligado a evidência e validação. Nenhuma validação futura foi apresentada como executada.
- Não existe decisão essencial pendente que exija entrevista para preparar esta proposta. O comportamento após falha de build é proposta explícita para revisão, não pergunta bloqueante.
